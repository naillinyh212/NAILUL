import React, { useState } from 'react';
import { AgencyInfo, CalculatedStats, DemographicsData, ReportDraft, ServiceItem } from '../types/skm';
import {
  FileText,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Edit3,
  BookOpen,
  Send,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { checkReportConsistency } from '../utils/skmCalculator';

interface ReportDraftEditorProps {
  agencyInfo: AgencyInfo;
  stats: CalculatedStats;
  services: ServiceItem[];
  demographics: DemographicsData;
  draft: ReportDraft | null;
  onDraftChange: (newDraft: ReportDraft) => void;
  onGenerateFullReport: () => Promise<void>;
  isGenerating: boolean;
  onRegenerateChapter: (chapterKey: 'bab1' | 'bab2' | 'bab3' | 'bab4' | 'bab5', instruction: string) => Promise<void>;
}

export const ReportDraftEditor: React.FC<ReportDraftEditorProps> = ({
  agencyInfo,
  stats,
  services,
  demographics,
  draft,
  onDraftChange,
  onGenerateFullReport,
  isGenerating,
  onRegenerateChapter,
}) => {
  const [activeTab, setActiveTab] = useState<'bab1' | 'bab2' | 'bab3' | 'bab4' | 'bab5'>('bab1');
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showConsistencyDetails, setShowConsistencyDetails] = useState(false);

  // Consistency audit
  const consistency = draft ? checkReportConsistency(draft, stats, services) : null;

  const handleTextChange = (key: 'bab1' | 'bab2' | 'bab3' | 'bab4' | 'bab5', val: string) => {
    if (!draft) return;
    onDraftChange({
      ...draft,
      [key]: val,
      lastEditedAt: new Date().toISOString(),
    });
  };

  const handleDoRegenChapter = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateChapter(activeTab, regenInstruction);
      setShowRegenModal(false);
      setRegenInstruction('');
    } finally {
      setIsRegenerating(false);
    }
  };

  const chapterTitles: Record<string, { title: string; subtitle: string }> = {
    bab1: { title: 'Bab I – Pendahuluan', subtitle: 'Latar Belakang, Maksud, Tujuan, Dasar Hukum, Ruang Lingkup' },
    bab2: { title: 'Bab II – Metodologi', subtitle: 'Metode Pengumpulan, Populasi & Sampel, Rumus IKM Permenpan 14/2017' },
    bab3: { title: 'Bab III – Hasil Survei', subtitle: 'Profil Demografi Responden, Rekapitulasi Nilai IKM & Mutu Layanan' },
    bab4: { title: 'Bab IV – Analisis', subtitle: 'Analisis Layanan Terendah, Akar Masalah 4M, Korelasi Demografi Dominan' },
    bab5: { title: 'Bab V – Penutup & RTL', subtitle: 'Kesimpulan, Saran Rekomendasi, Ringkasan Komitmen Perbaikan' },
  };

  if (!draft) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl font-bold text-slate-800">Draf Laporan Belum Disusun</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Data survei dan parameter instansi telah siap. Klik tombol di bawah untuk meminta Agen AI menyusun draf lengkap Bab I–V dan Matriks RTL sesuai format resmi Permenpan RB No. 14 Tahun 2017.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerateFullReport}
          disabled={isGenerating}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-semibold text-sm hover:from-blue-800 hover:to-indigo-900 transition-all shadow-md inline-flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Agen AI Sedang Menyusun Draf (Mohon Tunggu)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Mulai Susun Draf Laporan dengan Agen AI</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Action Buttons & FR-10 Consistency Badge */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* FR-10 Consistency Badge */}
          {consistency && (
            <button
              type="button"
              onClick={() => setShowConsistencyDetails(!showConsistencyDetails)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                consistency.isConsistent
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>FR-10 Audit Konsistensi: {consistency.score}% Sesuai</span>
              <span className="text-[10px] text-slate-400">({showConsistencyDetails ? 'Tutup Detail' : 'Lihat Detail'})</span>
            </button>
          )}

          <span className="text-xs text-slate-400">
            Draf Versi {draft.version} • Terakhir diperbarui:{' '}
            {draft.lastEditedAt ? new Date(draft.lastEditedAt).toLocaleTimeString('id-ID') : 'Baru saja'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Per-chapter Regen Button (FR-11) */}
          <button
            type="button"
            onClick={() => setShowRegenModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Regenerasi {chapterTitles[activeTab]?.title.split('–')[0]}</span>
          </button>

          {/* Full Regenerate Button */}
          <button
            type="button"
            onClick={onGenerateFullReport}
            disabled={isGenerating}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Susun Ulang Semua Bab</span>
          </button>
        </div>
      </div>

      {/* Consistency Findings Drawer (FR-10) */}
      {showConsistencyDetails && consistency && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Laporan Verifikasi Konsistensi Angka (Acceptance Criteria #2)
            </h5>
            <span className="text-xs text-slate-500">
              Target: 100% angka pada teks narasi sama persis dengan data input hitung
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {consistency.findings.map((f, i) => (
              <div
                key={`finding_${i}`}
                className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start gap-2"
              >
                {f.status === 'pass' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-700">{f.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapter Tabs & Editor (FR-08, FR-11) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/75">
          {(['bab1', 'bab2', 'bab3', 'bab4', 'bab5'] as const).map((tabKey) => {
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`px-5 py-3 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                  isActive
                    ? 'border-blue-700 text-blue-700 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{chapterTitles[tabKey].title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Chapter Header & Textarea */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-base text-slate-800">{chapterTitles[activeTab].title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{chapterTitles[activeTab].subtitle}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Dapat diedit langsung sebelum difinalisasi</span>
            </div>
          </div>

          <textarea
            rows={18}
            value={draft[activeTab]}
            onChange={(e) => handleTextChange(activeTab, e.target.value)}
            className="w-full p-4 font-sans text-xs leading-relaxed text-slate-800 bg-slate-50/30 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-y"
          />
        </div>
      </div>

      {/* Modal Regenerasi Bab Tertentu (FR-11) */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-indigo-700">
              <Sparkles className="w-5 h-5" />
              <h4 className="font-bold text-base text-slate-800">
                Regenerasi {chapterTitles[activeTab].title}
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              Tambahkan instruksi atau penekanan khusus bagi Agen AI untuk memperbaharui naskah bab ini.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instruksi Khusus untuk Bab Ini (Opsional)
              </label>
              <textarea
                rows={4}
                value={regenInstruction}
                onChange={(e) => setRegenInstruction(e.target.value)}
                placeholder="Contoh: Perjelas analisis kendala loket cetak KTP-el dan kaitkan dengan tingginya pemohon usia muda 20-29 tahun..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRegenModal(false)}
                disabled={isRegenerating}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDoRegenChapter}
                disabled={isRegenerating}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-700 text-white hover:bg-indigo-800 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Meregenerasi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Proses Regenerasi Bab</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
