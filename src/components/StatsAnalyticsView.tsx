import React from 'react';
import { CalculatedStats, ServiceItem } from '../types/skm';
import { Award, AlertTriangle, TrendingDown, Users, BarChart3, CheckCircle, ShieldAlert } from 'lucide-react';

interface StatsAnalyticsViewProps {
  stats: CalculatedStats;
  services: ServiceItem[];
  onProceedToAgent: () => void;
}

export const StatsAnalyticsView: React.FC<StatsAnalyticsViewProps> = ({
  stats,
  services,
  onProceedToAgent,
}) => {
  const { validationIssues } = stats;

  return (
    <div className="space-y-6">
      {/* Validation Alert Section (FR-03) */}
      {(validationIssues.errors.length > 0 || validationIssues.warnings.length > 0) && (
        <div className="space-y-2">
          {validationIssues.errors.map((err, idx) => (
            <div
              key={`err_${idx}`}
              className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-xs"
            >
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Kesalahan Validasi Data:</span> {err}
              </div>
            </div>
          ))}
          {validationIssues.warnings.map((warn, idx) => (
            <div
              key={`warn_${idx}`}
              className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-xs"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Peringatan Sinkronisasi:</span> {warn}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Metric KPI Cards (FR-04, FR-05) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rerata IKM Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Nilai Rerata IKM Unit</span>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {stats.rerataIKM.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Skala 100 | Konversi Skala 4: <strong>{stats.konversiSkala4}</strong>
            </div>
          </div>
          <div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                stats.mutuUnit === 'A'
                  ? 'bg-emerald-100 text-emerald-800'
                  : stats.mutuUnit === 'B'
                  ? 'bg-blue-100 text-blue-800'
                  : stats.mutuUnit === 'C'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              Mutu {stats.mutuUnit} ({stats.predikatUnit})
            </span>
          </div>
        </div>

        {/* Total Responden Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Responden</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {stats.totalResponden}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Orang penerima layanan terverifikasi</div>
          </div>
          <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              L: {stats.demografiPct.gender.pria}% | P: {stats.demografiPct.gender.wanita}%
            </span>
          </div>
        </div>

        {/* Layanan Terendah Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Layanan Terendah</span>
            <TrendingDown className="w-5 h-5 text-amber-600" />
          </div>
          <div className="my-3">
            <div className="text-lg font-bold text-slate-800 line-clamp-1">
              {stats.layananTerendah[0]?.namaLayanan || '-'}
            </div>
            <div className="text-xs text-amber-700 font-semibold mt-0.5">
              IKM {stats.layananTerendah[0]?.nilaiIKM.toFixed(2)} (Mutu {stats.layananTerendah[0]?.mutu})
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Prioritas 1 Rencana Tindak Lanjut (RTL)
          </div>
        </div>

        {/* Cakupan Evaluasi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cakupan Evaluasi</span>
            <BarChart3 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {services.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Produk layanan publik dinilai</div>
          </div>
          <div className="text-[11px] text-slate-600">
            Standar Permenpan RB No. 14 Tahun 2017
          </div>
        </div>
      </div>

      {/* Grid: 2-3 Layanan Terendah (FR-06) & Distribusi Layanan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2-3 Layanan Terendah Highlight */}
        <div className="lg:col-span-1 bg-amber-50/50 rounded-xl border border-amber-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 pb-2 border-b border-amber-200">
            <TrendingDown className="w-5 h-5 text-amber-700" />
            <div>
              <h4 className="font-bold text-sm">2–3 Layanan Terendah (Prioritas RTL)</h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Otomatis diurutkan deterministik untuk bahan Bab IV &amp; Tabel RTL
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {stats.layananTerendah.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-lg border border-amber-200 shadow-2xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{item.namaLayanan}</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-700 whitespace-nowrap">
                    {item.nilaiIKM.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Mutu {item.mutu} ({item.predikat})</span>
                  <span
                    className={
                      item.selisihRerata < 0 ? 'text-red-600 font-semibold' : 'text-slate-500'
                    }
                  >
                    Selisih: {item.selisihRerata >= 0 ? `+${item.selisihRerata}` : item.selisihRerata}
                  </span>
                </div>
                {item.keterangan && (
                  <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                    "{item.keterangan}"
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 bg-white/80 rounded-lg text-slate-600 text-xs border border-amber-200">
            💡 <strong>Panduan Permenpan:</strong> Layanan terendah wajib dianalisis akar masalahnya
            (Man, Method, Machine, Material) pada Bab IV serta dicantumkan rencana perbaikannya pada
            matriks RTL Bab V.
          </div>
        </div>

        {/* Pemeringkatan Seluruh Layanan */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-800">
              Peta Sebaran Nilai IKM Layanan (Rendah → Tinggi)
            </h4>
            <span className="text-xs text-slate-400">Garis target mutu B: 76.61</span>
          </div>

          <div className="space-y-3.5">
            {stats.layananSorted.map((s, idx) => {
              const widthPct = Math.max(10, Math.min(100, s.nilaiIKM));
              const isLowest = idx < stats.layananTerendah.length;

              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <span className="text-slate-400 text-[10px] w-4">{idx + 1}.</span>
                      {s.namaLayanan}
                      {isLowest && (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                          PRIORITAS RTL
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-slate-800">
                      {s.nilaiIKM.toFixed(2)} (Mutu {s.mutu})
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                    {/* Benchmark line at 76.61 */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                      style={{ left: '76.61%' }}
                      title="Ambang Batas Mutu Baik (76.61)"
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        s.mutu === 'A'
                          ? 'bg-emerald-500'
                          : s.mutu === 'B'
                          ? 'bg-blue-600'
                          : s.mutu === 'C'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rangkuman Karakteristik Demografi Terbanyak & Tersedikit (FR-04) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h4 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100">
          Analisis Otomatis Profil Demografi Responden (FR-04)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Segmentasi Usia
            </span>
            <div className="text-xs text-slate-800">
              <div className="font-semibold text-emerald-700">
                Terbanyak: {stats.demografiHighlights.usiaTerbanyak}
              </div>
              <div className="text-slate-500 mt-0.5">
                Tersedikit: {stats.demografiHighlights.usiaTersedikit}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tingkat Pendidikan
            </span>
            <div className="text-xs text-slate-800">
              <div className="font-semibold text-emerald-700">
                Terbanyak: {stats.demografiHighlights.pendidikanTerbanyak}
              </div>
              <div className="text-slate-500 mt-0.5">
                Tersedikit: {stats.demografiHighlights.pendidikanTersedikit}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jenis Pekerjaan
            </span>
            <div className="text-xs text-slate-800">
              <div className="font-semibold text-emerald-700">
                Terbanyak: {stats.demografiHighlights.pekerjaanTerbanyak}
              </div>
              <div className="text-slate-500 mt-0.5">
                Tersedikit: {stats.demografiHighlights.pekerjaanTersedikit}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onProceedToAgent}
          disabled={validationIssues.errors.length > 0}
          className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
        >
          <span>Lanjutkan ke Penyusunan Draf Agen AI</span>
        </button>
      </div>
    </div>
  );
};
