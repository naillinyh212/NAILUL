import React, { useState } from 'react';
import { ReportHistoryRecord } from '../types/skm';
import { History, GitCompare, Calendar, ArrowUpRight, ArrowDownRight, Minus, RotateCcw, Trash2, Award } from 'lucide-react';

interface HistoryViewProps {
  history: ReportHistoryRecord[];
  onLoadRecord: (record: ReportHistoryRecord) => void;
  onDeleteRecord: (id: string) => void;
  currentRecord?: ReportHistoryRecord;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onLoadRecord,
  onDeleteRecord,
  currentRecord,
}) => {
  const [selectedPeriod1, setSelectedPeriod1] = useState<string>(history[0]?.id || '');
  const [selectedPeriod2, setSelectedPeriod2] = useState<string>(history[1]?.id || '');

  const rec1 = history.find((h) => h.id === selectedPeriod1);
  const rec2 = history.find((h) => h.id === selectedPeriod2);

  return (
    <div className="space-y-8">
      {/* SECTION 1: Riwayat Tersimpan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <History className="w-5 h-5 text-blue-700" />
            <h3 className="font-semibold text-base">Arsip Riwayat Laporan SKM (FR-14)</h3>
          </div>
          <span className="text-xs text-slate-500">{history.length} Laporan tersimpan di peramban</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Belum ada arsip laporan tersimpan. Buat atau ekspor draf laporan untuk menyimpannya ke riwayat secara otomatis.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">Instansi / Unit</th>
                  <th className="py-3 px-4 text-center">Responden</th>
                  <th className="py-3 px-4 text-center">Rerata IKM</th>
                  <th className="py-3 px-4 text-center">Mutu</th>
                  <th className="py-3 px-4 text-center">Waktu Simpan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {item.agencyInfo.periode} {item.agencyInfo.tahun}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{item.agencyInfo.unitKerja}</div>
                      <div className="text-[11px] text-slate-400">{item.agencyInfo.namaInstansi}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {item.stats.totalResponden}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-blue-700">
                      {item.stats.rerataIKM.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                        Mutu {item.stats.mutuUnit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {new Date(item.timestamp).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onLoadRecord(item)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-blue-700 font-medium transition-colors flex items-center gap-1"
                          title="Buka kembali di lembar kerja"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Buka</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Hapus riwayat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: Komparasi Antarperiode (FR-14) */}
      {history.length >= 2 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div className="flex items-center gap-2 text-slate-800">
              <GitCompare className="w-5 h-5 text-indigo-700" />
              <div>
                <h3 className="font-semibold text-base">Komparasi Kinerja Antarperiode</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bandingkan tren kenaikan / penurunan nilai IKM dan mutu pelayanan secara komprehensif.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={selectedPeriod1}
                onChange={(e) => setSelectedPeriod1(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold bg-white"
              >
                {history.map((h) => (
                  <option key={`p1_${h.id}`} value={h.id}>
                    Periode Baseline: {h.agencyInfo.periode} {h.agencyInfo.tahun}
                  </option>
                ))}
              </select>

              <span className="text-slate-400 font-bold">vs</span>

              <select
                value={selectedPeriod2}
                onChange={(e) => setSelectedPeriod2(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold bg-white"
              >
                {history.map((h) => (
                  <option key={`p2_${h.id}`} value={h.id}>
                    Periode Evaluasi: {h.agencyInfo.periode} {h.agencyInfo.tahun}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {rec1 && rec2 && (
            <div className="space-y-6">
              {/* Delta Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Rerata Delta */}
                {(() => {
                  const deltaIKM = Number((rec2.stats.rerataIKM - rec1.stats.rerataIKM).toFixed(2));
                  const isPositive = deltaIKM >= 0;
                  return (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Perubahan Nilai Rerata IKM
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">
                          {rec2.stats.rerataIKM.toFixed(2)}
                        </span>
                        <span
                          className={`text-xs font-bold flex items-center ${
                            isPositive ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {isPositive ? `+${deltaIKM}` : deltaIKM} poin
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Baseline ({rec1.agencyInfo.periode}): {rec1.stats.rerataIKM.toFixed(2)}
                      </div>
                    </div>
                  );
                })()}

                {/* Perubahan Mutu */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Perubahan Mutu Pelayanan
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-slate-200">
                      Mutu {rec1.stats.mutuUnit}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Mutu {rec2.stats.mutuUnit} ({rec2.stats.predikatUnit})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Konversi Permenpan RB No. 14 Tahun 2017
                  </div>
                </div>

                {/* Responden Delta */}
                {(() => {
                  const deltaResp = rec2.stats.totalResponden - rec1.stats.totalResponden;
                  return (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Perubahan Jumlah Responden
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">
                          {rec2.stats.totalResponden}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            deltaResp >= 0 ? 'text-emerald-600' : 'text-slate-500'
                          }`}
                        >
                          {deltaResp >= 0 ? `+${deltaResp}` : deltaResp} responden
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Partisipasi publik periode ini
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Tabel Perbandingan per Layanan */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Nama Layanan</th>
                      <th className="py-2.5 px-4 text-center">
                        {rec1.agencyInfo.periode} {rec1.agencyInfo.tahun}
                      </th>
                      <th className="py-2.5 px-4 text-center">
                        {rec2.agencyInfo.periode} {rec2.agencyInfo.tahun}
                      </th>
                      <th className="py-2.5 px-4 text-center">Delta IKM</th>
                      <th className="py-2.5 px-4 text-center">Status Tren</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rec2.services.map((s2) => {
                      const s1 = rec1.services.find(
                        (item) => item.namaLayanan.toLowerCase().trim() === s2.namaLayanan.toLowerCase().trim()
                      );
                      const val1 = s1 ? s1.nilaiIKM : null;
                      const val2 = s2.nilaiIKM;
                      const delta = val1 !== null ? Number((val2 - val1).toFixed(2)) : null;

                      return (
                        <tr key={s2.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-medium text-slate-800">{s2.namaLayanan}</td>
                          <td className="py-2.5 px-4 text-center text-slate-500">
                            {val1 !== null ? val1.toFixed(2) : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                            {val2.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {delta !== null ? (
                              <span
                                className={`font-bold ${
                                  delta > 0
                                    ? 'text-emerald-600'
                                    : delta < 0
                                    ? 'text-red-600'
                                    : 'text-slate-400'
                                }`}
                              >
                                {delta > 0 ? `+${delta}` : delta}
                              </span>
                            ) : (
                              <span className="text-slate-400">Baru</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {delta !== null ? (
                              delta > 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                                  Meningkat
                                </span>
                              ) : delta < 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700">
                                  Menurun
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  Stabil
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
