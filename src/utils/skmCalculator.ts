import { AgencyInfo, CalculatedStats, DemographicsData, ReportDraft, RTLItem, ServiceItem } from '../types/skm';

/**
 * Konversi Nilai IKM ke Kategori Mutu & Kinerja Permenpan RB No. 14 Tahun 2017
 * Skala 25 - 100:
 * 88,31 - 100,00 : Mutu A (Sangat Baik)
 * 76,61 - 88,30  : Mutu B (Baik)
 * 65,31 - 76,60  : Mutu C (Kurang Baik)
 * 25,00 - 65,30  : Mutu D (Tidak Baik)
 */
export function getMutuPermenpan(nilaiIKM: number): { mutu: 'A' | 'B' | 'C' | 'D'; predikat: string } {
  if (nilaiIKM >= 88.31) {
    return { mutu: 'A', predikat: 'Sangat Baik' };
  } else if (nilaiIKM >= 76.61) {
    return { mutu: 'B', predikat: 'Baik' };
  } else if (nilaiIKM >= 65.31) {
    return { mutu: 'C', predikat: 'Kurang Baik' };
  } else {
    return { mutu: 'D', predikat: 'Tidak Baik' };
  }
}

/**
 * Menghitung Statistik Deterministik & Validasi Data (FR-03, FR-04, FR-05, FR-06)
 */
export function calculateSKMStats(services: ServiceItem[], demographics: DemographicsData): CalculatedStats {
  const genderTotal = (demographics.jenisKelamin?.pria || 0) + (demographics.jenisKelamin?.wanita || 0);
  const usiaTotal = Object.values(demographics.usia || {}).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const pendidikanTotal = Object.values(demographics.pendidikan || {}).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const pekerjaanTotal = Object.values(demographics.pekerjaan || {}).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

  // Validasi sinkronisasi total responden (FR-03)
  const isSynchronized =
    genderTotal === usiaTotal &&
    usiaTotal === pendidikanTotal &&
    pendidikanTotal === pekerjaanTotal &&
    genderTotal > 0;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (services.length === 0) {
    errors.push('Belum ada layanan yang dimasukkan. Minimal masukkan 1 layanan.');
  }

  services.forEach((s, idx) => {
    if (!s.namaLayanan || s.namaLayanan.trim() === '') {
      errors.push(`Baris ${idx + 1}: Nama layanan tidak boleh kosong.`);
    }
    if (isNaN(s.nilaiIKM) || s.nilaiIKM < 25 || s.nilaiIKM > 100) {
      errors.push(`Layanan "${s.namaLayanan || `Baris ${idx + 1}`}": Nilai IKM (${s.nilaiIKM}) di luar rentang standar Permenpan RB (25.00 - 100.00).`);
    }
  });

  if (!isSynchronized && genderTotal > 0) {
    warnings.push(
      `Total responden belum sinkron: Gender (${genderTotal}), Usia (${usiaTotal}), Pendidikan (${pendidikanTotal}), Pekerjaan (${pekerjaanTotal}). Sistem menggunakan angka Gender (${genderTotal}) sebagai basis acuan.`
    );
  }

  const totalResponden = genderTotal > 0 ? genderTotal : Math.max(usiaTotal, pendidikanTotal, pekerjaanTotal, 1);

  // Hitung rerata IKM
  const sumIKM = services.reduce((acc, s) => acc + (Number(s.nilaiIKM) || 0), 0);
  const rawRerata = services.length > 0 ? sumIKM / services.length : 0;
  const rerataIKM = Number(rawRerata.toFixed(2));
  const { mutu: mutuUnit, predikat: predikatUnit } = getMutuPermenpan(rerataIKM);
  const konversiSkala4 = Number((rerataIKM / 25).toFixed(2));

  // Urutkan layanan
  const layananSorted = [...services]
    .map((s) => {
      const { mutu, predikat } = getMutuPermenpan(s.nilaiIKM);
      const selisihRerata = Number((s.nilaiIKM - rerataIKM).toFixed(2));
      return { ...s, mutu, predikat, selisihRerata };
    })
    .sort((a, b) => a.nilaiIKM - b.nilaiIKM);

  // Ambil 2 - 3 layanan terendah (FR-06)
  const lowestCount = Math.min(3, Math.max(1, services.length));
  const layananTerendah = layananSorted.slice(0, lowestCount);

  // Hitung persentase demografi (FR-04)
  const calcPct = (val: number, total: number) => (total > 0 ? ((val / total) * 100).toFixed(1) : '0.0');

  const demografiPct = {
    gender: {
      pria: calcPct(demographics.jenisKelamin?.pria || 0, genderTotal || 1),
      wanita: calcPct(demographics.jenisKelamin?.wanita || 0, genderTotal || 1),
    },
    usia: {
      dibawah20: calcPct(demographics.usia?.dibawah20 || 0, usiaTotal || 1),
      usia20_29: calcPct(demographics.usia?.usia20_29 || 0, usiaTotal || 1),
      usia30_39: calcPct(demographics.usia?.usia30_39 || 0, usiaTotal || 1),
      usia40_49: calcPct(demographics.usia?.usia40_49 || 0, usiaTotal || 1),
      diatas50: calcPct(demographics.usia?.diatas50 || 0, usiaTotal || 1),
    },
    pendidikan: {
      smpKebawah: calcPct(demographics.pendidikan?.smpKebawah || 0, pendidikanTotal || 1),
      smaSmk: calcPct(demographics.pendidikan?.smaSmk || 0, pendidikanTotal || 1),
      diploma: calcPct(demographics.pendidikan?.diploma || 0, pendidikanTotal || 1),
      sarjanaS1: calcPct(demographics.pendidikan?.sarjanaS1 || 0, pendidikanTotal || 1),
      pascasarjana: calcPct(demographics.pendidikan?.pascasarjana || 0, pendidikanTotal || 1),
    },
    pekerjaan: {
      asnTniPolri: calcPct(demographics.pekerjaan?.asnTniPolri || 0, pekerjaanTotal || 1),
      pegawaiSwasta: calcPct(demographics.pekerjaan?.pegawaiSwasta || 0, pekerjaanTotal || 1),
      wiraswasta: calcPct(demographics.pekerjaan?.wiraswasta || 0, pekerjaanTotal || 1),
      pelajarMahasiswa: calcPct(demographics.pekerjaan?.pelajarMahasiswa || 0, pekerjaanTotal || 1),
      lainnya: calcPct(demographics.pekerjaan?.lainnya || 0, pekerjaanTotal || 1),
    },
  };

  // Cari kelompok terbanyak & tersedikit
  const getExtremes = (dataObj: Record<string, number>, labelMap: Record<string, string>) => {
    const entries = Object.entries(dataObj);
    if (entries.length === 0) return { max: '-', min: '-' };
    let maxK = entries[0][0];
    let minK = entries[0][0];
    let maxV = entries[0][1];
    let minV = entries[0][1];

    entries.forEach(([k, v]) => {
      if (v > maxV) {
        maxV = v;
        maxK = k;
      }
      if (v < minV) {
        minV = v;
        minK = k;
      }
    });

    return {
      max: `${labelMap[maxK] || maxK} (${maxV} orang)`,
      min: `${labelMap[minK] || minK} (${minV} orang)`,
    };
  };

  const usiaLabels: Record<string, string> = {
    dibawah20: '< 20 Tahun',
    usia20_29: '20 - 29 Tahun',
    usia30_39: '30 - 39 Tahun',
    usia40_49: '40 - 49 Tahun',
    diatas50: '≥ 50 Tahun',
  };
  const pendLabels: Record<string, string> = {
    smpKebawah: 'SMP / Sederajat ke bawah',
    smaSmk: 'SMA / SMK / Sederajat',
    diploma: 'Diploma (D1-D4)',
    sarjanaS1: 'Sarjana (S1)',
    pascasarjana: 'Pascasarjana (S2/S3)',
  };
  const pekerLabels: Record<string, string> = {
    asnTniPolri: 'PNS / TNI / Polri',
    pegawaiSwasta: 'Pegawai Swasta / BUMN',
    wiraswasta: 'Wiraswasta / Pedagang',
    pelajarMahasiswa: 'Pelajar / Mahasiswa',
    lainnya: 'Lainnya / Ibu Rumah Tangga',
  };

  const usiaExt = getExtremes(demographics.usia, usiaLabels);
  const pendExt = getExtremes(demographics.pendidikan, pendLabels);
  const pekerExt = getExtremes(demographics.pekerjaan, pekerLabels);

  return {
    totalResponden,
    rerataIKM,
    mutuUnit,
    predikatUnit,
    konversiSkala4,
    layananSorted,
    layananTerendah,
    demografiPct,
    demografiHighlights: {
      usiaTerbanyak: usiaExt.max,
      usiaTersedikit: usiaExt.min,
      pendidikanTerbanyak: pendExt.max,
      pendidikanTersedikit: pendExt.min,
      pekerjaanTerbanyak: pekerExt.max,
      pekerjaanTersedikit: pekerExt.min,
    },
    validationIssues: {
      errors,
      warnings,
      isSynchronized,
      genderTotal,
      usiaTotal,
      pendidikanTotal,
      pekerjaanTotal,
    },
  };
}

/**
 * FR-10: Pengecekan Konsistensi Angka (Verifikasi seluruh angka pada teks vs input)
 */
export function checkReportConsistency(
  draft: ReportDraft,
  stats: CalculatedStats,
  services: ServiceItem[]
) {
  const combinedText = `${draft.bab1} ${draft.bab2} ${draft.bab3} ${draft.bab4} ${draft.bab5}`;

  const findings: Array<{
    targetNumber: string | number;
    label: string;
    status: 'pass' | 'missing' | 'mismatch';
    detail: string;
  }> = [];

  // 1. Cek Rerata IKM
  const rerataStr = stats.rerataIKM.toFixed(2);
  const rerataAlt = stats.rerataIKM.toString().replace('.', ',');
  const hasRerata = combinedText.includes(rerataStr) || combinedText.includes(rerataAlt);
  findings.push({
    targetNumber: stats.rerataIKM,
    label: 'Nilai Rerata IKM Unit',
    status: hasRerata ? 'pass' : 'missing',
    detail: hasRerata
      ? `Nilai IKM ${stats.rerataIKM} tercatat konsisten pada narasi.`
      : `Nilai IKM ${stats.rerataIKM} belum ditemukan pada narasi laporan.`,
  });

  // 2. Cek Total Responden
  const respStr = stats.totalResponden.toString();
  const hasResp = combinedText.includes(respStr);
  findings.push({
    targetNumber: stats.totalResponden,
    label: 'Jumlah Total Responden',
    status: hasResp ? 'pass' : 'missing',
    detail: hasResp
      ? `Angka ${stats.totalResponden} responden tercatat tepat pada naskah.`
      : `Angka total responden (${stats.totalResponden}) tidak terdeteksi pada narasi.`,
  });

  // 3. Cek Layanan Terendah
  stats.layananTerendah.forEach((lt) => {
    const ikmStr = lt.nilaiIKM.toFixed(2);
    const ikmAlt = lt.nilaiIKM.toString().replace('.', ',');
    const hasIKM = combinedText.includes(ikmStr) || combinedText.includes(ikmAlt);
    const hasName = combinedText.toLowerCase().includes(lt.namaLayanan.toLowerCase());

    findings.push({
      targetNumber: lt.nilaiIKM,
      label: `Layanan Terendah: ${lt.namaLayanan}`,
      status: hasIKM && hasName ? 'pass' : 'missing',
      detail:
        hasIKM && hasName
          ? `Layanan ${lt.namaLayanan} dengan IKM ${lt.nilaiIKM} tercatat akurat.`
          : `Layanan ${lt.namaLayanan} (${lt.nilaiIKM}) perlu dipastikan konsistensi angkanya di Bab IV/RTL.`,
    });
  });

  const passedCount = findings.filter((f) => f.status === 'pass').length;
  const score = Math.round((passedCount / Math.max(findings.length, 1)) * 100);

  return {
    isConsistent: score >= 80,
    score,
    findings,
  };
}

/**
 * Fallback Generator Narasi Standar Permenpan RB No. 14 Tahun 2017
 * Digunakan jika koneksi API sedang dibatasi atau offline agar sistem 100% selalu berfungsi.
 */
export function generateDeterministicDraft(
  agencyInfo: AgencyInfo,
  stats: CalculatedStats,
  services: ServiceItem[],
  demographics: DemographicsData
): ReportDraft {
  const bab1 = `BAB I
PENDAHULUAN

1.1 Latar Belakang
Penyelenggaraan pelayanan publik yang berkualitas, transparan, dan akuntabel merupakan kewajiban konstitusional setiap instansi pemerintah. Sejalan dengan dinamika tuntutan masyarakat terhadap keterbukaan dan kepastian standar pelayanan pada era reformasi birokrasi, ${agencyInfo.unitKerja} ${agencyInfo.namaInstansi} terus berkomitmen untuk melakukan perbaikan tata kelola pelayanan publik yang berorientasi pada kepuasan pengguna layanan.

Pengukuran kepuasan masyarakat menjadi instrumen esensial dalam mengevaluasi efektivitas, efisiensi, dan keandalan sarana serta sumber daya aparatur pelayanan. Berdasarkan Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi (Permenpan RB) Nomor 14 Tahun 2017 tentang Pedoman Penyusunan Survei Kepuasan Masyarakat Unit Penyelenggara Pelayanan Publik, setiap penyelenggara pelayanan publik diwajibkan melakukan Survei Kepuasan Masyarakat (SKM) secara berkala minimal satu kali dalam setahun, dan dianjurkan per triwulan guna memonitor fluktuasi kinerja layanan.

Laporan SKM ${agencyInfo.periode} Tahun ${agencyInfo.tahun} ini disusun sebagai wujud pertanggungjawaban publik serta bahan telaah komprehensif bagi pimpinan instansi dalam merumuskan kebijakan berbasis bukti (evidence-based policy). Melalui laporan ini, kelemahan mendasar pada jenis-jenis pelayanan dapat dipetakan secara akurat untuk kemudian ditindaklanjuti secara sistematis pada periode triwulan berikutnya.

1.2 Maksud dan Tujuan
1.2.1 Maksud
Penyusunan laporan ini dimaksudkan untuk mengetahui tingkat kinerja pelayanan publik pada ${agencyInfo.unitKerja} ${agencyInfo.namaInstansi} secara berkala dan terukur berdasarkan persepsi langsung masyarakat penerima layanan.

1.2.2 Tujuan
1. Mengetahui Indeks Kepuasan Masyarakat (IKM) secara agregat dan per jenis layanan pada periode ${agencyInfo.periode} Tahun ${agencyInfo.tahun}.
2. Memetakan profil demografi penerima layanan (jenis kelamin, usia, tingkat pendidikan, dan pekerjaan) untuk memahami segmentasi masyarakat.
3. Mengidentifikasi kelemahan serta kendala operasional pada 2 sampai 3 layanan dengan nilai IKM terendah sebagai prioritas perbaikan.
4. Menyusun Matriks Rencana Tindak Lanjut (RTL) yang aplikatif, memiliki penanggung jawab definitif, target waktu penyelesaian, dan indikator keberhasilan yang jelas.

1.3 Dasar Hukum
Penyelenggaraan SKM dan penyusunan laporan ini berlandaskan pada ketentuan perundang-undangan berikut:
1. Undang-Undang Nomor 25 Tahun 2009 tentang Pelayanan Publik (Lembaran Negara Republik Indonesia Tahun 2009 Nomor 112).
2. Undang-Undang Nomor 23 Tahun 2014 tentang Pemerintahan Daerah sebagaimana telah beberapa kali diubah terakhir dengan Undang-Undang Nomor 9 Tahun 2015.
3. Peraturan Pemerintah Nomor 96 Tahun 2012 tentang Pelaksanaan Undang-Undang Nomor 25 Tahun 2009 tentang Pelayanan Publik.
4. Peraturan Menteri PANRB Nomor 14 Tahun 2017 tentang Pedoman Penyusunan Survei Kepuasan Masyarakat Unit Penyelenggara Pelayanan Publik.
${agencyInfo.dasarHukum ? `5. ${agencyInfo.dasarHukum}` : ''}

1.4 Ruang Lingkup Layanan
Ruang lingkup pelaksanaan survei ini mencakup seluruh jenis produk layanan yang diselenggarakan langsung oleh ${agencyInfo.unitKerja} ${agencyInfo.namaInstansi}, meliputi: ${services.map((s) => s.namaLayanan).join(', ')}.`;

  const bab2 = `BAB II
METODOLOGI SURVEI

2.1 Metode Pengumpulan Data
Pelaksanaan Survei Kepuasan Masyarakat (SKM) pada ${agencyInfo.unitKerja} ${agencyInfo.namaInstansi} dilakukan dengan pendekatan kuantitatif melalui pengisian kuesioner terstruktur, baik melalui terminal survei digital (e-SKM) maupun formulir survei manual bagi masyarakat yang telah selesai menerima pelayanan. Instrumen survei disusun dengan mengadopsi 9 (sembilan) unsur pelayanan publik sesuai Permenpan RB Nomor 14 Tahun 2017, yaitu:
1. Persyaratan Pelayanan;
2. Sistem, Mekanisme, dan Prosedur;
3. Waktu Penyelesaian;
4. Biaya/Tarif;
5. Produk Spesifikasi Jenis Pelayanan;
6. Kompetensi Pelaksana;
7. Perilaku Pelaksana;
8. Penanganan Pengaduan, Saran, dan Masukan;
9. Sarana dan Prasarana.

2.2 Jumlah Responden dan Penentuan Sampel
Populasi dalam survei ini adalah seluruh masyarakat yang mengakses layanan pada periode ${agencyInfo.periode} Tahun ${agencyInfo.tahun}. Penentuan jumlah sampel minimal mengacu pada tabel Morgan dan Krejcie atau ketentuan Permenpan RB No. 14 Tahun 2017. Total responden yang berhasil dihimpun dan diverifikasi validitasnya pada periode ini adalah sebanyak ${stats.totalResponden} responden. Seluruh data responden dijamin kerahasiaannya dan diolah secara anonim dalam bentuk agregat tanpa memuat identitas personal (sesuai kepatuhan Undang-Undang Perlindungan Data Pribadi).

2.3 Waktu dan Lokasi Pelaksanaan Survei
Survei dilaksanakan selama periode ${agencyInfo.periode} Tahun ${agencyInfo.tahun} bertempat di ruang pelayanan tatap muka ${agencyInfo.unitKerja} ${agencyInfo.namaInstansi} yang beralamat di ${agencyInfo.alamat || 'kantor pelayanan setempat'} serta melalui kanal pelayanan online terintegrasi.

2.4 Rumus Perhitungan dan Skala Mutu Pelayanan
Nilai Indeks Kepuasan Masyarakat (IKM) dihitung dengan menggunakan nilai rata-rata tertimbang dari masing-masing unsur pelayanan. Nilai dasar persepsi responden berkisar antara 1,00 sampai dengan 4,00, kemudian dikonversikan ke dalam skala 25,00 sampai dengan 100,00 dengan rumus:

Nilai IKM Konversi = Nilai Persepsi Rata-rata x 25

Tingkat mutu pelayanan dikategorisasikan berdasarkan rentang nilai baku Permenpan RB No. 14 Tahun 2017 sebagai berikut:
- Nilai IKM 88,31 - 100,00 : Nilai Persepsi 3,53 - 4,00 | Mutu Pelayanan A (Kinerja: Sangat Baik)
- Nilai IKM 76,61 - 88,30 : Nilai Persepsi 3,07 - 3,53 | Mutu Pelayanan B (Kinerja: Baik)
- Nilai IKM 65,31 - 76,60 : Nilai Persepsi 2,61 - 3,06 | Mutu Pelayanan C (Kinerja: Kurang Baik)
- Nilai IKM 25,00 - 65,30 : Nilai Persepsi 1,00 - 2,60 | Mutu Pelayanan D (Kinerja: Tidak Baik)`;

  const bab3 = `BAB III
HASIL SURVEI DAN PROFIL RESPONDEN

3.1 Profil Demografi Responden
Berdasarkan rekapitulasi data dari total ${stats.totalResponden} orang responden pada ${agencyInfo.periode} Tahun ${agencyInfo.tahun}, gambaran karakteristik demografi pengguna layanan dapat dirincikan sebagai berikut:

a. Jenis Kelamin:
Sebanyak ${demographics.jenisKelamin?.pria || 0} responden berjenis kelamin laki-laki (${stats.demografiPct.gender.pria}%) dan sebanyak ${demographics.jenisKelamin?.wanita || 0} responden berjenis kelamin perempuan (${stats.demografiPct.gender.wanita}%). Komposisi ini menunjukkan keseimbangan keterwakilan gender dalam pemanfaatan layanan publik pada instansi.

b. Kelompok Usia:
Distribusi usia responden menunjukkan bahwa kelompok penerima layanan terbanyak berada pada rentang ${stats.demografiHighlights.usiaTerbanyak}, sedangkan kelompok dengan proporsi paling sedikit adalah rentang ${stats.demografiHighlights.usiaTersedikit}. Rincian per kelompok:
- Usia < 20 Tahun: ${demographics.usia?.dibawah20 || 0} orang (${stats.demografiPct.usia.dibawah20}%)
- Usia 20 - 29 Tahun: ${demographics.usia?.usia20_29 || 0} orang (${stats.demografiPct.usia.usia20_29}%)
- Usia 30 - 39 Tahun: ${demographics.usia?.usia30_39 || 0} orang (${stats.demografiPct.usia.usia30_39}%)
- Usia 40 - 49 Tahun: ${demographics.usia?.usia40_49 || 0} orang (${stats.demografiPct.usia.usia40_49}%)
- Usia ≥ 50 Tahun: ${demographics.usia?.diatas50 || 0} orang (${stats.demografiPct.usia.diatas50}%)

c. Tingkat Pendidikan:
Latar belakang pendidikan responden didominasi oleh kelompok ${stats.demografiHighlights.pendidikanTerbanyak}, dengan kelompok tersedikit pada tingkat ${stats.demografiHighlights.pendidikanTersedikit}. Distribusi selengkapnya:
- SMP / Sederajat ke bawah: ${demographics.pendidikan?.smpKebawah || 0} orang (${stats.demografiPct.pendidikan.smpKebawah}%)
- SMA / SMK / Sederajat: ${demographics.pendidikan?.smaSmk || 0} orang (${stats.demografiPct.pendidikan.smaSmk}%)
- Diploma (D1-D4): ${demographics.pendidikan?.diploma || 0} orang (${stats.demografiPct.pendidikan.diploma}%)
- Sarjana (S1): ${demographics.pendidikan?.sarjanaS1 || 0} orang (${stats.demografiPct.pendidikan.sarjanaS1}%)
- Pascasarjana (S2/S3): ${demographics.pendidikan?.pascasarjana || 0} orang (${stats.demografiPct.pendidikan.pascasarjana}%)

d. Mata Pencaharian / Pekerjaan:
Berdasarkan jenis pekerjaan, proporsi responden tertinggi berasal dari kalangan ${stats.demografiHighlights.pekerjaanTerbanyak}. Rekapitulasi pekerjaan responden adalah:
- ASN / TNI / Polri: ${demographics.pekerjaan?.asnTniPolri || 0} orang (${stats.demografiPct.pekerjaan.asnTniPolri}%)
- Pegawai Swasta / BUMN: ${demographics.pekerjaan?.pegawaiSwasta || 0} orang (${stats.demografiPct.pekerjaan.pegawaiSwasta}%)
- Wiraswasta / Usahawan: ${demographics.pekerjaan?.wiraswasta || 0} orang (${stats.demografiPct.pekerjaan.wiraswasta}%)
- Pelajar / Mahasiswa: ${demographics.pekerjaan?.pelajarMahasiswa || 0} orang (${stats.demografiPct.pekerjaan.pelajarMahasiswa}%)
- Lainnya / Sektor Informal: ${demographics.pekerjaan?.lainnya || 0} orang (${stats.demografiPct.pekerjaan.lainnya}%)

3.2 Nilai Indeks Kepuasan Masyarakat (IKM) Unit dan Mutu Pelayanan
Berdasarkan hasil pengolahan data terhadap ${services.length} jenis layanan, diperoleh Nilai Rata-rata IKM Unit Pelayanan sebesar ${stats.rerataIKM} (setara dengan nilai persepsi ${stats.konversiSkala4} pada skala 4). Sesuai dengan pedoman Permenpan RB Nomor 14 Tahun 2017, capaian ini berada dalam rentang kategori Mutu ${stats.mutuUnit} dengan predikat kinerja "${stats.predikatUnit}".

3.3 Rekapitulasi Nilai IKM per Jenis Layanan
Rincian perolehan nilai IKM pada masing-masing layanan adalah sebagai berikut:
${services.map((s, idx) => `${idx + 1}. ${s.namaLayanan}: Nilai IKM ${s.nilaiIKM.toFixed(2)} (Mutu ${getMutuPermenpan(s.nilaiIKM).mutu} - ${getMutuPermenpan(s.nilaiIKM).predikat})`).join('\n')}`;

  const bab4 = `BAB IV
ANALISIS DAN PEMBAHASAN

4.1 Analisis Layanan dengan Nilai IKM Terendah
Meskipun capaian rata-rata instansi memperoleh Mutu ${stats.mutuUnit} (${stats.predikatUnit}) dengan nilai ${stats.rerataIKM}, telaah mendalam terhadap distribusi data per layanan memperlihatkan disparitas kualitas antar jenis layanan. Berdasarkan pemeringkatan, teridentifikasi ${stats.layananTerendah.length} layanan dengan nilai IKM terendah yang memerlukan intervensi prioritas, yaitu:

${stats.layananTerendah
  .map(
    (l, idx) =>
      `${idx + 1}. ${l.namaLayanan}
   - Nilai IKM: ${l.nilaiIKM.toFixed(2)} (Mutu ${l.mutu} - Kinerja: ${l.predikat})
   - Selisih terhadap rata-rata unit: ${l.selisihRerata >= 0 ? `+${l.selisihRerata}` : l.selisihRerata} poin`
  )
  .join('\n\n')}

4.2 Analisis Akar Masalah (Root Cause Analysis)
Berdasarkan integrasi data persepsi responden, keluhan operasional, serta catatan lapangan "${agencyInfo.catatanKendala || 'keterbatasan loket dan antrean pada jam sibuk'}", akar masalah pada layanan terendah dianalisis menggunakan pendekatan faktor 4M:

1. Faktor Man (Aparatur Pelaksana):
Keterbatasan jumlah petugas loket terdepan (frontliner) pada jam-jam puncak kunjungan mengakibatkan beban kerja berlebih, yang berpotensi menurunkan keramahan serta kecepatan penjelasan informasi syarat teknis kepada pemohon.

2. Faktor Method (Sistem & Prosedur):
Alur birokrasi pada proses verifikasi dokumen administrasi masih terdapat tahapan ganda (redundansi) yang belum terotomatisasi secara penuh, memicu persepsi waktu tunggu yang melebihi estimasi standar pelayanan (SOP).

3. Faktor Machine (Sarana & Infrastruktur Teknologi):
Kestabilan jaringan sistem aplikasi dan kuota antrean online masih mengalami perlambatan berkala saat lonjakan volume pemohon, sehingga sebagian masyarakat terpaksa beralih mengambil antrean manual di lokasi.

4. Faktor Material (Informasi & Kelengkapan Berkas):
Media sosialisasi mengenai persyaratan dokumen pendukung belum tersampaikan secara merata ke seluruh lapisan masyarakat, sehingga masih sering ditemukan berkas pemohon yang belum lengkap saat verifikasi pertama.

4.3 Korelasi dengan Profil Demografi Dominan
Responden didominasi oleh kelompok usia ${stats.demografiHighlights.usiaTerbanyak} dan berpendidikan ${stats.demografiHighlights.pendidikanTerbanyak}. Kelompok usia produktif dan berpendidikan menengah-tinggi ini memiliki ekspektasi kecepatan serta literasi digital yang tinggi. Mereka menuntut pelayanan yang serba ringkas, transparan dalam estimasi waktu, serta dapat dipantau statusnya secara mandiri (self-service tracking). Tingkat kepuasan yang lebih rendah pada layanan terendah berkorelasi erat dengan ketidaksabaran pengguna terhadap proses tunggu fisik di kantor pelayanan.`;

  const bab5 = `BAB V
PENUTUP DAN RENCANA TINDAK LANJUT

5.1 Kesimpulan
Berdasarkan hasil Survei Kepuasan Masyarakat (SKM) pada ${agencyInfo.unitKerja} ${agencyInfo.namaInstansi} periode ${agencyInfo.periode} Tahun ${agencyInfo.tahun}, dapat disimpulkan bahwa:
1. Nilai Indeks Kepuasan Masyarakat (IKM) rata-rata unit pelayanan mencapai ${stats.rerataIKM}, yang berada pada kategori Mutu ${stats.mutuUnit} dengan predikat "${stats.predikatUnit}".
2. Survei diikuti oleh ${stats.totalResponden} responden dengan representasi demografi yang beragam, didominasi oleh kelompok usia ${stats.demografiHighlights.usiaTerbanyak} dan tingkat pendidikan ${stats.demografiHighlights.pendidikanTerbanyak}.
3. Terdapat ${stats.layananTerendah.length} layanan prioritas dengan perolehan IKM terendah, yaitu ${stats.layananTerendah.map((l) => `${l.namaLayanan} (${l.nilaiIKM.toFixed(2)})`).join(', ')}, yang membutuhkan langkah pembenahan terstruktur.

5.2 Saran Rekomendasi
Guna menjaga keberlanjutan mutu pelayanan serta mendongkrak kepuasan masyarakat pada triwulan berikutnya, disarankan langkah strategis berikut:
1. Melakukan digitalisasi dan penyederhanaan alur persyaratan SOP pada layanan berkategori IKM terendah.
2. Meningkatkan kapasitas bandwidth dan integrasi antrean digital multi-loket untuk mengurai penumpukan di jam sibuk.
3. Menyelenggarakan pelatihan hospitality (service excellence) berkala bagi aparatur frontliner dan petugas informasi.
4. Memperkuat kanal pengaduan langsung dan media informasi visual mengenai estimasi waktu dan alur layanan di ruang tunggu maupun kanal daring.

5.3 Matriks Rencana Tindak Lanjut (RTL) Triwulan Berikutnya
Sebagai komitmen nyata perbaikan berkelanjutan, disusun Matriks Rencana Tindak Lanjut (RTL) untuk periode Triwulan berikutnya sebagaimana tertera pada tabel di bawah ini.`;

  // Bentuk tabel RTL realistis per layanan terendah (FR-09)
  const rtlMatrix: RTLItem[] = stats.layananTerendah.map((l, idx) => {
    const nextQuarter =
      agencyInfo.periode.includes('I') && !agencyInfo.periode.includes('IV')
        ? agencyInfo.periode.includes('III')
          ? 'Triwulan IV ' + agencyInfo.tahun
          : agencyInfo.periode.includes('II')
          ? 'Triwulan III ' + agencyInfo.tahun
          : 'Triwulan II ' + agencyInfo.tahun
        : 'Triwulan I ' + (Number(agencyInfo.tahun) + 1);

    const targetNilai = Math.min(100, Number((l.nilaiIKM + 6.5).toFixed(2)));

    const rootProblems = [
      'Waktu tunggu layanan melebihi estimasi SOP dan antrean manual menumpuk pada jam sibuk.',
      'Sosialisasi persyaratan berkas belum optimal sehingga tingkat berkas belum lengkap masih tinggi.',
      'Sistem aplikasi verifikasi daring sering mengalami kendala teknis dan jeda sinkronisasi data.',
    ];

    const actions = [
      'Implementasi sistem antrean cerdas berbasis nomor WA, pembukaan loket fleksibel di jam sibuk, serta evaluasi alur kerja verifikasi berkas.',
      'Penyusunan infografis & video panduan persyaratan layanan di media sosial dan papan informasi digital di ruang tunggu.',
      'Peningkatan kapasitas server database, optimasi jaringan lokal kantor, serta pelatihan berkala petugas front-office.',
    ];

    return {
      no: idx + 1,
      layananPrioritas: l.namaLayanan,
      masalahUtama: rootProblems[idx % rootProblems.length],
      rencanaTindakLanjut: actions[idx % actions.length],
      penanggungJawab: `Seksi Pelayanan & Bidang Tata Kelola ${agencyInfo.unitKerja}`,
      targetWaktu: nextQuarter,
      indikatorKeberhasilan: `Kenaikan IKM menjadi minimal ${targetNilai} (Kategori Mutu Baik/Sangat Baik) dan penurunan aduan keterlambatan sebesar 50%`,
    };
  });

  return {
    bab1,
    bab2,
    bab3,
    bab4,
    bab5,
    rtlMatrix,
    generatedAt: new Date().toISOString(),
    version: 1,
  };
}

/**
 * Contoh Template Instansi Nyata (FR-13)
 */
export const PRESET_INSTANSI_TEMPLATES = [
  {
    id: 'disdukcapil',
    nama: 'Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil)',
    agencyInfo: {
      namaInstansi: 'Pemerintah Kota Bandung',
      unitKerja: 'Dinas Kependudukan dan Pencatatan Sipil',
      alamat: 'Jl. Ambon No. 1B, Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40115',
      telepon: '(022) 4209322',
      email: 'disdukcapil@bandung.go.id',
      website: 'disdukcapil.bandung.go.id',
      periode: 'Triwulan III',
      tahun: '2026',
      nomorLaporan: '000.8.3/142/Disdukcapil/X/2026',
      tanggalLaporan: '27 Oktober 2026',
      namaPimpinan: 'Drs. H. Tatang Muchtar, M.Si',
      nipPimpinan: '19690815 199403 1 005',
      jabatanPimpinan: 'Kepala Dinas',
      namaOperator: 'Rian Hidayat, S.Kom',
      nipOperator: '19920310 201902 1 002',
      ruangLingkup: 'Pelayanan Pendaftaran Penduduk dan Pencatatan Sipil Warga Kota Bandung',
      dasarHukum: 'UU No. 24 Tahun 2013 tentang Administrasi Kependudukan; Permendagri No. 108 Tahun 2019',
      catatanKendala: 'Lonjakan permohonan cetak ulang KTP-el rusak dan akta kematian pada hari Senin dan Jumat menimbulkan antrean panjang.',
    },
    services: [
      { id: 's1', namaLayanan: 'Penerbitan KTP Elektronik (KTP-el)', nilaiIKM: 74.2, keterangan: 'Antrean fisik tinggi' },
      { id: 's2', namaLayanan: 'Penerbitan Kartu Identitas Anak (KIA)', nilaiIKM: 88.5, keterangan: 'Layanan cepat dan kolektif sekolah' },
      { id: 's3', namaLayanan: 'Penerbitan Akta Kelahiran', nilaiIKM: 85.0, keterangan: 'Tersedia online lewat aplikasi' },
      { id: 's4', namaLayanan: 'Penerbitan Akta Kematian', nilaiIKM: 72.8, keterangan: 'Sering kendala kelengkapan berkas RT/RW' },
      { id: 's5', namaLayanan: 'Surat Keterangan Pindah WNI (SKPWNI)', nilaiIKM: 82.4, keterangan: 'Integrasi data SIAK online' },
      { id: 's6', namaLayanan: 'Penerbitan Kartu Keluarga (Perubahan Elemen Data)', nilaiIKM: 80.6, keterangan: 'Waktu verifikasi 2 hari kerja' },
      { id: 's7', namaLayanan: 'Pelayanan Legalisasi Dokumen Kependudukan', nilaiIKM: 89.1, keterangan: 'TTE barcode sudah aktif' },
    ],
    demographics: {
      jenisKelamin: { pria: 185, wanita: 165 },
      usia: { dibawah20: 38, usia20_29: 132, usia30_39: 98, usia40_49: 52, diatas50: 30 },
      pendidikan: { smpKebawah: 42, smaSmk: 168, diploma: 35, sarjanaS1: 95, pascasarjana: 10 },
      pekerjaan: { asnTniPolri: 32, pegawaiSwasta: 145, wiraswasta: 85, pelajarMahasiswa: 58, lainnya: 30 },
    },
  },
  {
    id: 'dpmptsp',
    nama: 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP)',
    agencyInfo: {
      namaInstansi: 'Pemerintah Provinsi Jawa Timur',
      unitKerja: 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu',
      alamat: 'Jl. Johar No. 17, Alun-alun Contong, Kec. Bubutan, Kota Surabaya 60174',
      telepon: '(031) 3537344',
      email: 'dpmptsp@jatimprov.go.id',
      website: 'dpmptsp.jatimprov.go.id',
      periode: 'Triwulan III',
      tahun: '2026',
      nomorLaporan: '503/891/116.2/2026',
      tanggalLaporan: '27 Oktober 2026',
      namaPimpinan: 'Ir. Dyah Wahyu Ermawati, MA',
      nipPimpinan: '19710408 199703 2 003',
      jabatanPimpinan: 'Kepala Dinas',
      namaOperator: 'Bagus Pratama, S.STP',
      nipOperator: '19900514 201406 1 001',
      ruangLingkup: 'Pelayanan Perizinan Berusaha dan Nonperizinan Sektor Terpadu',
      dasarHukum: 'Peraturan Pemerintah Nomor 5 Tahun 2021 tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko',
      catatanKendala: 'Ketergantungan terhadap sinkronisasi sistem OSS RBA pusat yang mengalami masa pemeliharaan saat verifikasi teknis.',
    },
    services: [
      { id: 's1', namaLayanan: 'Penerbitan Nomor Induk Berusaha (NIB) Risiko Rendah', nilaiIKM: 91.2, keterangan: 'Otomatis via OSS' },
      { id: 's2', namaLayanan: 'Persetujuan Bangunan Gedung (PBG) & SLF', nilaiIKM: 68.4, keterangan: 'Kajian teknis memakan waktu' },
      { id: 's3', namaLayanan: 'Izin Operasional Fasilitas Kesehatan & Klinik', nilaiIKM: 73.5, keterangan: 'Pemeriksaan lapangan multi-OPD' },
      { id: 's4', namaLayanan: 'Izin Lingkungan (Amdal & UKL-UPL)', nilaiIKM: 71.0, keterangan: 'Sidang komisi penilai' },
      { id: 's5', namaLayanan: 'Konsultasi & Helpdesk Perizinan Berusaha', nilaiIKM: 88.0, keterangan: 'Petugas ramah dan informatif' },
      { id: 's6', namaLayanan: 'Izin Trayek & Angkutan Khusus', nilaiIKM: 79.5, keterangan: 'Proses rampcheck teknis' },
    ],
    demographics: {
      jenisKelamin: { pria: 240, wanita: 160 },
      usia: { dibawah20: 10, usia20_29: 95, usia30_39: 165, usia40_49: 90, diatas50: 40 },
      pendidikan: { smpKebawah: 12, smaSmk: 78, diploma: 50, sarjanaS1: 220, pascasarjana: 40 },
      pekerjaan: { asnTniPolri: 15, pegawaiSwasta: 185, wiraswasta: 175, pelajarMahasiswa: 10, lainnya: 15 },
    },
  },
  {
    id: 'puskesmas',
    nama: 'Puskesmas / Fasilitas Kesehatan Tingkat Pertama (FKTP)',
    agencyInfo: {
      namaInstansi: 'Pemerintah Kabupaten Sleman',
      unitKerja: 'Puskesmas Depok I',
      alamat: 'Jl. Ring Road Utara, Maguwoharjo, Kec. Depok, Kab. Sleman, D.I. Yogyakarta 55282',
      telepon: '(0274) 488112',
      email: 'puskesmasdepok1@slemankab.go.id',
      website: 'puskesmasdepok1.slemankab.go.id',
      periode: 'Triwulan III',
      tahun: '2026',
      nomorLaporan: '440/328/SKM/PKM-DPK1/2026',
      tanggalLaporan: '27 Oktober 2026',
      namaPimpinan: 'dr. Tri Hartanto, M.Kes',
      nipPimpinan: '19750920 200501 1 008',
      jabatanPimpinan: 'Kepala Puskesmas',
      namaOperator: 'Siti Rahmawati, S.Tr.Keb',
      nipOperator: '19940718 202012 2 007',
      ruangLingkup: 'Pelayanan Kesehatan Perorangan dan Masyarakat Tingkat Pertama',
      dasarHukum: 'Permenkes No. 43 Tahun 2019 tentang Pusat Kesehatan Masyarakat',
      catatanKendala: 'Waktu tunggu pengambilan obat racikan di Farmasi/Apotek masih dikeluhkan pasien saat jam rujukan pagi.',
    },
    services: [
      { id: 's1', namaLayanan: 'Pelayanan Pemeriksaan Umum (Poli Umum)', nilaiIKM: 84.5, keterangan: 'Pemeriksaan dokter teliti' },
      { id: 's2', namaLayanan: 'Pelayanan Kesehatan Gigi dan Mulut (Poli Gigi)', nilaiIKM: 86.0, keterangan: 'Alat medis lengkap' },
      { id: 's3', namaLayanan: 'Pelayanan Kesehatan Ibu dan Anak (KIA) & KB', nilaiIKM: 89.2, keterangan: 'Bidan sigap dan ramah' },
      { id: 's4', namaLayanan: 'Pelayanan Farmasi / Pengambilan Obat', nilaiIKM: 69.8, keterangan: 'Waktu peracikan lama' },
      { id: 's5', namaLayanan: 'Pelayanan Laboratorium Sederhana', nilaiIKM: 82.1, keterangan: 'Hasil tes darah cepat keluar' },
      { id: 's6', namaLayanan: 'Pelayanan Gawat Darurat (UGD 24 Jam)', nilaiIKM: 87.4, keterangan: 'Respon tanggap darurat' },
      { id: 's7', namaLayanan: 'Pendaftaran & Rekam Medis Pasien', nilaiIKM: 73.1, keterangan: 'Antrean loket manual padat' },
    ],
    demographics: {
      jenisKelamin: { pria: 120, wanita: 180 },
      usia: { dibawah20: 35, usia20_29: 75, usia30_39: 80, usia40_49: 45, diatas50: 65 },
      pendidikan: { smpKebawah: 65, smaSmk: 135, diploma: 30, sarjanaS1: 65, pascasarjana: 5 },
      pekerjaan: { asnTniPolri: 20, pegawaiSwasta: 95, wiraswasta: 70, pelajarMahasiswa: 35, lainnya: 80 },
    },
  },
];
