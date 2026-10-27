import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// Endpoint to generate full Bab I-V and RTL Matrix
app.post('/api/generate-report', async (req, res) => {
  try {
    const { agencyInfo, stats, services, demographics, notes } = req.body;

    if (!stats || !services || !agencyInfo) {
      return res.status(400).json({ error: 'Data laporan dan kalkulasi statistik wajib disertakan.' });
    }

    const systemInstruction = `Anda adalah SI-AGen SKM, Agen AI Spesialis Penyusunan Laporan Survei Kepuasan Masyarakat (SKM) untuk instansi pemerintah Republik Indonesia.
Tugas Anda adalah menyusun naskah dinas resmi draf Laporan SKM Bab I sampai Bab V beserta Matriks Rencana Tindak Lanjut (RTL) yang ketat mengacu pada:
1. Permenpan RB No. 14 Tahun 2017 tentang Pedoman Penyusunan Survei Kepuasan Masyarakat Unit Penyelenggara Pelayanan Publik.
2. Kaidah tata naskah dinas birokrasi pemerintahan Indonesia (Bahasa Indonesia baku, objektif, analitis, konstruktif, dan formal).
3. PENTING: KONSISTENSI ANGKA 100%. Anda dilarang keras mengubah, mengarang, atau membulatkan sembarangan nilai IKM, jumlah responden, persentase demografi, maupun urutan peringkat layanan. Seluruh angka pada narasi harus identik persis dengan data hasil hitung deterministik yang diberikan.`;

    const prompt = `Berikut adalah data resmi hasil perhitungan deterministik SKM:

[PROFIL INSTANSI]
- Nama Instansi: ${agencyInfo.namaInstansi || 'Pemerintah Daerah'}
- Unit Kerja / Penyelenggara: ${agencyInfo.unitKerja || 'Unit Pelayanan Publik'}
- Ruang Lingkup Layanan: ${agencyInfo.ruangLingkup || 'Pelayanan Publik'}
- Dasar Hukum Tambahan: ${agencyInfo.dasarHukum || 'UU No. 25 Tahun 2009 tentang Pelayanan Publik; Permenpan RB No. 14 Tahun 2017'}
- Periode Survei: ${agencyInfo.periode || 'Triwulan III'} Tahun ${agencyInfo.tahun || '2026'}
- Tanggal Pelaporan: ${agencyInfo.tanggalLaporan || '27 Oktober 2026'}
- Pimpinan / Penandatangan: ${agencyInfo.namaPimpinan || 'Kepala Unit'} (NIP: ${agencyInfo.nipPimpinan || '-'})
- Catatan / Kendala Lapangan: ${notes || 'Keterbatasan loket saat jam sibuk dan perlunya percepatan integrasi antrean digital.'}

[STATISTIK HASIL HITUNG RESMI (DETERMINISTIK)]
- Total Responden: ${stats.totalResponden} orang
- Nilai Rerata IKM Unit: ${stats.rerataIKM}
- Kategori Mutu: Mutu ${stats.mutuUnit} (Kinerja: ${stats.predikatUnit})
- Konversi Skala 4: ${stats.konversiSkala4}

[LAYANAN DENGAN NILAI IKM TERENDAH (PRIORITAS RTL)]
${stats.layananTerendah?.map((s: any, idx: number) => `${idx + 1}. ${s.namaLayanan}: Nilai IKM ${s.nilaiIKM} (Mutu ${s.mutu})`).join('\n') || '-'}

[DAFTAR SELURUH LAYANAN & NILAI IKM]
${services.map((s: any, idx: number) => `${idx + 1}. ${s.namaLayanan}: IKM ${s.nilaiIKM} (Mutu ${s.mutu})`).join('\n')}

[REKAP PROFIL DEMOGRAFI RESPONDEN]
- Jenis Kelamin: Laki-laki: ${demographics.jenisKelamin?.pria || 0} orang (${stats.demografiPct?.gender?.pria || '0'}%), Perempuan: ${demographics.jenisKelamin?.wanita || 0} orang (${stats.demografiPct?.gender?.wanita || '0'}%)
- Usia Terbanyak: ${stats.demografiHighlights?.usiaTerbanyak || '-'}
- Pendidikan Terbanyak: ${stats.demografiHighlights?.pendidikanTerbanyak || '-'}
- Pekerjaan Terbanyak: ${stats.demografiHighlights?.pekerjaanTerbanyak || '-'}

Silakan buatkan draf laporan lengkap dengan 5 Bab dan Matriks RTL.
Format JSON yang diharapkan:
{
  "bab1": "Narasi lengkap Bab I - Pendahuluan (Latar Belakang, Maksud dan Tujuan, Dasar Hukum, Ruang Lingkup Layanan)",
  "bab2": "Narasi lengkap Bab II - Metodologi (Metode Survei, Jumlah Responden, Waktu dan Lokasi, Rumus dan Skala Penilaian IKM Permenpan RB No. 14/2017)",
  "bab3": "Narasi lengkap Bab III - Hasil Survei (Analisis Profil Responden berdasarkan Jenis Kelamin, Usia, Pendidikan, Pekerjaan; Rekapitulasi Nilai IKM per layanan; Nilai Rata-rata IKM Unit dan Kategori Mutu)",
  "bab4": "Narasi lengkap Bab IV - Analisis dan Pembahasan (Analisis Mendalam 2-3 Layanan Terendah, Analisis Akar Masalah berbasis aspek Man/Method/Machine/Material, Hubungan dengan Profil Demografi Dominan dan Implikasi terhadap Standar Pelayanan)",
  "bab5": "Narasi lengkap Bab V - Penutup (Kesimpulan capaian, Saran strategis perbaikan)",
  "rtlMatrix": [
    {
      "no": 1,
      "layananPrioritas": "Nama Layanan Terendah 1",
      "masalahUtama": "Akar masalah utama yang diidentifikasi dari data dan kendala lapangan",
      "rencanaTindakLanjut": "Tindakan konkret perbaikan terukur",
      "penanggungJawab": "Unit / Sub-bagian yang bertanggung jawab",
      "targetWaktu": "Triwulan IV 2026",
      "indikatorKeberhasilan": "Target kenaikan nilai IKM menjadi minimal 80.00 (Mutu B)"
    }
  ]
}`;

    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY tidak dikonfigurasi. Silakan gunakan fallback otomatis.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bab1: { type: Type.STRING },
            bab2: { type: Type.STRING },
            bab3: { type: Type.STRING },
            bab4: { type: Type.STRING },
            bab5: { type: Type.STRING },
            rtlMatrix: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  no: { type: Type.INTEGER },
                  layananPrioritas: { type: Type.STRING },
                  masalahUtama: { type: Type.STRING },
                  rencanaTindakLanjut: { type: Type.STRING },
                  penanggungJawab: { type: Type.STRING },
                  targetWaktu: { type: Type.STRING },
                  indikatorKeberhasilan: { type: Type.STRING },
                },
                required: ['no', 'layananPrioritas', 'masalahUtama', 'rencanaTindakLanjut', 'penanggungJawab', 'targetWaktu', 'indikatorKeberhasilan'],
              },
            },
          },
          required: ['bab1', 'bab2', 'bab3', 'bab4', 'bab5', 'rtlMatrix'],
        },
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating report with Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghasilkan laporan dengan Agen AI',
    });
  }
});

// Endpoint to regenerate single chapter (FR-11)
app.post('/api/regenerate-chapter', async (req, res) => {
  try {
    const { chapterKey, customInstruction, agencyInfo, stats, services, demographics, notes, currentDraft } = req.body;

    if (!chapterKey || !stats || !agencyInfo) {
      return res.status(400).json({ error: 'Parameter tidak lengkap.' });
    }

    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY tidak dikonfigurasi.' });
    }

    const systemInstruction = `Anda adalah SI-AGen SKM. Tugas Anda meregenerasi naskah dinas resmi spesifik untuk satu bab laporan SKM Permenpan RB No. 14/2017.
Pastikan akurasi statistik dan konsistensi 100% dengan data yang diberikan.`;

    const prompt = `Regenerasi bagian: ${chapterKey.toUpperCase()}
Instruksi Tambahan dari Pengguna: ${customInstruction || 'Perdalam analisis dan gunakan gaya bahasa resmi birokrasi pemerintahan yang lebih lugas.'}

Profil Instansi: ${agencyInfo.namaInstansi} - ${agencyInfo.unitKerja} (${agencyInfo.periode} ${agencyInfo.tahun})
Total Responden: ${stats.totalResponden}
Nilai IKM Rerata: ${stats.rerataIKM} (Mutu ${stats.mutuUnit} - ${stats.predikatUnit})
Layanan Terendah: ${stats.layananTerendah?.map((l: any) => `${l.namaLayanan} (${l.nilaiIKM})`).join(', ')}
Catatan Lapangan: ${notes || '-'}

Naskah Saat Ini:
${currentDraft || '-'}

Hasilkan naskah bab yang baru, lengkap, dan siap cetak. Kembalikan dalam format JSON: {"content": "..."}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
          },
          required: ['content'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error regenerating chapter:', error);
    return res.status(500).json({ error: error.message || 'Gagal meregenerasi bab' });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`SI-AGen SKM server running on http://localhost:${port}`);
  });
}

startServer();
