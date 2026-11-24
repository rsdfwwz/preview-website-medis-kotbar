import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Copy,
  Download,
  Eye,
  FileText,
  Maximize2,
  PenTool,
  Plus,
  Printer,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { formatStaffDisplayName } from '@/utils/formatters';
import { DrawSignatureModal } from '../components/DrawSignatureModal';
import {
  LETTER_BASE_LAYOUT_HEIGHT,
  LETTER_BASE_LAYOUT_WIDTH,
  LETTER_CANVAS_HEIGHT,
  LETTER_CANVAS_WIDTH,
  LETTER_TEMPLATES,
} from '../constants';
import type {
  LetterFontStyle,
  LetterSection,
  LetterSectionType,
  LetterSigner,
  LetterTemplateId,
  OfficialLetterDraft,
  PortalStaffMember,
} from '../types';
import {
  createDefaultLetterByTemplate,
  renderFormattedBoldText,
  sanitizeFilePart,
} from '../utils';

interface OfficialLetterGeneratorProps {
  currentUser: PortalStaffMember;
  onNotify: (msg: string) => void;
}

export function OfficialLetterGenerator({ currentUser, onNotify }: OfficialLetterGeneratorProps) {
  const defaultSignerName = formatStaffDisplayName(currentUser);
  const defaultSignerRole = currentUser.role;

  const [letter, setLetter] = useState<OfficialLetterDraft>(() =>
    createDefaultLetterByTemplate('kontrak_kerjasama', defaultSignerName, defaultSignerRole)
  );
  const [activeStepTab, setActiveStepTab] = useState<'kop' | 'isi' | 'ttd'>('kop');
  const [archives, setArchives] = useState<OfficialLetterDraft[]>(() => [
    createDefaultLetterByTemplate('kontrak_kerjasama', defaultSignerName, defaultSignerRole),
  ]);
  const [showArchiveDrawer, setShowArchiveDrawer] = useState(false);
  const [showCenterPreviewModal, setShowCenterPreviewModal] = useState(false);
  const [centerPreviewZoom, setCenterPreviewZoom] = useState<number>(0.72);
  const [drawingSignerId, setDrawingSignerId] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<'png' | 'jpg' | 'pdf' | null>(null);
  const [logoSrc, setLogoSrc] = useState<string>('/logo.png');

  const sheetRenderRef = useRef<HTMLDivElement | null>(null);
  const signerFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleSelectTemplate = (templateId: LetterTemplateId) => {
    const nextDoc = createDefaultLetterByTemplate(
      templateId,
      defaultSignerName,
      defaultSignerRole
    );
    setLetter(nextDoc);
    const tplLabel = LETTER_TEMPLATES.find((t) => t.id === templateId)?.label ?? templateId;
    onNotify(`Template "${tplLabel}" dimuat. Semua kolom siap disesuaikan.`);
  };

  const handleSaveArchive = () => {
    const snapshot: OfficialLetterDraft = {
      ...letter,
      savedAt: new Date().toLocaleString('id-ID'),
    };
    setArchives((prev) => {
      const existingIdx = prev.findIndex((a) => a.id === snapshot.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = snapshot;
        return copy;
      }
      return [snapshot, ...prev];
    });
    onNotify(`Surat "${snapshot.perihal || snapshot.nomorSurat}" disimpan ke Arsip.`);
  };

  const handleDuplicateNew = () => {
    const cloned: OfficialLetterDraft = {
      ...letter,
      id: `draft-${Date.now()}`,
      savedAt: new Date().toLocaleString('id-ID'),
      nomorSurat: `${letter.nomorSurat}-COPY`,
    };
    setLetter(cloned);
    onNotify('Draf surat diduplikasi sebagai dokumen baru yang terpisah.');
  };

  const handleAddSection = (type: LetterSectionType) => {
    const nextNum = letter.sections.length + 1;
    const newSec: LetterSection =
      type === 'table'
        ? {
            id: `sec-${Date.now()}`,
            type: 'table',
            title: `${String.fromCharCode(64 + nextNum)}. RINCIAN DATA & KESEPAKATAN`,
            intro: 'Berikut rincian ketentuan yang disepakati:',
            columns: ['No', 'Uraian', 'Kesepakatan', 'Keterangan'],
            rows: [
              { id: `r-${Date.now()}-1`, cells: ['1', 'Item Layanan', 'Sesuai Ketentuan', ''] },
            ],
            content: '',
            bullets: [],
          }
        : type === 'list'
          ? {
              id: `sec-${Date.now()}`,
              type: 'list',
              title: `${String.fromCharCode(64 + nextNum)}. DAFTAR KETENTUAN POIN`,
              intro: '',
              columns: [],
              rows: [],
              content: '',
              bullets: ['Poin ketentuan pertama', 'Poin ketentuan kedua'],
            }
          : type === 'callout'
            ? {
                id: `sec-${Date.now()}`,
                type: 'callout',
                title: 'Syarat & Ketentuan:',
                intro: '',
                columns: [],
                rows: [],
                content: 'Tuliskan syarat, catatan khusus, atau informasi penting di sini.',
                bullets: [],
              }
            : {
                id: `sec-${Date.now()}`,
                type: 'paragraph',
                title: `${String.fromCharCode(64 + nextNum)}. URAIAN TAMBAHAN`,
                intro: '',
                columns: [],
                rows: [],
                content: 'Tuliskan paragraf penjelasan atau pasal tambahan secara jelas.',
                bullets: [],
              };

    setLetter((prev) => ({ ...prev, sections: [...prev.sections, newSec] }));
  };

  const handleMoveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= letter.sections.length) return;
    setLetter((prev) => {
      const next = [...prev.sections];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return { ...prev, sections: next };
    });
  };

  const handleDeleteSection = (secId: string) => {
    setLetter((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== secId),
    }));
  };

  const handleUpdateSection = (secId: string, patch: Partial<LetterSection>) => {
    setLetter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === secId ? { ...s, ...patch } : s)),
    }));
  };

  const handleAddTableRow = (secId: string) => {
    setLetter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId) return s;
        const nextIdx = s.rows.length + 1;
        const emptyCells = s.columns.map((_, cIdx) => (cIdx === 0 ? String(nextIdx) : ''));
        return {
          ...s,
          rows: [...s.rows, { id: `r-${Date.now()}-${nextIdx}`, cells: emptyCells }],
        };
      }),
    }));
  };

  const handleDeleteTableRow = (secId: string, rowId: string) => {
    setLetter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId) return s;
        return {
          ...s,
          rows: s.rows.filter((r) => r.id !== rowId),
        };
      }),
    }));
  };

  const handleUpdateCell = (secId: string, rowId: string, cellIdx: number, val: string) => {
    setLetter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== secId) return s;
        return {
          ...s,
          rows: s.rows.map((r) => {
            if (r.id !== rowId) return r;
            const nextCells = [...r.cells];
            nextCells[cellIdx] = val;
            return { ...r, cells: nextCells };
          }),
        };
      }),
    }));
  };

  const handleAddSigner = () => {
    setLetter((prev) => ({
      ...prev,
      signers: [
        ...prev.signers,
        {
          id: `s-${Date.now()}`,
          labelAtas: `Penandatangan #${prev.signers.length + 1}`,
          kosongkanNama: false,
          namaPenandatangan: '',
          jabatanPenandatangan: 'Pejabat Terkait',
        },
      ],
    }));
  };

  const handleUpdateSigner = (signerId: string, patch: Partial<LetterSigner>) => {
    setLetter((prev) => ({
      ...prev,
      signers: prev.signers.map((s) => (s.id === signerId ? { ...s, ...patch } : s)),
    }));
  };

  const handleDeleteSigner = (signerId: string) => {
    setLetter((prev) => ({
      ...prev,
      signers: prev.signers.filter((s) => s.id !== signerId),
    }));
  };

  const handleUploadSignerImage = (signerId: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdateSigner(signerId, { ttdImageData: reader.result });
        onNotify(`Gambar tanda tangan "${file.name}" berhasil dipasang.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderPageToCanvas = async (pageEl: HTMLDivElement | null): Promise<HTMLCanvasElement> => {
    const scaleX = LETTER_CANVAS_WIDTH / LETTER_BASE_LAYOUT_WIDTH;
    const scaleY = LETTER_CANVAS_HEIGHT / LETTER_BASE_LAYOUT_HEIGHT;

    const canvas = document.createElement('canvas');
    canvas.width = LETTER_CANVAS_WIDTH;
    canvas.height = LETTER_CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, LETTER_CANVAS_WIDTH, LETTER_CANVAS_HEIGHT);

    if (pageEl) {
      const clone = pageEl.cloneNode(true) as HTMLElement;
      clone.style.width = `${LETTER_BASE_LAYOUT_WIDTH}px`;
      clone.style.height = `${LETTER_BASE_LAYOUT_HEIGHT}px`;
      clone.style.minHeight = `${LETTER_BASE_LAYOUT_HEIGHT}px`;
      clone.style.maxWidth = `${LETTER_BASE_LAYOUT_WIDTH}px`;
      clone.style.boxShadow = 'none';
      clone.style.border = 'none';
      clone.style.borderRadius = '0';
      clone.style.margin = '0';

      const origImgs = Array.from(pageEl.querySelectorAll('img'));
      const cloneImgs = Array.from(clone.querySelectorAll('img'));
      await Promise.all(
        origImgs.map(async (origImg, i) => {
          const targetImg = cloneImgs[i];
          if (!targetImg) return;
          if (origImg.src.startsWith('data:')) return;
          try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = origImg.naturalWidth || 120;
            tempCanvas.height = origImg.naturalHeight || 120;
            const tCtx = tempCanvas.getContext('2d');
            if (tCtx && origImg.complete && origImg.naturalWidth > 0) {
              tCtx.drawImage(origImg, 0, 0);
              targetImg.src = tempCanvas.toDataURL('image/png');
            }
          } catch {
            // Abaikan jika gagal konversi eksternal
          }
        })
      );

      const styleSheetsText = Array.from(document.styleSheets)
        .map((sheet) => {
          try {
            return Array.from(sheet.cssRules)
              .map((rule) => rule.cssText)
              .join('\n');
          } catch {
            return '';
          }
        })
        .join('\n');

      const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      wrapper.setAttribute('width', String(LETTER_CANVAS_WIDTH));
      wrapper.setAttribute('height', String(LETTER_CANVAS_HEIGHT));
      wrapper.setAttribute('viewBox', `0 0 ${LETTER_BASE_LAYOUT_WIDTH} ${LETTER_BASE_LAYOUT_HEIGHT}`);

      const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleEl.textContent = styleSheetsText;
      wrapper.appendChild(styleEl);

      const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      fo.setAttribute('x', '0');
      fo.setAttribute('y', '0');
      fo.setAttribute('width', String(LETTER_BASE_LAYOUT_WIDTH));
      fo.setAttribute('height', String(LETTER_BASE_LAYOUT_HEIGHT));

      const div = document.createElement('div');
      div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      div.style.width = `${LETTER_BASE_LAYOUT_WIDTH}px`;
      div.style.height = `${LETTER_BASE_LAYOUT_HEIGHT}px`;
      div.style.minHeight = `${LETTER_BASE_LAYOUT_HEIGHT}px`;
      div.style.background = '#ffffff';
      div.style.overflow = 'hidden';
      div.appendChild(clone);
      fo.appendChild(div);
      wrapper.appendChild(fo);

      const svgString = new XMLSerializer().serializeToString(wrapper);
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.save();
          ctx.scale(scaleX, scaleY);
          ctx.drawImage(img, 0, 0, LETTER_BASE_LAYOUT_WIDTH, LETTER_BASE_LAYOUT_HEIGHT);
          ctx.restore();
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
        img.src = dataUrl;
      });
    }

    return canvas;
  };

  const handleExportImage = async (format: 'png' | 'jpg') => {
    setExportingFormat(format);
    try {
      const canvas = await renderPageToCanvas(sheetRenderRef.current);
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mime, 0.96);
      const link = document.createElement('a');
      const baseName = sanitizeFilePart(`${letter.perihal}_${letter.nomorSurat}`);
      link.download = `${baseName}_${LETTER_CANVAS_WIDTH}x${LETTER_CANVAS_HEIGHT}.${format === 'jpg' ? 'jpg' : 'png'}`;
      link.href = dataUrl;
      link.click();
      onNotify(
        `Berhasil mengekspor surat 1 lembar (${LETTER_CANVAS_WIDTH} × ${LETTER_CANVAS_HEIGHT} px) ke format ${format.toUpperCase()}.`
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportPdf = () => {
    setExportingFormat('pdf');
    setTimeout(() => {
      window.print();
      setExportingFormat(null);
      onNotify(
        `Jendela cetak 1 lembar (${LETTER_CANVAS_WIDTH} × ${LETTER_CANVAS_HEIGHT} px) dibuka — pilih "Save as PDF".`
      );
    }, 100);
  };

  const fontClass =
    letter.gayaHuruf === 'sans'
      ? 'font-sans'
      : letter.gayaHuruf === 'mono'
        ? 'font-mono'
        : 'font-serif';

  const drawingSigner = letter.signers.find((s) => s.id === drawingSignerId) ?? null;

  const renderSingleSheet = (targetRef?: React.RefObject<HTMLDivElement | null>) => (
    <div
      ref={targetRef}
      style={{
        width: `${LETTER_BASE_LAYOUT_WIDTH}px`,
        height: `${LETTER_BASE_LAYOUT_HEIGHT}px`,
      }}
      className={`flex flex-col justify-between bg-white px-10 py-7 text-slate-900 ${fontClass}`}
    >
      <div>
        <div className="relative flex items-center justify-center border-b-2 border-[#8B1515] pb-2.5">
          <div className="absolute left-0 flex h-14 w-14 items-center justify-center">
            <img
              src={logoSrc}
              alt="Logo Rumah Sakit KotaBaru"
              onError={() => setLogoSrc('/vite.svg')}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="px-16 text-center">
            <h4 className="font-heading text-[18px] font-extrabold uppercase tracking-[0.06em] text-[#8B1515]">
              {letter.judulInstansi || 'RUMAH SAKIT KOTABARU ROLEPLAY'}
            </h4>
            <p className="mt-0.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-900">
              {letter.subjudulRumahSakit || 'RUMAH SAKIT PILLBOX MEDICAL CENTER'}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {letter.alamatKop ||
                'Alamat: Pillbox Medical Center, Koordinat 201 — KotaBaru Roleplay'}
            </p>
          </div>
        </div>
        <div className="mt-[2px] h-[1px] w-full bg-[#8B1515]" />

        <div className="mt-3 flex items-start justify-between gap-2 text-[11px]">
          <div className="space-y-0.5 leading-snug">
            <div className="grid grid-cols-[64px_10px_1fr] items-start">
              <span className="text-slate-800">Nomor</span>
              <span>:</span>
              <span className="font-medium text-slate-900">{letter.nomorSurat}</span>
            </div>
            <div className="grid grid-cols-[64px_10px_1fr] items-start">
              <span className="text-slate-800">Lampiran</span>
              <span>:</span>
              <span className="text-slate-800">{letter.lampiran || '-'}</span>
            </div>
            <div className="grid grid-cols-[64px_10px_1fr] items-start">
              <span className="text-slate-800">Perihal</span>
              <span>:</span>
              <span className="font-bold text-slate-950">{letter.perihal}</span>
            </div>
          </div>

          <div className="pt-0.5 text-right">
            <span className="text-[11px] font-medium text-slate-800">{letter.kotaTanggal}</span>
          </div>
        </div>

        <div className="mt-3 text-[11px] leading-snug">
          <p className="text-slate-800">{letter.tujuanPrefix || 'Kepada Yth.'}</p>
          <p className="mt-0.5 font-bold text-slate-950">{letter.tujuanUtama}</p>
          <p className="mt-0.5 text-slate-800">{letter.tujuanLokasi || 'Di Tempat'}</p>
        </div>

        <div className="mt-3 space-y-1.5 text-[11px] leading-snug text-slate-800">
          <p>{letter.salamPembuka || 'Dengan hormat,'}</p>
          <p className="text-justify">{renderFormattedBoldText(letter.paragrafPembuka)}</p>
        </div>

        <div className="mt-2.5 space-y-2.5 text-[11px] leading-snug text-slate-800">
          {letter.sections.map((sec) => {
            if (sec.type === 'table') {
              return (
                <div key={sec.id} className="space-y-1">
                  {sec.title && (
                    <h5 className="font-heading text-[11px] font-extrabold uppercase tracking-wide text-[#8B1515]">
                      {sec.title}
                    </h5>
                  )}
                  {sec.intro && (
                    <p className="text-justify text-slate-800">
                      {renderFormattedBoldText(sec.intro)}
                    </p>
                  )}
                  <div className="overflow-hidden pt-0.5">
                    <table className="w-full border-collapse border border-slate-200 text-[10px]">
                      <thead>
                        <tr className="bg-[#8B1515] text-white">
                          {sec.columns.map((col, cIdx) => (
                            <th
                              key={cIdx}
                              className="border border-[#751111] px-2 py-1 text-left font-bold"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sec.rows.map((row) => (
                          <tr key={row.id} className="bg-white">
                            {row.cells.map((cell, cellIdx) => (
                              <td
                                key={cellIdx}
                                className="whitespace-pre-line border border-slate-200 px-2 py-1.5 align-top text-slate-800"
                              >
                                {renderFormattedBoldText(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            if (sec.type === 'list') {
              return (
                <div key={sec.id} className="space-y-1">
                  {sec.title && (
                    <h5 className="font-heading text-[11px] font-extrabold uppercase tracking-wide text-[#8B1515]">
                      {sec.title}
                    </h5>
                  )}
                  {sec.intro && <p className="text-slate-800">{renderFormattedBoldText(sec.intro)}</p>}
                  <ul className="list-disc space-y-0.5 pl-5 text-slate-800">
                    {sec.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{renderFormattedBoldText(b)}</li>
                    ))}
                  </ul>
                </div>
              );
            }

            if (sec.type === 'callout') {
              return (
                <div
                  key={sec.id}
                  className="border-l-[3px] border-[#8B1515] bg-[#FDF2F2] px-3 py-2 text-[10.5px] text-slate-800"
                >
                  {sec.title && (
                    <p className="font-bold text-[#8B1515]">{renderFormattedBoldText(sec.title)}</p>
                  )}
                  <p className="mt-0.5 whitespace-pre-line leading-snug">
                    {renderFormattedBoldText(sec.content)}
                  </p>
                </div>
              );
            }

            return (
              <div key={sec.id} className="space-y-1">
                {sec.title && (
                  <h5 className="font-heading text-[11px] font-extrabold uppercase tracking-wide text-[#8B1515]">
                    {sec.title}
                  </h5>
                )}
                <p className="whitespace-pre-line text-justify text-slate-800">
                  {renderFormattedBoldText(sec.content)}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-2.5 text-justify text-[11px] leading-snug text-slate-800">
          {renderFormattedBoldText(letter.paragrafPenutup)}
        </p>

        <div
          className={`mt-4 grid gap-4 text-center text-[10.5px] ${
            letter.signers.length === 1
              ? 'grid-cols-1'
              : letter.signers.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-3'
          }`}
        >
          {letter.signers.map((signer) => (
            <div key={signer.id} className="flex flex-col items-center justify-between">
              <p className="font-bold text-slate-900">{signer.labelAtas}</p>

              <div className="my-1.5 flex h-11 w-28 items-center justify-center">
                {signer.ttdImageData && (
                  <img
                    src={signer.ttdImageData}
                    alt={`TTD ${signer.labelAtas}`}
                    className="max-h-11 max-w-28 object-contain"
                  />
                )}
              </div>

              <div className="w-full">
                {signer.kosongkanNama ? (
                  <p className="font-bold tracking-widest text-slate-900">
                    ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )
                  </p>
                ) : (
                  <p className="inline-block border-b border-slate-900 pb-0.5 font-bold text-slate-950">
                    {signer.namaPenandatangan || '________________'}
                  </p>
                )}
                <p className="mt-0.5 text-[10px] text-slate-600">{signer.jabatanPenandatangan}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-[9px] text-slate-400">
        <span>{letter.footerText}</span>
        <span>Halaman 1 dari 1</span>
      </div>
    </div>
  );

  const previewScale = 0.46;
  const previewBoxWidth = Math.round(LETTER_BASE_LAYOUT_WIDTH * previewScale);
  const previewBoxHeight = Math.round(LETTER_BASE_LAYOUT_HEIGHT * previewScale);

  const centerModalBoxWidth = Math.round(LETTER_BASE_LAYOUT_WIDTH * centerPreviewZoom);
  const centerModalBoxHeight = Math.round(LETTER_BASE_LAYOUT_HEIGHT * centerPreviewZoom);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page {
            size: ${LETTER_CANVAS_WIDTH}px ${LETTER_CANVAS_HEIGHT}px;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .letter-print-target,
          .letter-print-target * {
            visibility: visible;
          }
          .letter-print-target {
            position: fixed;
            left: 0;
            top: 0;
            width: ${LETTER_CANVAS_WIDTH}px !important;
            height: ${LETTER_CANVAS_HEIGHT}px !important;
            transform: scale(2) !important;
            transform-origin: top left !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0" aria-hidden="true">
        <div className="letter-print-target">{renderSingleSheet(sheetRenderRef)}</div>
      </div>

      <DrawSignatureModal
        signer={drawingSigner}
        onClose={() => setDrawingSignerId(null)}
        onSaveSignature={(signerId, dataUrl) => {
          handleUpdateSigner(signerId, { ttdImageData: dataUrl });
          onNotify('Tanda tangan digital berhasil disimpan.');
        }}
      />

      {showCenterPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
          onClick={() => setShowCenterPreviewModal(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-5 py-3 text-white">
              <div>
                <h3 className="font-heading text-sm font-extrabold">
                  Preview Surat Resmi ({LETTER_CANVAS_WIDTH} × {LETTER_CANVAS_HEIGHT} px · 1 Lembar)
                </h3>
                <p className="text-[11px] text-slate-400">
                  {letter.nomorSurat} — {letter.perihal}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 p-1 text-xs">
                  {[0.55, 0.72, 0.9].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setCenterPreviewZoom(z)}
                      className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                        centerPreviewZoom === z
                          ? 'bg-[#8B1515] text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleExportImage('png')}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                >
                  Unduh PNG
                </button>
                <button
                  type="button"
                  onClick={() => handleExportImage('jpg')}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                >
                  Unduh JPG
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="rounded-xl bg-[#8B1515] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#6E0F0F]"
                >
                  Cetak / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowCenterPreviewModal(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                  aria-label="Tutup preview surat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-800/80 p-6">
              <div
                style={{
                  width: `${centerModalBoxWidth}px`,
                  height: `${centerModalBoxHeight}px`,
                }}
                className="relative shrink-0 overflow-hidden rounded-md shadow-2xl ring-1 ring-black/30"
              >
                <div
                  style={{
                    transform: `scale(${centerPreviewZoom})`,
                    transformOrigin: 'top left',
                  }}
                >
                  {renderSingleSheet()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#8B1515]">
              <FileText className="h-3.5 w-3.5" />
              ADMINISTRASI & TATA NASKAH DINAS · AKSES HRD KE ATAS
            </div>
            <h2 className="mt-2 font-heading text-xl font-extrabold text-slate-900 sm:text-2xl">
              Pembuatan Surat Resmi Rumah Sakit KotaBaru
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Format 1 lembar utuh <strong>1588 × 2246 px</strong>, siap ekspor ke PDF, PNG, dan
              JPG.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCenterPreviewModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#6E0F0F]"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Preview Surat
            </button>
            <button
              type="button"
              onClick={() => setShowArchiveDrawer((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <BookOpen className="h-3.5 w-3.5 text-slate-500" />
              Arsip ({archives.length})
            </button>
            <button
              type="button"
              onClick={handleDuplicateNew}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              Duplikat Baru
            </button>
            <button
              type="button"
              onClick={handleSaveArchive}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
            >
              <Save className="h-3.5 w-3.5" />
              Simpan Arsip
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              {exportingFormat === 'pdf' ? 'Menyiapkan...' : 'Ekspor PDF'}
            </button>
            <button
              type="button"
              onClick={() => handleExportImage('png')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Ekspor PNG
            </button>
            <button
              type="button"
              onClick={() => handleExportImage('jpg')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Ekspor JPG
            </button>
          </div>
        </div>

        {showArchiveDrawer && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Arsip Draf & Surat Resmi Tersimpan ({archives.length})
              </p>
              <button
                type="button"
                onClick={() => setShowArchiveDrawer(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {archives.map((arc) => (
                <div
                  key={arc.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {arc.perihal || 'Tanpa Perihal'}
                    </p>
                    <p className="font-mono text-[10px] text-slate-500">
                      {arc.nomorSurat} · {arc.savedAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLetter(arc);
                      setShowArchiveDrawer(false);
                      onNotify(`Memuat arsip surat "${arc.nomorSurat}".`);
                    }}
                    className="shrink-0 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-[#8B1515] hover:bg-rose-100"
                  >
                    Buka
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-[#8B1515]" />
            TEMPLATE SURAT RS KOTABARU:
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {LETTER_TEMPLATES.map((tpl) => {
              const active = letter.templateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    active
                      ? 'border-[#8B1515] bg-[#8B1515] text-white shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50/40'
                  }`}
                >
                  <span>{tpl.label}</span>
                  {tpl.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                        active ? 'bg-white/20 text-white' : 'bg-rose-100 text-[#8B1515]'
                      }`}
                    >
                      {tpl.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-rose-200/70 bg-white shadow-2xs xl:col-span-6">
          <div className="grid grid-cols-3 border-b border-slate-100 p-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveStepTab('kop')}
              className={`rounded-2xl py-2.5 text-center transition ${
                activeStepTab === 'kop'
                  ? 'border border-rose-200 bg-rose-50/50 text-[#8B1515] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Kop & Tujuan
            </button>
            <button
              type="button"
              onClick={() => setActiveStepTab('isi')}
              className={`rounded-2xl py-2.5 text-center transition ${
                activeStepTab === 'isi'
                  ? 'border border-rose-200 bg-rose-50/50 text-[#8B1515] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Isi & Tabel
            </button>
            <button
              type="button"
              onClick={() => setActiveStepTab('ttd')}
              className={`rounded-2xl py-2.5 text-center transition ${
                activeStepTab === 'ttd'
                  ? 'border border-rose-200 bg-rose-50/50 text-[#8B1515] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3. TTD & Footer
            </button>
          </div>

          <div className="max-h-[680px] space-y-5 overflow-y-auto p-5">
            {activeStepTab === 'kop' && (
              <>
                <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8B1515]">
                    KOP SURAT RESMI
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Judul Instansi Utama
                    </label>
                    <input
                      type="text"
                      value={letter.judulInstansi}
                      onChange={(e) => setLetter({ ...letter, judulInstansi: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Subjudul Rumah Sakit
                    </label>
                    <input
                      type="text"
                      value={letter.subjudulRumahSakit}
                      onChange={(e) =>
                        setLetter({ ...letter, subjudulRumahSakit: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Alamat Kop Surat
                    </label>
                    <input
                      type="text"
                      value={letter.alamatKop}
                      onChange={(e) => setLetter({ ...letter, alamatKop: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Nomor Surat</label>
                    <input
                      type="text"
                      value={letter.nomorSurat}
                      onChange={(e) => setLetter({ ...letter, nomorSurat: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Kota & Tanggal
                    </label>
                    <input
                      type="text"
                      value={letter.kotaTanggal}
                      onChange={(e) => setLetter({ ...letter, kotaTanggal: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Lampiran</label>
                    <input
                      type="text"
                      value={letter.lampiran}
                      onChange={(e) => setLetter({ ...letter, lampiran: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Gaya Huruf Dokumen
                    </label>
                    <select
                      value={letter.gayaHuruf}
                      onChange={(e) =>
                        setLetter({ ...letter, gayaHuruf: e.target.value as LetterFontStyle })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <option value="serif">Klasik Resmi (Serif)</option>
                      <option value="sans">Modern Bersih (Sans)</option>
                      <option value="mono">Dokumen Teknis (Monospace)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Perihal Surat
                  </label>
                  <textarea
                    rows={2}
                    value={letter.perihal}
                    onChange={(e) => setLetter({ ...letter, perihal: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    TUJUAN PENERIMA SURAT
                  </p>
                  <input
                    type="text"
                    value={letter.tujuanPrefix}
                    onChange={(e) => setLetter({ ...letter, tujuanPrefix: e.target.value })}
                    placeholder="Kepada Yth."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={letter.tujuanUtama}
                    onChange={(e) => setLetter({ ...letter, tujuanUtama: e.target.value })}
                    placeholder="Nama / Instansi Tujuan"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                  />
                  <input
                    type="text"
                    value={letter.tujuanLokasi}
                    onChange={(e) => setLetter({ ...letter, tujuanLokasi: e.target.value })}
                    placeholder="Di Tempat"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                </div>
              </>
            )}

            {activeStepTab === 'isi' && (
              <>
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[11px] leading-relaxed text-amber-900">
                  Tip: Gunakan tanda <strong>**kata tebal**</strong> untuk menebalkan teks di
                  paragraf, kotak catatan, atau sel tabel. Dokumen selalu 1 lembar{' '}
                  <strong>
                    {LETTER_CANVAS_WIDTH} × {LETTER_CANVAS_HEIGHT} px
                  </strong>
                  .
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Salam Pembuka
                  </label>
                  <input
                    type="text"
                    value={letter.salamPembuka}
                    onChange={(e) => setLetter({ ...letter, salamPembuka: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Paragraf Pembuka
                  </label>
                  <textarea
                    rows={3}
                    value={letter.paragrafPembuka}
                    onChange={(e) => setLetter({ ...letter, paragrafPembuka: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs leading-relaxed"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-extrabold text-slate-800">
                    Bagian / Seksi Surat ({letter.sections.length})
                  </p>

                  {letter.sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="space-y-3 rounded-2xl border border-rose-200/70 bg-rose-50/20 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#8B1515]">
                          {sec.type === 'table'
                            ? 'TABEL FORMAL'
                            : sec.type === 'list'
                              ? 'DAFTAR POIN'
                              : sec.type === 'callout'
                                ? 'KOTAK SYARAT / CATATAN'
                                : 'PARAGRAF'}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveSection(idx, -1)}
                            disabled={idx === 0}
                            className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 disabled:opacity-35"
                            title="Pindah ke atas"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSection(idx, 1)}
                            disabled={idx === letter.sections.length - 1}
                            className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 disabled:opacity-35"
                            title="Pindah ke bawah"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSection(sec.id)}
                            className="rounded-lg border border-rose-200 bg-rose-50 p-1 text-rose-700 hover:bg-rose-100"
                            title="Hapus seksi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Judul Bagian (Opsional)
                        </label>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => handleUpdateSection(sec.id, { title: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#8B1515]"
                        />
                      </div>

                      {sec.type === 'table' && (
                        <>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Pengantar Bagian (Opsional)
                            </label>
                            <textarea
                              rows={2}
                              value={sec.intro}
                              onChange={(e) =>
                                handleUpdateSection(sec.id, { intro: e.target.value })
                              }
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Header Kolom Tabel
                            </label>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                              {sec.columns.map((col, cIdx) => (
                                <input
                                  key={cIdx}
                                  type="text"
                                  value={col}
                                  onChange={(e) => {
                                    const nextCols = [...sec.columns];
                                    nextCols[cIdx] = e.target.value;
                                    handleUpdateSection(sec.id, { columns: nextCols });
                                  }}
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800"
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <p className="text-[11px] font-semibold text-slate-600">
                              Baris Data Tabel
                            </p>
                            {sec.rows.map((row, rIdx) => (
                              <div
                                key={row.id}
                                className="space-y-2 rounded-xl border border-slate-200/90 bg-white p-3"
                              >
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                  <span>Baris #{rIdx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTableRow(sec.id, row.id)}
                                    className="text-rose-600 hover:text-rose-800"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                {row.cells.map((cell, cIdx) => (
                                  <div key={cIdx}>
                                    <label className="block text-[10px] font-semibold text-slate-500">
                                      {sec.columns[cIdx] || `Kolom ${cIdx + 1}`}
                                    </label>
                                    <textarea
                                      rows={cIdx === row.cells.length - 1 ? 2 : 1}
                                      value={cell}
                                      onChange={(e) =>
                                        handleUpdateCell(sec.id, row.id, cIdx, e.target.value)
                                      }
                                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                                    />
                                  </div>
                                ))}
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddTableRow(sec.id)}
                              className="w-full rounded-xl border border-dashed border-rose-300 bg-white py-2 text-xs font-bold text-[#8B1515] hover:bg-rose-50"
                            >
                              + Tambah Baris Tabel
                            </button>
                          </div>
                        </>
                      )}

                      {sec.type === 'list' && (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-semibold text-slate-600">
                            Daftar Poin (Satu poin per baris)
                          </label>
                          <textarea
                            rows={4}
                            value={sec.bullets.join('\n')}
                            onChange={(e) =>
                              handleUpdateSection(sec.id, {
                                bullets: e.target.value.split('\n'),
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                          />
                        </div>
                      )}

                      {(sec.type === 'paragraph' || sec.type === 'callout') && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600">
                            {sec.type === 'callout' ? 'Isi Kotak Catatan' : 'Isi Paragraf'}
                          </label>
                          <textarea
                            rows={3}
                            value={sec.content}
                            onChange={(e) =>
                              handleUpdateSection(sec.id, { content: e.target.value })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2 rounded-2xl border border-dashed border-rose-300 bg-rose-50/20 p-4">
                  <p className="text-xs font-bold text-[#8B1515]">+ Tambah Bagian Baru ke Surat:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddSection('table')}
                      className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:border-[#8B1515]"
                    >
                      Tabel Formal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('paragraph')}
                      className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:border-[#8B1515]"
                    >
                      Paragraf
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('list')}
                      className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:border-[#8B1515]"
                    >
                      Daftar Poin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('callout')}
                      className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:border-[#8B1515]"
                    >
                      Kotak Catatan
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Paragraf Penutup
                  </label>
                  <textarea
                    rows={2}
                    value={letter.paragrafPenutup}
                    onChange={(e) => setLetter({ ...letter, paragrafPenutup: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                  />
                </div>
              </>
            )}

            {activeStepTab === 'ttd' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      Kolom Penandatanganan ({letter.signers.length})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Gambar TTD, unggah TTD, atau kosongkan nama untuk pihak luar `( )`.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSigner}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-[#8B1515] hover:bg-rose-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah TTD
                  </button>
                </div>

                <div className="space-y-3">
                  {letter.signers.map((signer, idx) => (
                    <div
                      key={signer.id}
                      className="space-y-2.5 rounded-2xl border border-rose-200/70 bg-rose-50/20 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#8B1515]">
                          Penandatangan #{idx + 1}
                        </span>
                        {letter.signers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSigner(signer.id)}
                            className="rounded-lg p-1 text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Label Atas TTD
                        </label>
                        <input
                          type="text"
                          value={signer.labelAtas}
                          onChange={(e) =>
                            handleUpdateSigner(signer.id, { labelAtas: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                        />
                      </div>

                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={signer.kosongkanNama}
                          onChange={(e) =>
                            handleUpdateSigner(signer.id, { kosongkanNama: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[#8B1515]"
                        />
                        <span>Kosongkan nama untuk tanda tangan pihak luar `( )`</span>
                      </label>

                      {!signer.kosongkanNama && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Nama Penandatangan
                          </label>
                          <input
                            type="text"
                            value={signer.namaPenandatangan}
                            onChange={(e) =>
                              handleUpdateSigner(signer.id, { namaPenandatangan: e.target.value })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Jabatan Penandatangan
                        </label>
                        <input
                          type="text"
                          value={signer.jabatanPenandatangan}
                          onChange={(e) =>
                            handleUpdateSigner(signer.id, { jabatanPenandatangan: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setDrawingSignerId(signer.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-red-300"
                        >
                          <PenTool className="h-3.5 w-3.5 text-[#8B1515]" />
                          Gambar TTD
                        </button>
                        <button
                          type="button"
                          onClick={() => signerFileInputRefs.current[signer.id]?.click()}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-red-300"
                        >
                          <Upload className="h-3.5 w-3.5 text-slate-600" />
                          Upload TTD
                        </button>
                        {signer.ttdImageData && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSigner(signer.id, { ttdImageData: undefined })
                            }
                            className="rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Hapus TTD
                          </button>
                        )}
                        <input
                          ref={(el) => {
                            signerFileInputRefs.current[signer.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleUploadSignerImage(signer.id, e.target.files?.[0])
                          }
                          className="hidden"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-xs font-semibold text-slate-700">
                    Teks Footer Bawah
                  </label>
                  <input
                    type="text"
                    value={letter.footerText}
                    onChange={(e) => setLetter({ ...letter, footerText: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8B1515] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#6E0F0F]"
                  >
                    <Printer className="h-4 w-4" />
                    Cetak / Unduh PDF 1 Lembar ({LETTER_CANVAS_WIDTH}×{LETTER_CANVAS_HEIGHT} px)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-slate-100/80 p-5 xl:col-span-6">
          <div className="mb-3 flex w-full max-w-[420px] flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
              <Eye className="h-4 w-4 text-emerald-600" />
              Pratinjau 1 Lembar ({LETTER_CANVAS_WIDTH} × {LETTER_CANVAS_HEIGHT} px)
            </p>

            <button
              type="button"
              onClick={() => setShowCenterPreviewModal(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-[#8B1515] hover:bg-rose-50"
            >
              <Maximize2 className="h-3 w-3" />
              Preview Surat
            </button>
          </div>

          <div
            onClick={() => setShowCenterPreviewModal(true)}
            style={{
              width: `${previewBoxWidth}px`,
              height: `${previewBoxHeight}px`,
            }}
            title="Klik untuk membuka preview surat di tengah layar"
            className="relative max-w-full cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md transition hover:ring-2 hover:ring-rose-300"
          >
            <div
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              {renderSingleSheet()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}