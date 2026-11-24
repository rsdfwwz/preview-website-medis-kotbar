import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { LetterSigner } from '../../../types';

interface DrawSignatureModalProps {
  signer: LetterSigner | null;
  onClose: () => void;
  onSaveSignature: (signerId: string, dataUrl: string) => void;
}

export function DrawSignatureModal({
  signer,
  onClose,
  onSaveSignature,
}: DrawSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  const applyStrokeStyle = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    if (!signer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    applyStrokeStyle(ctx);

    if (signer.ttdImageData) {
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        applyStrokeStyle(ctx);
      };
      img.src = signer.ttdImageData;
    }
  }, [signer]);

  if (!signer) return null;

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    applyStrokeStyle(ctx);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    setDrawing(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    applyStrokeStyle(ctx);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSaveSignature(signer.id, canvas.toDataURL('image/png'));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-heading text-sm font-extrabold text-slate-900">
              Gambar Tanda Tangan Digital
            </h3>
            <p className="text-[11px] text-slate-500">{signer.labelAtas}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Tutup modal tanda tangan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={420}
          height={170}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="mt-4 w-full touch-none cursor-crosshair rounded-xl border border-dashed border-slate-300 bg-white"
        />

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Bersihkan
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white hover:bg-[#6E0F0F]"
            >
              Simpan TTD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DrawSignatureModal;