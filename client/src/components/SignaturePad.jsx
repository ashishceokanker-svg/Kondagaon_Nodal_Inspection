import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Check, PenTool } from 'lucide-react';

export default function SignaturePad({ title = 'हस्ताक्षर करें', onSave, value = null }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set display resolution
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
      setHasSignature(true);
    }
  }, [value]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas && onSave) {
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
      }
    }
  };

  const clearCanvas = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onSave) onSave('');
  };

  return (
    <div className="border border-slate-300 rounded-xl p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-blue-600" />
          {title}
        </label>
        {hasSignature && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-rose-600 flex items-center gap-1 hover:underline py-0.5 px-2 rounded bg-rose-50 border border-rose-200"
          >
            <Trash2 className="w-3 h-3" /> साफ़ करें
          </button>
        )}
      </div>

      <div className="relative border-2 border-dashed border-slate-200 rounded-lg overflow-hidden bg-slate-50 touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-28 cursor-crosshair block"
          style={{ width: '100%', height: '110px' }}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs select-none">
            यहाँ उंगली या पेन से हस्ताक्षर करें
          </div>
        )}
      </div>
    </div>
  );
}
