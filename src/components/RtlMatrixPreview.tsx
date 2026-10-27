import React, { useState } from 'react';
import { AgencyInfo, CalculatedStats, DemographicsData, ReportDraft, RTLItem, ServiceItem } from '../types/skm';
import {
  Download,
  Printer,
  Copy,
  Plus,
  Trash2,
  FileCheck,
  Building,
  Check,
  Eye,
  Edit2,
} from 'lucide-react';
import { exportReportToDocx, triggerFileDownload } from '../utils/docxExport';
import { getMutuPermenpan } from '../utils/skmCalculator';

interface RtlMatrixPreviewProps {
  agencyInfo: AgencyInfo;
  stats: CalculatedStats;
  services: ServiceItem[];
  demographics: DemographicsData;
  draft: ReportDraft;
  onDraftChange: (draft: ReportDraft) => void;
  onSaveToHistory: () => void;
}

export const RtlMatrixPreview: React.FC<RtlMatrixPreviewProps> = ({
  agencyInfo,
  stats,
  services,
  demographics,
  draft,
  onDraftChange,
  onSaveToHistory,
}) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<'rtl' | 'fullDoc'>('rtl');

  // Handle RTL row edits
  const updateRtlItem = (index: number, field: keyof RTLItem, val: any) => {
    const updated = draft.rtlMatrix.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: val };
      }
      return item;
    });
    onDraftChange({ ...draft, rtlMatrix: updated });
  };

  const addRtlRow = () => {
    const newRow: RTLItem = {
      no: draft.rtlMatrix.length + 1,
      layananPrioritas: stats.layananTerendah[0]?.namaLayanan || 'Layanan Prioritas',
      masalahUtama: 'Tingginya waktu tunggu dan antrean pada jam sibuk.',
      rencanaTindakLanjut: 'Peningkatan kapasitas server dan penambahan petugas loket pelayanan terpadu.',
      penanggungJawab: `Seksi Pelayanan ${agencyInfo.unitKerja}`,
      targetWaktu: `Triwulan IV ${agencyInfo.tahun}`,
      indikatorKeberhasilan: 'Target IKM minimal 82.00 dan nihil komplain antrean.',
    };
    onDraftChange({ ...draft, rtlMatrix: [...draft.rtlMatrix, newRow] });
  };

  const removeRtlRow = (index: number) => {
    if (draft.rtlMatrix.length <= 1) return;
    const filtered = draft.rtlMatrix
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, no: idx + 1 }));
    onDraftChange({ ...draft, rtlMatrix: filtered });
  };

  // Export to .docx (FR-12)
  const handleExportWord = async () => {
    setIsExportingDocx(true);
    try {
      const blob = await exportReportToDocx(agencyInfo, stats, services, demographics, draft);
      const filename = `Laporan_SKM_${agencyInfo.unitKerja.replace(/\s+/g, '_')}_${agencyInfo.periode.replace(/\s+/g, '')}_${agencyInfo.tahun}.docx`;
      triggerFileDownload(blob, filename);
      onSaveToHistory();
    } catch (err) {
      console.error('Gagal mengekspor dokumen Word:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Print / PDF preview
  const handlePrint = () => {
    onSaveToHistory();
    window.print();
  };

  // Copy full document text
  const handleCopyText = () => {
    const fullText = `LAPORAN SURVEI KEPUASAN MASYARAKAT (SKM)
${agencyInfo.namaInstansi.toUpperCase()}
${agencyInfo.unitKerja.toUpperCase()}
Periode: ${agencyInfo.periode} Tahun ${agencyInfo.tahun}
Nomor: ${agencyInfo.nomorLaporan}

${draft.bab1}

${draft.bab2}

${draft.bab3}

${draft.bab4}

${draft.bab5}

MATRIKS RENCANA TINDAK LANJUT (RTL):
${draft.rtlMatrix.map((r) => `${r.no}. [${r.layananPrioritas}] Masalah: ${r.masalahUtama} | Tindakan: ${r.rencanaTindakLanjut} | PJ: ${r.penanggungJawab} | Target: ${r.targetWaktu} | Indikator: ${r.indikatorKeberhasilan}`).join('\n')}

Ditetapkan di: ${agencyInfo.namaInstansi}, ${agencyInfo.tanggalLaporan}
${agencyInfo.jabatanPimpinan} ${agencyInfo.unitKerja}

${agencyInfo.namaPimpinan}
NIP. ${agencyInfo.nipPimpinan}
`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Toggle View */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setPreviewTab('rtl')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              previewTab === 'rtl' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Tabel Matriks RTL (FR-09)</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('fullDoc')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              previewTab === 'fullDoc' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau Naskah Dinas Resmi (Bab I–V)</span>
          </button>
        </div>

        {/* Export Buttons (FR-12) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Naskah'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportWord}
            disabled={isExportingDocx}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingDocx ? 'Membuat Word...' : 'Ekspor ke .docx (Word)'}</span>
          </button>
        </div>
      </div>

      {previewTab === 'rtl' ? (
        /* MATRIKS RTL TABLE (FR-09) */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-base text-slate-800">
                Matriks Rencana Tindak Lanjut (RTL) Triwulan Berikutnya
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Format standar Permenpan RB: Prioritas perbaikan, akar masalah, aksi nyata, PJ, waktu, dan indikator keberhasilan.
              </p>
            </div>
            <button
              type="button"
              onClick={addRtlRow}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris RTL</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 w-44">Layanan Prioritas</th>
                  <th className="py-3 px-3 min-w-[200px]">Masalah Utama</th>
                  <th className="py-3 px-3 min-w-[220px]">Rencana Tindak Lanjut</th>
                  <th className="py-3 px-3 w-36">Penanggung Jawab</th>
                  <th className="py-3 px-3 w-28 text-center">Target Waktu</th>
                  <th className="py-3 px-3 min-w-[180px]">Indikator Keberhasilan</th>
                  <th className="py-3 px-2 w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {draft.rtlMatrix.map((item, idx) => (
                  <tr key={`rtl_${idx}`} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.layananPrioritas}
                        onChange={(e) => updateRtlItem(idx, 'layananPrioritas', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-semibold rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <textarea
                        rows={3}
                        value={item.masalahUtama}
                        onChange={(e) => updateRtlItem(idx, 'masalahUtama', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <textarea
                        rows={3}
                        value={item.rencanaTindakLanjut}
                        onChange={(e) => updateRtlItem(idx, 'rencanaTindakLanjut', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium text-slate-800"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.penanggungJawab}
                        onChange={(e) => updateRtlItem(idx, 'penanggungJawab', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="text"
                        value={item.targetWaktu}
                        onChange={(e) => updateRtlItem(idx, 'targetWaktu', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs text-center font-medium rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <textarea
                        rows={3}
                        value={item.indikatorKeberhasilan}
                        onChange={(e) => updateRtlItem(idx, 'indikatorKeberhasilan', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRtlRow(idx)}
                        disabled={draft.rtlMatrix.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* OFFICIAL DOCUMENT PREVIEW (Naskah Dinas Format) */
        <div id="print-area" className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 sm:p-14 space-y-8 font-serif print:p-0 print:border-none print:shadow-none">
          {/* KOP SURAT INSTANSI */}
          <div className="text-center pb-4 border-b-4 border-double border-slate-900 space-y-1">
            <h2 className="text-lg font-bold tracking-wider uppercase text-slate-900 font-sans">
              {agencyInfo.namaInstansi}
            </h2>
            <h1 className="text-xl font-extrabold tracking-wide uppercase text-slate-900 font-sans">
              {agencyInfo.unitKerja}
            </h1>
            <p className="text-xs text-slate-600 font-sans">
              {agencyInfo.alamat}
            </p>
            <p className="text-xs text-slate-500 font-sans">
              Telp: {agencyInfo.telepon} | Pos-el: {agencyInfo.email} | Laman: {agencyInfo.website}
            </p>
          </div>

          {/* JUDUL LAPORAN */}
          <div className="text-center space-y-1 pt-2">
            <h3 className="text-base font-bold uppercase underline tracking-wide text-slate-900">
              LAPORAN HASIL SURVEI KEPUASAN MASYARAKAT (SKM)
            </h3>
            <h4 className="text-sm font-semibold uppercase text-slate-800">
              PERIODE {agencyInfo.periode.toUpperCase()} TAHUN {agencyInfo.tahun}
            </h4>
            <p className="text-xs text-slate-500 font-sans">
              Nomor Registrasi: {agencyInfo.nomorLaporan}
            </p>
          </div>

          {/* CHAPTERS BAB I - V */}
          <div className="space-y-6 text-xs text-slate-800 leading-relaxed font-sans text-justify">
            {/* BAB I */}
            <div className="whitespace-pre-line border-b border-slate-100 pb-6">{draft.bab1}</div>

            {/* BAB II */}
            <div className="whitespace-pre-line border-b border-slate-100 pb-6">{draft.bab2}</div>

            {/* BAB III */}
            <div className="space-y-4 border-b border-slate-100 pb-6">
              <div className="whitespace-pre-line">{draft.bab3}</div>

              {/* Tabel IKM Layanan Resmi */}
              <div className="pt-2">
                <p className="font-bold text-xs text-slate-800 mb-1">
                  Tabel 3.1: Rekapitulasi Nilai IKM dan Kategori Mutu per Layanan
                </p>
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="border border-slate-400 p-2 w-10 text-center">No</th>
                      <th className="border border-slate-400 p-2 text-left">Nama Layanan Publik</th>
                      <th className="border border-slate-400 p-2 text-center w-28">Nilai IKM</th>
                      <th className="border border-slate-400 p-2 text-center w-36">Kategori Mutu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s, idx) => (
                      <tr key={s.id}>
                        <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 p-2">{s.namaLayanan}</td>
                        <td className="border border-slate-400 p-2 text-center font-bold">
                          {s.nilaiIKM.toFixed(2)}
                        </td>
                        <td className="border border-slate-400 p-2 text-center">
                          Mutu {getMutuPermenpan(s.nilaiIKM).mutu} ({getMutuPermenpan(s.nilaiIKM).predikat})
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={2} className="border border-slate-400 p-2 text-center">
                        RATA-RATA NILAI IKM UNIT PELAYANAN
                      </td>
                      <td className="border border-slate-400 p-2 text-center">
                        {stats.rerataIKM.toFixed(2)}
                      </td>
                      <td className="border border-slate-400 p-2 text-center">
                        Mutu {stats.mutuUnit} ({stats.predikatUnit})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* BAB IV */}
            <div className="whitespace-pre-line border-b border-slate-100 pb-6">{draft.bab4}</div>

            {/* BAB V */}
            <div className="space-y-4 border-b border-slate-100 pb-6">
              <div className="whitespace-pre-line">{draft.bab5}</div>

              {/* Tabel RTL Resmi */}
              <div className="pt-2">
                <p className="font-bold text-xs text-slate-800 mb-1">
                  Tabel 5.1: Matriks Rencana Tindak Lanjut (RTL) Triwulan Berikutnya
                </p>
                <table className="w-full border-collapse border border-slate-400 text-[11px]">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="border border-slate-400 p-1.5 w-8 text-center">No</th>
                      <th className="border border-slate-400 p-1.5 text-left w-28">Layanan Prioritas</th>
                      <th className="border border-slate-400 p-1.5 text-left">Masalah Utama</th>
                      <th className="border border-slate-400 p-1.5 text-left">Rencana Tindak Lanjut</th>
                      <th className="border border-slate-400 p-1.5 text-left w-28">Penanggung Jawab</th>
                      <th className="border border-slate-400 p-1.5 text-center w-20">Target</th>
                      <th className="border border-slate-400 p-1.5 text-left">Indikator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.rtlMatrix.map((item, idx) => (
                      <tr key={`prev_rtl_${idx}`}>
                        <td className="border border-slate-400 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">{item.layananPrioritas}</td>
                        <td className="border border-slate-400 p-1.5">{item.masalahUtama}</td>
                        <td className="border border-slate-400 p-1.5">{item.rencanaTindakLanjut}</td>
                        <td className="border border-slate-400 p-1.5">{item.penanggungJawab}</td>
                        <td className="border border-slate-400 p-1.5 text-center">{item.targetWaktu}</td>
                        <td className="border border-slate-400 p-1.5">{item.indikatorKeberhasilan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LEMBAR PENGESAHAN PIMPINAN */}
            <div className="pt-6 flex justify-end">
              <div className="w-64 text-center font-sans space-y-1">
                <p className="text-xs text-slate-700">
                  {agencyInfo.namaInstansi.replace('Pemerintah ', '')}, {agencyInfo.tanggalLaporan}
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {agencyInfo.jabatanPimpinan} {agencyInfo.unitKerja},
                </p>
                <div className="h-16" /> {/* Signature space */}
                <p className="text-xs font-bold underline text-slate-900">
                  {agencyInfo.namaPimpinan}
                </p>
                <p className="text-[11px] text-slate-600">
                  NIP. {agencyInfo.nipPimpinan}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
