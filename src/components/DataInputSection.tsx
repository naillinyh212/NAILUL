import React, { useState } from 'react';
import { DemographicsData, ServiceItem } from '../types/skm';
import { Plus, Trash2, Upload, Users, Award, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { getMutuPermenpan } from '../utils/skmCalculator';

interface DataInputSectionProps {
  services: ServiceItem[];
  demographics: DemographicsData;
  onServicesChange: (services: ServiceItem[]) => void;
  onDemographicsChange: (demographics: DemographicsData) => void;
}

export const DataInputSection: React.FC<DataInputSectionProps> = ({
  services,
  demographics,
  onServicesChange,
  onDemographicsChange,
}) => {
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Handle service changes
  const updateService = (id: string, field: keyof ServiceItem, value: any) => {
    onServicesChange(
      services.map((s) => {
        if (s.id === id) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const addService = () => {
    const newService: ServiceItem = {
      id: `svc_${Date.now()}`,
      namaLayanan: '',
      nilaiIKM: 80.0,
      keterangan: '',
    };
    onServicesChange([...services, newService]);
  };

  const removeService = (id: string) => {
    if (services.length <= 1) return;
    onServicesChange(services.filter((s) => s.id !== id));
  };

  // Demographics update helper
  const updateDemo = (category: keyof DemographicsData, field: string, val: number) => {
    onDemographicsChange({
      ...demographics,
      [category]: {
        ...(demographics[category] as any),
        [field]: Math.max(0, val || 0),
      },
    });
  };

  // Demographic totals
  const totalGender = (demographics.jenisKelamin?.pria || 0) + (demographics.jenisKelamin?.wanita || 0);
  const totalUsia = Object.values(demographics.usia || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalPendidikan = Object.values(demographics.pendidikan || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalPekerjaan = Object.values(demographics.pekerjaan || {}).reduce((a, b) => a + (Number(b) || 0), 0);

  const isSync = totalGender === totalUsia && totalUsia === totalPendidikan && totalPendidikan === totalPekerjaan && totalGender > 0;

  // Import CSV text
  const handleImportCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    const imported: ServiceItem[] = [];

    lines.forEach((line, idx) => {
      // Split by comma, semicolon or tab
      const parts = line.split(/[,;\t]/);
      if (parts.length >= 2) {
        const name = parts[0].trim().replace(/^["']|["']$/g, '');
        const ikmVal = parseFloat(parts[1].trim().replace(',', '.'));
        const ket = parts[2]?.trim().replace(/^["']|["']$/g, '') || '';

        // Ignore header line
        if (idx === 0 && (name.toLowerCase().includes('layanan') || isNaN(ikmVal))) {
          return;
        }

        if (name && !isNaN(ikmVal)) {
          imported.push({
            id: `svc_csv_${Date.now()}_${idx}`,
            namaLayanan: name,
            nilaiIKM: Math.min(100, Math.max(25, ikmVal)),
            keterangan: ket,
          });
        }
      }
    });

    if (imported.length > 0) {
      onServicesChange(imported);
      setShowCsvModal(false);
      setCsvText('');
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: Layanan & Nilai IKM */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-slate-800">
              <Award className="w-5 h-5 text-blue-700" />
              <h3 className="font-semibold text-base">Tabel Nilai IKM per Jenis Layanan</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan nilai IKM konversi (skala 25,00 s/d 100,00) sesuai formulasi Permenpan RB No. 14 Tahun 2017.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCsvModal(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tempel CSV/Excel</span>
            </button>
            <button
              type="button"
              onClick={addService}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Layanan</span>
            </button>
          </div>
        </div>

        {/* Tabel Layanan */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[240px]">Nama Jenis Layanan</th>
                <th className="py-3 px-4 w-40 text-center">Nilai IKM (25 - 100)</th>
                <th className="py-3 px-4 w-36 text-center">Kategori Mutu</th>
                <th className="py-3 px-4 min-w-[200px]">Catatan / Isu Utama</th>
                <th className="py-3 px-3 w-14 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {services.map((item, idx) => {
                const { mutu, predikat } = getMutuPermenpan(item.nilaiIKM || 0);
                const isOutOfRange = item.nilaiIKM < 25 || item.nilaiIKM > 100;
                const isWarning = item.nilaiIKM < 76.61;

                return (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-2.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={item.namaLayanan}
                        onChange={(e) => updateService(item.id, 'namaLayanan', e.target.value)}
                        placeholder="Contoh: Penerbitan KTP-el / Izin Usaha / Poli Umum"
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium text-slate-800"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="25"
                          max="100"
                          value={item.nilaiIKM}
                          onChange={(e) => updateService(item.id, 'nilaiIKM', parseFloat(e.target.value) || 0)}
                          className={`w-full px-2.5 py-1.5 text-xs text-center font-bold rounded-md border ${
                            isOutOfRange
                              ? 'border-red-400 bg-red-50 text-red-700 ring-1 ring-red-400'
                              : 'border-slate-300 focus:ring-1 focus:ring-blue-600'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          mutu === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : mutu === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : mutu === 'C'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        Mutu {mutu} ({predikat})
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={item.keterangan || ''}
                        onChange={(e) => updateService(item.id, 'keterangan', e.target.value)}
                        placeholder="Catatan kendala (opsional)"
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-600"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeService(item.id)}
                        disabled={services.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Rekap Responden Demografi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center gap-2 text-slate-800">
              <Users className="w-5 h-5 text-indigo-700" />
              <h3 className="font-semibold text-base">Rekapitulasi Profil Responden Survei (FR-02)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan jumlah responden berdasarkan karakteristik demografi pengguna layanan.
            </p>
          </div>

          {/* Sync Status Badge (FR-03) */}
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                isSync
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isSync ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Responden Sinkron: <strong>{totalGender}</strong> orang</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>
                    Belum Sinkron: Gender ({totalGender}) ≠ Usia ({totalUsia}) / Pend ({totalPendidikan}) / Kerja ({totalPekerjaan})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Jenis Kelamin */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Jenis Kelamin</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                Total: {totalGender}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Laki-laki</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.jenisKelamin?.pria || 0}
                  onChange={(e) => updateDemo('jenisKelamin', 'pria', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Perempuan</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.jenisKelamin?.wanita || 0}
                  onChange={(e) => updateDemo('jenisKelamin', 'wanita', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Usia */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Kelompok Usia</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                Total: {totalUsia}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">&lt; 20 Tahun</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.usia?.dibawah20 || 0}
                  onChange={(e) => updateDemo('usia', 'dibawah20', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">20 - 29 Tahun</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.usia?.usia20_29 || 0}
                  onChange={(e) => updateDemo('usia', 'usia20_29', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">30 - 39 Tahun</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.usia?.usia30_39 || 0}
                  onChange={(e) => updateDemo('usia', 'usia30_39', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">40 - 49 Tahun</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.usia?.usia40_49 || 0}
                  onChange={(e) => updateDemo('usia', 'usia40_49', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">≥ 50 Tahun</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.usia?.diatas50 || 0}
                  onChange={(e) => updateDemo('usia', 'diatas50', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Pendidikan */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tingkat Pendidikan</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                Total: {totalPendidikan}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">SMP kebawah</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.pendidikan?.smpKebawah || 0}
                  onChange={(e) => updateDemo('pendidikan', 'smpKebawah', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">SMA / SMK</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.pendidikan?.smaSmk || 0}
                  onChange={(e) => updateDemo('pendidikan', 'smaSmk', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Diploma (D1-D4)</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.pendidikan?.diploma || 0}
                  onChange={(e) => updateDemo('pendidikan', 'diploma', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Sarjana (S1)</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.pendidikan?.sarjanaS1 || 0}
                  onChange={(e) => updateDemo('pendidikan', 'sarjanaS1', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Pascasarjana (S2/S3)</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.pendidikan?.pascasarjana || 0}
                  onChange={(e) => updateDemo('pendidikan', 'pascasarjana', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* 4. Pekerjaan */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pekerjaan</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                Total: {totalPekerjaan}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">PNS / TNI / Polri</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.pekerjaan?.asnTniPolri || 0}
                  onChange={(e) => updateDemo('pekerjaan', 'asnTniPolri', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Pegawai Swasta</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.pekerjaan?.pegawaiSwasta || 0}
                  onChange={(e) => updateDemo('pekerjaan', 'pegawaiSwasta', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Wiraswasta</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.pekerjaan?.wiraswasta || 0}
                  onChange={(e) => updateDemo('pekerjaan', 'wiraswasta', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Pelajar / Mhs</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.pekerjaan?.pelajarMahasiswa || 0}
                  onChange={(e) => updateDemo('pekerjaan', 'pelajarMahasiswa', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Lainnya</span>
                <input
                  type="number"
                  min="0"
                  value={demographics.pekerjaan?.lainnya || 0}
                  onChange={(e) => updateDemo('pekerjaan', 'lainnya', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs text-right font-semibold rounded border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-800 text-base">Tempel Data Layanan & Nilai IKM</h4>
              <p className="text-xs text-slate-500 mt-1">
                Format per baris: <code>Nama Layanan, Nilai IKM, Keterangan (opsional)</code>
              </p>
            </div>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Penerbitan KTP-el, 74.20, Waktu tunggu lama
Penerbitan Kartu Identitas Anak, 88.50, Cepat
Penerbitan Akta Kelahiran, 85.00, Online`}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800"
              >
                Impor Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
