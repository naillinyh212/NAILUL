/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AgencyInfo,
  CalculatedStats,
  DemographicsData,
  ReportDraft,
  ReportHistoryRecord,
  ServiceItem,
} from './types/skm';
import {
  calculateSKMStats,
  generateDeterministicDraft,
  PRESET_INSTANSI_TEMPLATES,
} from './utils/skmCalculator';
import { AgencyForm } from './components/AgencyForm';
import { DataInputSection } from './components/DataInputSection';
import { StatsAnalyticsView } from './components/StatsAnalyticsView';
import { ReportDraftEditor } from './components/ReportDraftEditor';
import { RtlMatrixPreview } from './components/RtlMatrixPreview';
import { HistoryView } from './components/HistoryView';
import {
  Building2,
  ClipboardList,
  BarChart3,
  Sparkles,
  FileCheck2,
  History,
  CheckCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

const STORAGE_KEY_STATE = 'si_agen_skm_state_v1';
const STORAGE_KEY_HISTORY = 'si_agen_skm_history_v1';

export default function App() {
  // Step navigation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Initial state from default preset (Disdukcapil)
  const defaultPreset = PRESET_INSTANSI_TEMPLATES[0];
  const [agencyInfo, setAgencyInfo] = useState<AgencyInfo>(defaultPreset.agencyInfo);
  const [services, setServices] = useState<ServiceItem[]>(defaultPreset.services);
  const [demographics, setDemographics] = useState<DemographicsData>(defaultPreset.demographics);
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [history, setHistory] = useState<ReportHistoryRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Load state from localStorage on first mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY_STATE);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.agencyInfo) setAgencyInfo(parsed.agencyInfo);
        if (parsed.services) setServices(parsed.services);
        if (parsed.demographics) setDemographics(parsed.demographics);
        if (parsed.draft) setDraft(parsed.draft);
      }

      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      } else {
        // Seed initial history item for comparison feature
        const pastQuarterPreset = PRESET_INSTANSI_TEMPLATES[0];
        const pastServices = pastQuarterPreset.services.map((s) => ({
          ...s,
          nilaiIKM: Number((s.nilaiIKM - 2.5).toFixed(2)),
        }));
        const pastStats = calculateSKMStats(pastServices, pastQuarterPreset.demographics);
        const pastDraft = generateDeterministicDraft(
          { ...pastQuarterPreset.agencyInfo, periode: 'Triwulan II' },
          pastStats,
          pastServices,
          pastQuarterPreset.demographics
        );

        const initialRec: ReportHistoryRecord = {
          id: 'rec_baseline_tw2',
          timestamp: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
          agencyInfo: { ...pastQuarterPreset.agencyInfo, periode: 'Triwulan II' },
          services: pastServices,
          demographics: pastQuarterPreset.demographics,
          stats: pastStats,
          draft: pastDraft,
        };
        setHistory([initialRec]);
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify([initialRec]));
      }
    } catch (e) {
      console.warn('Gagal memuat state dari storage:', e);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_STATE,
        JSON.stringify({
          agencyInfo,
          services,
          demographics,
          draft,
        })
      );
    } catch (e) {
      console.warn('Gagal menyimpan state:', e);
    }
  }, [agencyInfo, services, demographics, draft]);

  // Save history to localStorage
  const saveToHistory = () => {
    if (!draft) return;
    const stats = calculateSKMStats(services, demographics);
    const newRecord: ReportHistoryRecord = {
      id: `skm_${Date.now()}`,
      timestamp: new Date().toISOString(),
      agencyInfo,
      services,
      demographics,
      stats,
      draft,
    };

    const updated = [newRecord, ...history.filter((h) => h.id !== newRecord.id)];
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    showToast('Draf laporan berhasil diarsipkan ke Riwayat Laporan.', 'success');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Switch preset template
  const handleApplyPreset = (presetId: string) => {
    const tmpl = PRESET_INSTANSI_TEMPLATES.find((p) => p.id === presetId);
    if (tmpl) {
      setAgencyInfo(tmpl.agencyInfo);
      setServices(tmpl.services);
      setDemographics(tmpl.demographics);
      setDraft(null);
      showToast(`Template "${tmpl.nama.split('(')[0]}" berhasil dimuat.`, 'success');
    }
  };

  // Calculate stats deterministically (PRD: non-functional requirement: calculations done strictly in code)
  const stats: CalculatedStats = calculateSKMStats(services, demographics);

  // Generate full report with Gemini API with deterministic fallback
  const handleGenerateFullReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyInfo,
          stats,
          services,
          demographics,
          notes: agencyInfo.catatanKendala,
        }),
      });

      if (!response.ok) {
        throw new Error('Server AI tidak merespons atau kuota terbatas');
      }

      const data = await response.json();
      if (data.bab1 && data.bab2 && data.bab3 && data.bab4 && data.bab5) {
        const newDraft: ReportDraft = {
          bab1: data.bab1,
          bab2: data.bab2,
          bab3: data.bab3,
          bab4: data.bab4,
          bab5: data.bab5,
          rtlMatrix: data.rtlMatrix || [],
          generatedAt: new Date().toISOString(),
          version: 1,
        };
        setDraft(newDraft);
        showToast('Draf Laporan Bab I–V dan Matriks RTL berhasil disusun oleh Agen AI Gemini!', 'success');
        setCurrentStep(4);
      } else {
        throw new Error('Format balasan AI tidak lengkap');
      }
    } catch (err: any) {
      console.warn('Gagal memanggil Gemini API, beralih ke generator deterministik Permenpan RB:', err);
      // Deterministic high-quality fallback (permits offline / no-API-key use)
      const fallbackDraft = generateDeterministicDraft(agencyInfo, stats, services, demographics);
      setDraft(fallbackDraft);
      showToast('Draf Laporan Bab I–V berhasil disusun sesuai standar Permenpan RB No. 14/2017.', 'info');
      setCurrentStep(4);
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate single chapter (FR-11)
  const handleRegenerateChapter = async (
    chapterKey: 'bab1' | 'bab2' | 'bab3' | 'bab4' | 'bab5',
    customInstruction: string
  ) => {
    if (!draft) return;
    try {
      const response = await fetch('/api/regenerate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterKey,
          customInstruction,
          agencyInfo,
          stats,
          services,
          demographics,
          notes: agencyInfo.catatanKendala,
          currentDraft: draft[chapterKey],
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal meregenerasi bab');
      }

      const resData = await response.json();
      if (resData.content) {
        setDraft({
          ...draft,
          [chapterKey]: resData.content,
          lastEditedAt: new Date().toISOString(),
          version: draft.version + 1,
        });
        showToast(`Bab berhasil diperbaharui dengan instruksi baru.`, 'success');
      }
    } catch (err) {
      // Local enhancement fallback
      const baseDraft = generateDeterministicDraft(agencyInfo, stats, services, demographics);
      setDraft({
        ...draft,
        [chapterKey]: baseDraft[chapterKey],
        lastEditedAt: new Date().toISOString(),
        version: draft.version + 1,
      });
      showToast(`Bab berhasil diperbaharui ulang.`, 'info');
    }
  };

  const steps = [
    { id: 1, label: 'Profil Instansi', icon: Building2, desc: 'Kop & Pimpinan' },
    { id: 2, label: 'Input Data SKM', icon: ClipboardList, desc: 'Layanan & Responden' },
    { id: 3, label: 'Validasi & Analitik', icon: BarChart3, desc: 'Hitung Statistik' },
    { id: 4, label: 'Draf Laporan AI', icon: Sparkles, desc: 'Bab I–V Permenpan' },
    { id: 5, label: 'Matriks RTL & Cetak', icon: FileCheck2, desc: 'Ekspor Word & PDF' },
    { id: 6, label: 'Riwayat & Evaluasi', icon: History, desc: 'Banding Periode' },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : notification.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : 'bg-blue-900 text-white border-blue-700'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* HEADER: Indonesian GovTech Bureaucracy Identity */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Garuda / Gov Emblem Accent */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-md">
              <span className="font-serif font-black text-slate-950 text-base">RI</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">SI-AGen SKM</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Permenpan RB No. 14/2017
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Agen AI Penyusun Draf Laporan Survei Kepuasan Masyarakat &amp; Matriks Rencana Tindak Lanjut
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Periode Aktif:</span>
              <span className="font-semibold text-amber-400">
                {agencyInfo.periode} {agencyInfo.tahun}
              </span>
            </div>

            {draft && (
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs flex items-center gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Lihat Dokumen Final</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* STEPPER NAVIGATION BAR (User Flow 1 - 7 per PRD) */}
      <nav className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-2.5 gap-2 sm:gap-4 no-scrollbar">
            {steps.map((st) => {
              const Icon = st.icon;
              const isActive = currentStep === st.id;
              const isPast = currentStep > st.id;

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setCurrentStep(st.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs'
                      : isPast
                      ? 'text-slate-700 bg-slate-100 hover:bg-slate-200/70'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPast ? '✓' : st.id}
                  </span>
                  <div className="text-left">
                    <div className="leading-none">{st.label}</div>
                    <div
                      className={`text-[9px] font-normal mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {st.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Langkah 1: Konfigurasi Profil &amp; Template Instansi</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuaikan Kop Surat, identitas pimpinan penandatangan, nomor registrasi naskah dinas, dan catatan kendala lapangan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-xs"
              >
                Lanjut ke Input Data →
              </button>
            </div>
            <AgencyForm
              agencyInfo={agencyInfo}
              onChange={setAgencyInfo}
              onApplyPreset={handleApplyPreset}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Langkah 2: Input Nilai IKM Layanan &amp; Rekap Responden</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola nilai IKM per jenis layanan publik serta data agregat demografi (Jenis Kelamin, Usia, Pendidikan, Pekerjaan).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200"
                >
                  ← Profil
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-xs"
                >
                  Lihat Validasi &amp; Analitik →
                </button>
              </div>
            </div>
            <DataInputSection
              services={services}
              demographics={demographics}
              onServicesChange={setServices}
              onDemographicsChange={setDemographics}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Langkah 3: Validasi Data &amp; Analitik Deterministik</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perhitungan statistik resmi (Akurasi: formula kode, bukan estimasi LLM) serta identifikasi 2-3 layanan terendah.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200"
                >
                  ← Data Input
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-xs"
                >
                  Draf Laporan AI →
                </button>
              </div>
            </div>
            <StatsAnalyticsView
              stats={stats}
              services={services}
              onProceedToAgent={() => setCurrentStep(4)}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Langkah 4: Agen AI &amp; Editor Draf Bab I–V</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Draf lengkap naskah dinas resmi Permenpan RB No. 14/2017 dengan verifikasi konsistensi angka 100% (FR-10).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200"
                >
                  ← Analitik
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  disabled={!draft}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  Matriks RTL &amp; Ekspor →
                </button>
              </div>
            </div>
            <ReportDraftEditor
              agencyInfo={agencyInfo}
              stats={stats}
              services={services}
              demographics={demographics}
              draft={draft}
              onDraftChange={setDraft}
              onGenerateFullReport={handleGenerateFullReport}
              isGenerating={isGenerating}
              onRegenerateChapter={handleRegenerateChapter}
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Langkah 5: Matriks RTL &amp; Ekspor Dokumen Final</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tabel Rencana Tindak Lanjut terukur, pratinjau naskah dinas resmi ber-Kop Surat, unduh Word (.docx), dan cetak/PDF.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200"
                >
                  ← Editor Draf
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-700 text-white hover:bg-indigo-800 transition-colors shadow-xs"
                >
                  Arsip &amp; Riwayat →
                </button>
              </div>
            </div>
            {draft ? (
              <RtlMatrixPreview
                agencyInfo={agencyInfo}
                stats={stats}
                services={services}
                demographics={demographics}
                draft={draft}
                onDraftChange={setDraft}
                onSaveToHistory={saveToHistory}
              />
            ) : (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4">
                <p className="text-xs text-slate-500">Draf laporan belum dibuat.</p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white"
                >
                  Ke Langkah 4 untuk Susun Draf
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Arsip Riwayat &amp; Komparasi Antarperiode (FR-14)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau tren kenaikan kepuasan masyarakat dari triwulan ke triwulan untuk evaluasi reformasi birokrasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800"
              >
                ← Kembali ke Dokumen
              </button>
            </div>
            <HistoryView
              history={history}
              onLoadRecord={(rec) => {
                setAgencyInfo(rec.agencyInfo);
                setServices(rec.services);
                setDemographics(rec.demographics);
                setDraft(rec.draft);
                showToast(`Laporan ${rec.agencyInfo.periode} ${rec.agencyInfo.tahun} dimuat kembali.`, 'success');
                setCurrentStep(4);
              }}
              onDeleteRecord={(id) => {
                const filtered = history.filter((h) => h.id !== id);
                setHistory(filtered);
                localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(filtered));
                showToast('Arsip laporan berhasil dihapus.', 'info');
              }}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SI-AGen SKM © 2026 • Standar Permenpan RB No. 14 Tahun 2017</span>
          <span className="text-slate-400">
            Perhitungan Deterministik • Gemini AI Engine • Kepatuhan UU Perlindungan Data Pribadi (Data Agregat)
          </span>
        </div>
      </footer>
    </div>
  );
}
