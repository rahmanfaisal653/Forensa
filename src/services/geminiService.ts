import { generateChat, loadSettings } from './aiClient';

/**
 * Generate a journal forensics / matchmaker analysis via the user's
 * configured AI provider. Falls back to the built-in Gemini default
 * (GEMINI_API_KEY from env) when the user has not configured a custom
 * provider in Settings.
 *
 * The original SYSTEM_INSTRUCTION is preserved verbatim (see below).
 */

export const SYSTEM_INSTRUCTION = `Kamu adalah "Forensa", sebuah AI analitik tingkat lanjut yang berperan sebagai Chief Editor Jurnal Top Tier global (Q1/Q2) sekaligus Pakar Scientometric sekaligus Professor top 1% dunia versi WoS highly cited researcher dan peraih nobel bidang bisnis dan manajemen. Tugasmu adalah melakukan "Forensik Jurnal" dan "Kalkulator Kesesuaian Manuskrip (Matchmaker)" berdasarkan data abstrak dari database publikasi ilmiah internasional bereputasi.

ATURAN SANGAT PENTING:
1. JANGAN PERNAH menyebut kata "Scopus". Gunakan frasa: "database publikasi ilmiah internasional bereputasi".
2. Tulis dengan gaya bahasa manusia (tingkat 'Burstiness' dan 'Perplexity' tinggi), argumentatif, tajam, dan analitis layaknya review dari Editor in Chief.
3. Karena saat ini berada di fase pengujian, JIKA pengguna tidak melampirkan data metrik mentah, kamu HARUS mensimulasikan data analitik yang realistis berdasarkan pengetahuanmu tentang jurnal yang disebutkan.`;

export async function generateAnalysis(
  mode: 'forensics' | 'matchmaker',
  journalName: string,
  manuscript: string
): Promise<string> {
  const settings = loadSettings();

  // If the user configured a custom provider (URL + key + model), use it.
  if (settings.serverUrl && settings.apiKey && settings.model) {
    const prompt = buildPrompt(mode, journalName, manuscript);
    return generateChat(settings, SYSTEM_INSTRUCTION, prompt);
  }

  // Default: Gemini via the official SDK. Priority:
  // 1. geminiApiKey dari settings (default built-in, bisa diganti user)
  // 2. process.env.GEMINI_API_KEY (fallback terakhir)
  return generateWithGemini(mode, journalName, manuscript, settings.geminiApiKey);
}

function buildPrompt(
  mode: 'forensics' | 'matchmaker',
  journalName: string,
  manuscript: string
): string {
  if (mode === 'forensics') {
    return `Tolong berikan LUARAN 1: FORENSIK JURNAL untuk jurnal berikut:
Nama Jurnal: ${journalName}

Berikan output dengan struktur berikut:
1. METRIK & IDENTITAS JURNAL:
   - Sebutkan estimasi Kuartil (Q1/Q2/dll), Indeksasi (apakah terindeks WoS?), Impact Factor, dan sejak tahun berapa jurnal ini beroperasi.
2. PROPORSI JENIS MANUSKRIP (TIPOLOGI 5 TAHUN TERAKHIR):
   - Jelaskan persentase/kecenderungan jenis naskah yang paling sering diterima (Empiris, Conceptual Paper, Literature Review/SLR, Opinion, Editorial).
3. SINTESIS GRAND THEORY (2021-2026):
   - Sebutkan teori-teori utama (Grand & Middle-Range Theory) yang paling sering dipakai oleh artikel di jurnal ini.
4. DNA METODOLOGI (FOKUS PLS-SEM & KUANTITATIF):
   - Bedah metodologi yang disukai jurnal ini. Jika kuantitatif (khususnya PLS-SEM), jelaskan ekspektasi jurnal ini terhadap: Unit Analisis (Individu/Organisasi), Desain Pengambilan Data (Cross-sectional/Wave), Syarat Populasi & Sampel, serta kewajiban pengujian bias seperti Common Method Bias (CMB).
5. KONTEKS & FENOMENA RISET:
   - Fenomena empiris atau industri apa yang saat ini sedang menjadi "anak emas" (hot topics) di jurnal ini.`;
  }
  return `Tolong berikan LUARAN 2: KALKULATOR KESESUAIAN (MATCHMAKER) untuk naskah berikut terhadap jurnal target:
Nama Jurnal TARGET: ${journalName}
Judul/Abstrak Manuskrip: ${manuscript}

Berikan output dengan struktur berikut:
1. SKOR KESESUAIAN (SUITABILITY MATCH):
   - Berikan skor persentase (0% - 100%) seberapa cocok naskah ini dengan "DNA" jurnal target. Gunakan format indikator (Sangat Rendah / Rawan Desk-Reject / Moderat / Sangat Relevan).
2. ANALISIS KEKUATAN (MATCHED CRITERIA):
   - Jelaskan aspek apa dari naskah (teori, konteks, atau metode) yang sudah sejalan dengan selera jurnal.
3. ANALISIS KESENJANGAN (POTENSI DESK-REJECT):
   - Kritik naskah dengan tajam. Temukan ketidakcocokan antara naskah dengan karakteristik jurnal (misal: "Jurnal ini tidak lagi menerima model PLS-SEM dasar tanpa uji CMB", atau "Tipologi naskah anda konseptual, padahal jurnal ini 90% menerbitkan empiris").
4. REKOMENDASI REVISI STRATEGIS:
   - Berikan 3-4 langkah konkrit yang HARUS dilakukan penulis sebelum men-submit naskah agar lolos dari desk-reject editor.`;
}

async function generateWithGemini(
  mode: 'forensics' | 'matchmaker',
  journalName: string,
  manuscript: string,
  apiKey: string
): Promise<string> {
  const MODEL_NAME = 'gemini-3.1-pro-preview';
  const prompt = buildPrompt(mode, journalName, manuscript);

  // Jika user mengisi key Gemini sendiri → panggil langsung dari browser.
  if (apiKey) {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    return response.text || 'Tidak ada respons dari sistem.';
  }

  // Jika kosong → pakai key default server (.env) via proxy /api/gemini.
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_NAME,
      system: SYSTEM_INSTRUCTION,
      prompt,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gagal menghubungi Gemini (${res.status})${text ? ': ' + text : ''}`);
  }
  const data = await res.json();
  return data?.text || 'Tidak ada respons dari sistem.';
}
