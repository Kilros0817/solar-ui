'use client'

import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Eraser } from 'lucide-react';

const STROKE_COLOR = '#0f172a';
const BG_COLOR = '#f8fafc';

export function SignaturePad({
  onSignatureChange,
  width = 320,
  height = 120,
  className = '',
}: {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const hasDrawnRef = useRef(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    onSignatureChange(null);
  }, [getCtx, onSignatureChange]);

  const getDataUrl = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnRef.current) return null;
    return canvas.toDataURL('image/png');
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height, getCtx]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const getPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      if ('touches' in e) {
        const touch = e.touches[0] || (e as unknown as { changedTouches: Touch[] }).changedTouches[0];
        if (!touch) return { x: 0, y: 0 };
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [width, height]
  );

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const ctx = getCtx();
      if (!ctx) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      setIsDrawing(true);
      hasDrawnRef.current = true;
    },
    [getCtx, getPos]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing) return;
      const ctx = getCtx();
      if (!ctx) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [isDrawing, getCtx, getPos]
  );

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const url = getDataUrl();
    if (url) onSignatureChange(url);
  }, [isDrawing, getDataUrl, onSignatureChange]);

  return (
    <div className={className}>
      <div
        className="rounded-md border border-input bg-muted/30 overflow-hidden"
        style={{ width, height }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={(e) => {
            initCanvas();
            startDraw(e);
          }}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          onTouchCancel={endDraw}
          className="block touch-none cursor-crosshair"
          style={{ width, height }}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 gap-1.5 text-muted-foreground"
        onClick={clear}
      >
        <Eraser className="h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  );
}
