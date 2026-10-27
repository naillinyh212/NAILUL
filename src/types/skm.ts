export interface AgencyInfo {
  namaInstansi: string; // Contoh: Pemerintah Kota Bandung
  unitKerja: string; // Contoh: Dinas Kependudukan dan Pencatatan Sipil
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  periode: string; // Contoh: Triwulan III
  tahun: string; // Contoh: 2026
  nomorLaporan: string; // Contoh: 000.8.3/142/Disdukcapil/2026
  tanggalLaporan: string; // Contoh: 27 Oktober 2026
  namaPimpinan: string; // Contoh: Dr. H. Ahmad Fauzi, M.Si
  nipPimpinan: string; // Contoh: 19780512 200212 1 003
  jabatanPimpinan: string; // Contoh: Kepala Dinas
  namaOperator: string; // Contoh: Rina Wulandari, S.AP
  nipOperator: string;
  ruangLingkup: string;
  dasarHukum: string;
  catatanKendala: string;
}

export interface ServiceItem {
  id: string;
  namaLayanan: string;
  nilaiIKM: number; // Nilai IKM konversi (25.00 - 100.00)
  unsurPermenpan?: string; // U1 s/d U9 atau nama jenis layanan
  keterangan?: string;
}

export interface DemographicsData {
  jenisKelamin: {
    pria: number;
    wanita: number;
  };
  usia: {
    dibawah20: number;
    usia20_29: number;
    usia30_39: number;
    usia40_49: number;
    diatas50: number;
  };
  pendidikan: {
    smpKebawah: number;
    smaSmk: number;
    diploma: number;
    sarjanaS1: number;
    pascasarjana: number;
  };
  pekerjaan: {
    asnTniPolri: number;
    pegawaiSwasta: number;
    wiraswasta: number;
    pelajarMahasiswa: number;
    lainnya: number;
  };
}

export interface RTLItem {
  no: number;
  layananPrioritas: string;
  masalahUtama: string;
  rencanaTindakLanjut: string;
  penanggungJawab: string;
  targetWaktu: string;
  indikatorKeberhasilan: string;
}

export interface CalculatedStats {
  totalResponden: number;
  rerataIKM: number;
  mutuUnit: 'A' | 'B' | 'C' | 'D';
  predikatUnit: string;
  konversiSkala4: number;
  layananSorted: Array<ServiceItem & { mutu: string; predikat: string; selisihRerata: number }>;
  layananTerendah: Array<ServiceItem & { mutu: string; predikat: string; selisihRerata: number }>;
  demografiPct: {
    gender: { pria: string; wanita: string };
    usia: Record<string, string>;
    pendidikan: Record<string, string>;
    pekerjaan: Record<string, string>;
  };
  demografiHighlights: {
    usiaTerbanyak: string;
    usiaTersedikit: string;
    pendidikanTerbanyak: string;
    pendidikanTersedikit: string;
    pekerjaanTerbanyak: string;
    pekerjaanTersedikit: string;
  };
  validationIssues: {
    errors: string[];
    warnings: string[];
    isSynchronized: boolean;
    genderTotal: number;
    usiaTotal: number;
    pendidikanTotal: number;
    pekerjaanTotal: number;
  };
}

export interface ConsistencyCheckResult {
  isConsistent: boolean;
  score: number; // 0 - 100%
  findings: Array<{
    targetNumber: string | number;
    label: string;
    status: 'pass' | 'missing' | 'mismatch';
    detail: string;
  }>;
}

export interface ReportDraft {
  bab1: string;
  bab2: string;
  bab3: string;
  bab4: string;
  bab5: string;
  rtlMatrix: RTLItem[];
  generatedAt: string;
  lastEditedAt?: string;
  version: number;
}

export interface ReportHistoryRecord {
  id: string;
  timestamp: string;
  agencyInfo: AgencyInfo;
  services: ServiceItem[];
  demographics: DemographicsData;
  stats: CalculatedStats;
  draft: ReportDraft;
}
