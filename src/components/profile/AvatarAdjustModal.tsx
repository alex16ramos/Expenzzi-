'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, X, Move, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AvatarAdjustModalProps {
  imageSrc: string;
  onClose: () => void;
  onConfirm: (croppedImageDataUrl: string) => void;
}

export function AvatarAdjustModal({ imageSrc, onClose, onConfirm }: AvatarAdjustModalProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [processing, setProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Mouse / Touch drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 4.0));
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  // Crop image using canvas and export Data URL
  const handleCropAndSave = useCallback(async () => {
    if (!imgRef.current || !imageLoaded) return;
    setProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const outputSize = 400; // 400x400 output resolution for high quality avatar
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setProcessing(false);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for canvas cropping'));
        img.src = imageSrc;
      });

      // Clear canvas background
      ctx.clearRect(0, 0, outputSize, outputSize);

      // Clip to circular avatar shape
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // DOM container & mask dimensions
      const containerW = containerRef.current?.clientWidth || 256;
      const containerH = containerRef.current?.clientHeight || 256;
      const circleDiameter = 210; // diameter of the DOM circular mask (w-[210px])

      // Natural image dimensions & aspect ratio
      const imgW = img.naturalWidth || img.width;
      const imgH = img.naturalHeight || img.height;
      const aspect = imgW / imgH;

      // Base dimensions inside DOM container (object-fit: contain)
      let domImgW = containerW;
      let domImgH = containerH;

      if (aspect >= 1) {
        domImgW = containerW;
        domImgH = containerW / aspect;
      } else {
        domImgH = containerH;
        domImgW = containerH * aspect;
      }

      // Scale factor mapping DOM circle diameter (210px) to output canvas resolution (400px)
      const factor = outputSize / circleDiameter;

      const baseCanvasWidth = domImgW * factor;
      const baseCanvasHeight = domImgH * factor;

      // Save canvas state & transform
      ctx.save();

      // Move origin to center of canvas
      ctx.translate(outputSize / 2, outputSize / 2);

      // Translate by drag offset (scaled by factor)
      ctx.translate(offset.x * factor, offset.y * factor);

      // Rotate by angle
      ctx.rotate((rotation * Math.PI) / 180);

      // Scale by zoom level
      ctx.scale(scale, scale);

      // Draw image centered at (0,0)
      ctx.drawImage(
        img,
        -baseCanvasWidth / 2,
        -baseCanvasHeight / 2,
        baseCanvasWidth,
        baseCanvasHeight
      );

      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/png', 0.95);
      onConfirm(croppedDataUrl);
    } catch (err) {
      console.error('Error cropping image:', err);
      // Fallback: if canvas export fails (e.g. CORS on third party image), pass original imageSrc
      onConfirm(imageSrc);
    } finally {
      setProcessing(false);
    }
  }, [imageSrc, imageLoaded, scale, offset, rotation, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Reajustar Foto de Perfil</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Arrastra y ajusta el zoom para encuadrar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Cropper Area */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden select-none">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
            className="relative w-64 h-64 rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden border border-slate-800 bg-slate-900 shadow-inner"
          >
            {/* Dark Mask with Circle Cutout */}
            <div className="absolute inset-0 z-10 pointer-events-none border-[24px] border-slate-950/80 rounded-2xl flex items-center justify-center">
              <div className="w-[210px] h-[210px] rounded-full border-2 border-indigo-400/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] ring-2 ring-indigo-500/40" />
            </div>

            {/* Helper Drag Icon Badge */}
            <div className="absolute top-2 right-2 z-20 pointer-events-none px-2 py-1 bg-slate-900/80 backdrop-blur rounded-lg text-[10px] text-indigo-300 font-semibold flex items-center gap-1">
              <Move className="w-3 h-3" /> Arrastrar
            </div>

            {/* Image display */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Ajustar foto"
              crossOrigin="anonymous"
              onLoad={() => {
                setImageLoaded(true);
                setImageError(false);
              }}
              onError={() => setImageError(true)}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
              className="pointer-events-none select-none"
            />

            {imageError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-red-400 text-xs">
                <p className="font-bold">No se pudo cargar la imagen</p>
                <p className="text-[10px] text-slate-400 mt-1">Verifica que la URL sea pública y válida</p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="w-full max-w-xs mt-5 space-y-4">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScale((prev) => Math.max(0.5, prev - 0.2))}
                className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800 transition-colors"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />

              <button
                type="button"
                onClick={() => setScale((prev) => Math.min(3.5, prev + 0.2))}
                className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800 transition-colors"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Rotation & Reset Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" /> Rotar 90°
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reiniciar
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!imageLoaded || imageError || processing}
            onClick={handleCropAndSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 rounded-xl gap-2 shadow-lg shadow-indigo-600/20"
          >
            {processing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Guardar y Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
