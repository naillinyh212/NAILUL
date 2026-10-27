import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from 'docx';
import { AgencyInfo, CalculatedStats, DemographicsData, ReportDraft, ServiceItem } from '../types/skm';

/**
 * Ekspor Dokumen Resmi Laporan SKM Bab I-V dan Matriks RTL ke format .docx (Microsoft Word)
 */
export async function exportReportToDocx(
  agencyInfo: AgencyInfo,
  stats: CalculatedStats,
  services: ServiceItem[],
  demographics: DemographicsData,
  draft: ReportDraft
): Promise<Blob> {
  const thinBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '888888' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '888888' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '888888' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '888888' },
  };

  const headerBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '003366' },
    bottom: { style: BorderStyle.DOUBLE, size: 3, color: '003366' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '003366' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '003366' },
  };

  // Helper paragraph
  const p = (text: string, options: { bold?: boolean; italics?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; size?: number; spaceAfter?: number } = {}) => {
    return new Paragraph({
      alignment: options.align || AlignmentType.LEFT,
      spacing: { after: options.spaceAfter ?? 120, line: 276 },
      children: [
        new TextRun({
          text,
          bold: options.bold || false,
          italics: options.italics || false,
          size: options.size || 23, // 11.5pt in half-points
          font: 'Calibri',
        }),
      ],
    });
  };

  // Helper text splitting for narrative chapters
  const textToParagraphs = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return new Paragraph({ spacing: { after: 100 } });
      }
      if (trimmed.startsWith('BAB ') || trimmed.startsWith('PENDAHULUAN') || trimmed.startsWith('METODOLOGI') || trimmed.startsWith('HASIL SURVEI') || trimmed.startsWith('ANALISIS') || trimmed.startsWith('PENUTUP')) {
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 26,
              font: 'Calibri',
            }),
          ],
        });
      }
      const isSubheading = /^[0-9]\.[0-9]/.test(trimmed) || /^[a-d]\./.test(trimmed);
      return new Paragraph({
        alignment: isSubheading ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
        spacing: { after: 120, line: 276 },
        children: [
          new TextRun({
            text: trimmed,
            bold: isSubheading,
            size: isSubheading ? 24 : 22,
            font: 'Calibri',
          }),
        ],
      });
    });
  };

  // Table IKM Layanan
  const tableIKMRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          borders: headerBorder,
          width: { size: 8, type: WidthType.PERCENTAGE },
          children: [p('No', { bold: true, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: headerBorder,
          width: { size: 52, type: WidthType.PERCENTAGE },
          children: [p('Nama Layanan Publik', { bold: true })],
        }),
        new TableCell({
          borders: headerBorder,
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [p('Nilai IKM', { bold: true, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: headerBorder,
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [p('Mutu Pelayanan', { bold: true, align: AlignmentType.CENTER })],
        }),
      ],
    }),
    ...services.map((s, idx) => {
      return new TableRow({
        children: [
          new TableCell({
            borders: thinBorder,
            children: [p(String(idx + 1), { align: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: thinBorder,
            children: [p(s.namaLayanan, { bold: false })],
          }),
          new TableCell({
            borders: thinBorder,
            children: [p(s.nilaiIKM.toFixed(2), { bold: true, align: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: thinBorder,
            children: [p(`Mutu ${stats.layananSorted.find((ls) => ls.id === s.id)?.mutu || '-'}`, { align: AlignmentType.CENTER })],
          }),
        ],
      });
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: headerBorder,
          columnSpan: 2,
          children: [p('RATA-RATA NILAI IKM UNIT PELAYANAN', { bold: true, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: headerBorder,
          children: [p(stats.rerataIKM.toFixed(2), { bold: true, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: headerBorder,
          children: [p(`Mutu ${stats.mutuUnit} (${stats.predikatUnit})`, { bold: true, align: AlignmentType.CENTER })],
        }),
      ],
    }),
  ];

  // Table Matriks RTL
  const tableRTLRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          borders: headerBorder,
          width: { size: 5, type: WidthType.PERCENTAGE },
          children: [p('No', { bold: true, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: headerBorder,
          width: { size: 18, type: WidthType.PERCENTAGE },
          children: [p('Layanan Prioritas', { bold: true })],
        }),
        new TableCell({
          borders: headerBorder,
          width: { size: 22, type: WidthType.PERCENTAGE },
          children: [p('Masalah Utama', { bold: true })],
        }),
        new TableCell({
          borders: headerBorder,
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [p('Rencana Tindak Lanjut', { bold: true })],
        }),
        new TableCell({
          borders: headerBorder,
          width: { size: 12, type: WidthType.PERCENTAGE },
          children: [p('Penanggung Jawab', { bold: true })],
        }),
        new TableCell({
          borders: headerBorder,
          width: { size: 8, type: WidthType.PERCENTAGE },
          children: [p('Target', { bold: true, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: headerBorder,
          width: { size: 10, type: WidthType.PERCENTAGE },
          children: [p('Indikator', { bold: true })],
        }),
      ],
    }),
    ...draft.rtlMatrix.map((item, idx) => {
      return new TableRow({
        children: [
          new TableCell({
            borders: thinBorder,
            children: [p(String(idx + 1), { align: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: thinBorder,
            children: [p(item.layananPrioritas, { bold: true })],
          }),
          new TableCell({
            borders: thinBorder,
            children: [p(item.masalahUtama)],
          }),
          new TableCell({
            borders: thinBorder,
            children: [p(item.rencanaTindakLanjut)],
          }),
          new TableCell({
            borders: thinBorder,
            children: [p(item.penanggungJawab)],
          }),
          new TableCell({
            borders: thinBorder,
            children: [p(item.targetWaktu, { align: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: thinBorder,
            children: [p(item.indikatorKeberhasilan)],
          }),
        ],
      });
    }),
  ];

  // Build document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Kop Surat
          p(agencyInfo.namaInstansi.toUpperCase(), { bold: true, align: AlignmentType.CENTER, size: 26 }),
          p(agencyInfo.unitKerja.toUpperCase(), { bold: true, align: AlignmentType.CENTER, size: 28 }),
          p(agencyInfo.alamat, { align: AlignmentType.CENTER, size: 18, italics: true }),
          p(`Telp: ${agencyInfo.telepon} | Email: ${agencyInfo.email} | Laman: ${agencyInfo.website}`, {
            align: AlignmentType.CENTER,
            size: 18,
            italics: true,
            spaceAfter: 180,
          }),

          // Judul Laporan
          p('LAPORAN HASIL SURVEI KEPUASAN MASYARAKAT (SKM)', { bold: true, align: AlignmentType.CENTER, size: 28 }),
          p(`PERIODE ${agencyInfo.periode.toUpperCase()} TAHUN ${agencyInfo.tahun}`, {
            bold: true,
            align: AlignmentType.CENTER,
            size: 24,
            spaceAfter: 240,
          }),
          p(`Nomor Registrasi: ${agencyInfo.nomorLaporan}`, { align: AlignmentType.CENTER, size: 20, spaceAfter: 300 }),

          // Bab I
          ...textToParagraphs(draft.bab1),

          // Bab II
          ...textToParagraphs(draft.bab2),

          // Bab III
          ...textToParagraphs(draft.bab3),
          p('Tabel 3.1: Rekapitulasi Nilai IKM dan Kategori Mutu per Layanan', { bold: true, spaceAfter: 120 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableIKMRows,
          }),
          p('', { spaceAfter: 200 }),

          // Bab IV
          ...textToParagraphs(draft.bab4),

          // Bab V
          ...textToParagraphs(draft.bab5),
          p('Tabel 5.1: Matriks Rencana Tindak Lanjut (RTL) Perbaikan Layanan', { bold: true, spaceAfter: 120 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRTLRows,
          }),
          p('', { spaceAfter: 240 }),

          // Lembar Pengesahan
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 300, after: 120 },
            children: [
              new TextRun({
                text: `${agencyInfo.namaInstansi.replace('Pemerintah ', '')}, ${agencyInfo.tanggalLaporan}`,
                font: 'Calibri',
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 720 }, // space for signature
            children: [
              new TextRun({
                text: `${agencyInfo.jabatanPimpinan} ${agencyInfo.unitKerja},`,
                bold: true,
                font: 'Calibri',
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: agencyInfo.namaPimpinan,
                bold: true,
                underline: {},
                font: 'Calibri',
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `NIP. ${agencyInfo.nipPimpinan}`,
                font: 'Calibri',
                size: 20,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Triggers browser download for Blob
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
