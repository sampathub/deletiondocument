import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, Edit3 } from 'lucide-react';

interface SignaturePadProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  label = 'Signature',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isPhysicalVerified, setIsPhysicalVerified] = useState(
    value?.startsWith('Signed in Physical Register') || false
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isPhysicalVerified) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isPhysicalVerified) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setIsPhysicalVerified(false);
    onChange('');
  };

  const handlePhysicalVerifyToggle = () => {
    const nextVal = !isPhysicalVerified;
    setIsPhysicalVerified(nextVal);
    if (nextVal) {
      onChange('Signed in Physical Register (Verified with Original NIC)');
    } else {
      clearCanvas();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
          {label}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePhysicalVerifyToggle}
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              isPhysicalVerified
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isPhysicalVerified ? '✓ Physical Register Signed' : 'Use Physical Register'}
          </button>
          {!isPhysicalVerified && hasDrawn && (
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {isPhysicalVerified ? (
        <div className="h-28 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col items-center justify-center p-3 text-center">
          <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-1" />
          <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            Physical Book Register Verified
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
            Customer signed in Branch Physical Ledger Book & verified with Original NIC.
          </p>
        </div>
      ) : (
        <div className="relative border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white shadow-inner">
          <canvas
            ref={canvasRef}
            width={380}
            height={110}
            className="w-full h-28 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasDrawn && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
              Draw signature here or touch screen
            </div>
          )}
        </div>
      )}
    </div>
  );
};
