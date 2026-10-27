import React from 'react';
import { AgencyInfo } from '../types/skm';
import { Building2, UserCheck, Calendar, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { PRESET_INSTANSI_TEMPLATES } from '../utils/skmCalculator';

interface AgencyFormProps {
  agencyInfo: AgencyInfo;
  onChange: (info: AgencyInfo) => void;
  onApplyPreset: (presetId: string) => void;
}

export const AgencyForm: React.FC<AgencyFormProps> = ({ agencyInfo, onChange, onApplyPreset }) => {
  const handleChange = (field: keyof AgencyInfo, val: string) => {
    onChange({ ...agencyInfo, [field]: val });
  };

  return (
    <div className="space-y-6">
      {/* Preset Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-lg text-white">Muat Template Instansi Siap Pakai</h3>
            </div>
            <p className="text-sm text-blue-200">
              Pilih contoh data nyata unit pelayanan publik untuk langsung menguji alur analisis dan penyusunan draf otomatis.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_INSTANSI_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onApplyPreset(tmpl.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>{tmpl.nama.split('(')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identitas Instansi & Unit Kerja */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-800">
            <Building2 className="w-5 h-5 text-blue-700" />
            <h4 className="font-semibold text-base">Identitas Instansi & Unit Kerja</h4>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pemerintah Daerah / Lembaga Induk
              </label>
              <input
                type="text"
                value={agencyInfo.namaInstansi}
                onChange={(e) => handleChange('namaInstansi', e.target.value)}
                placeholder="Contoh: Pemerintah Kota Bandung"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nama Unit Kerja Pelayanan
              </label>
              <input
                type="text"
                value={agencyInfo.unitKerja}
                onChange={(e) => handleChange('unitKerja', e.target.value)}
                placeholder="Contoh: Dinas Kependudukan dan Pencatatan Sipil"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Alamat Kantor Pelayanan
              </label>
              <input
                type="text"
                value={agencyInfo.alamat}
                onChange={(e) => handleChange('alamat', e.target.value)}
                placeholder="Jl. Nama Jalan No. XX, Kota, Provinsi"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telepon</label>
                <input
                  type="text"
                  value={agencyInfo.telepon}
                  onChange={(e) => handleChange('telepon', e.target.value)}
                  placeholder="(022) 123456"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Resmi</label>
                <input
                  type="email"
                  value={agencyInfo.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="kontak@instansi.go.id"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
                <input
                  type="text"
                  value={agencyInfo.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="instansi.go.id"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ruang Lingkup Layanan
              </label>
              <textarea
                rows={2}
                value={agencyInfo.ruangLingkup}
                onChange={(e) => handleChange('ruangLingkup', e.target.value)}
                placeholder="Rincian ruang lingkup layanan publik yang diselenggarakan unit ini..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Periode, Pimpinan & Konteks Lapangan */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-800">
            <Calendar className="w-5 h-5 text-blue-700" />
            <h4 className="font-semibold text-base">Periode Laporan & Pejabat Penandatangan</h4>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Periode Laporan
                </label>
                <select
                  value={agencyInfo.periode}
                  onChange={(e) => handleChange('periode', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Triwulan I">Triwulan I</option>
                  <option value="Triwulan II">Triwulan II</option>
                  <option value="Triwulan III">Triwulan III</option>
                  <option value="Triwulan IV">Triwulan IV</option>
                  <option value="Tahunan (Semester I & II)">Tahunan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tahun Anggaran
                </label>
                <input
                  type="text"
                  value={agencyInfo.tahun}
                  onChange={(e) => handleChange('tahun', e.target.value)}
                  placeholder="2026"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Registrasi Laporan</label>
                <input
                  type="text"
                  value={agencyInfo.nomorLaporan}
                  onChange={(e) => handleChange('nomorLaporan', e.target.value)}
                  placeholder="000.8.3/142/Disdukcapil/2026"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pengesahan</label>
                <input
                  type="text"
                  value={agencyInfo.tanggalLaporan}
                  onChange={(e) => handleChange('tanggalLaporan', e.target.value)}
                  placeholder="27 Oktober 2026"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5 mb-2 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Pimpinan Unit Penyelenggara (Penandatangan)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={agencyInfo.namaPimpinan}
                    onChange={(e) => handleChange('namaPimpinan', e.target.value)}
                    placeholder="Nama Lengkap & Gelar Pimpinan"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={agencyInfo.nipPimpinan}
                    onChange={(e) => handleChange('nipPimpinan', e.target.value)}
                    placeholder="NIP Pimpinan (contoh: 19780512...)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Konteks Lapangan / Catatan Kendala Layanan
                </label>
                <span className="text-[10px] text-slate-400">Digunakan AI untuk analisis akar masalah</span>
              </div>
              <textarea
                rows={3}
                value={agencyInfo.catatanKendala}
                onChange={(e) => handleChange('catatanKendala', e.target.value)}
                placeholder="Sebutkan temuan kendala operasional riil (misal: antrean loket padat hari Senin, kendala server pusat, atau masyarakat belum paham syarat berkas online)..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-amber-50/30"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
