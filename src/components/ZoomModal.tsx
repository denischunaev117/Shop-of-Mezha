import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';

type ZoomModalProps = {
  imageSrc: string;
  imageAlt: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

export default function ZoomModal({ imageSrc, imageAlt, title, subtitle, onClose }: ZoomModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const getMaxOffset = useCallback(() => {
    const vp = viewportRef.current;
    const img = imageRef.current;
    if (!vp || !img) return { x: 0, y: 0 };
    const vpW = vp.clientWidth;
    const vpH = vp.clientHeight;
    const imgW = img.naturalWidth * (img.clientWidth / img.naturalWidth) * zoom;
    const imgH = img.naturalHeight * (img.clientHeight / img.naturalHeight) * zoom;
    const maxX = Math.max(0, (imgW - vpW) / 2);
    const maxY = Math.max(0, (imgH - vpH) / 2);
    return { x: maxX, y: maxY };
  }, [zoom]);

  const clampOffset = useCallback((x: number, y: number) => {
    const max = getMaxOffset();
    return {
      x: Math.max(-max.x, Math.min(max.x, x)),
      y: Math.max(-max.y, Math.min(max.y, y)),
    };
  }, [getMaxOffset]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((z) => {
      const next = clampZoom(z + delta * z);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => clampZoom(z + 0.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const next = clampZoom(z - 0.5);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
  }, [zoom, offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawX = dragStart.current.offsetX + (e.clientX - dragStart.current.x);
    const rawY = dragStart.current.offsetY + (e.clientY - dragStart.current.y);
    setOffset(clampOffset(rawX, rawY));
  }, [isDragging, clampOffset]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = { distance: Math.hypot(dx, dy), zoom };
      setIsDragging(false);
    } else if (e.touches.length === 1 && zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, offsetX: offset.x, offsetY: offset.y };
    }
  }, [zoom, offset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.hypot(dx, dy);
      const scale = newDistance / pinchStart.current.distance;
      const next = clampZoom(pinchStart.current.zoom * scale);
      setZoom(next);
      if (next === 1) setOffset({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      const rawX = dragStart.current.offsetX + (e.touches[0].clientX - dragStart.current.x);
      const rawY = dragStart.current.offsetY + (e.touches[0].clientY - dragStart.current.y);
      setOffset(clampOffset(rawX, rawY));
    }
  }, [isDragging, clampOffset]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    pinchStart.current = null;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleZoomIn, handleZoomOut]);

  useEffect(() => {
    if (zoom === 1) setOffset({ x: 0, y: 0 });
  }, [zoom]);

  return (
    <div
      className="zoom-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={imageAlt}
      onClick={onClose}
    >
      <button className="zoom-modal-close" onClick={onClose} aria-label="Закрыть просмотр">
        <X size={24} />
      </button>

      <div
        className="zoom-modal-viewport"
        ref={viewportRef}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt={imageAlt}
          className="zoom-modal-image"
          style={{
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          draggable={false}
        />
      </div>

      <div className="zoom-modal-controls" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleZoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Уменьшить">
          <Minus size={18} />
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Увеличить">
          <Plus size={18} />
        </button>
        {zoom !== 1 && (
          <button onClick={resetZoom} className="zoom-reset" aria-label="Сбросить масштаб">
            Сбросить
          </button>
        )}
      </div>

      {(title || subtitle) && (
        <div className="zoom-modal-caption" onClick={(e) => e.stopPropagation()}>
          {subtitle && <span>{subtitle}</span>}
          {title && <strong>{title}</strong>}
        </div>
      )}

      <div
        className="zoom-modal-touch-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
