"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
};

/**
 * Mobile: bottom sheet que sube desde abajo, se puede cerrar con swipe.
 * Desktop: modal centrado con animación de scale.
 */
export function Sheet({ open, onClose, title, description, children }: Props) {
  const [visible, setVisible] = useState(false);
  const [animated, setAnimated] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (open) {
      setVisible(true);
      // Forzar un frame para que la transición de entrada sea visible
      const raf = requestAnimationFrame(() => setAnimated(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setAnimated(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragY(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragY > 80) onClose();
    setDragY(0);
    touchStartY.current = null;
  }, [dragY, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${animated ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          relative bg-white w-full
          md:w-auto md:min-w-[360px] md:max-w-lg
          rounded-t-2xl md:rounded-2xl
          max-h-[92vh] overflow-y-auto shadow-xl
          transition-all duration-300 ease-out
          ${animated
            ? "translate-y-0 md:scale-100 md:opacity-100"
            : "translate-y-full md:translate-y-0 md:scale-95 md:opacity-0"
          }
        `}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle (solo mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden>
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className={`flex items-start justify-between px-6 pt-4 ${title ? "pb-4 border-b border-gray-100" : "pb-1"}`}>
          <div className="min-w-0 flex-1">
            {title && <h2 className="font-semibold text-gray-900">{title}</h2>}
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pt-5 pb-10">
          {children}
        </div>
      </div>
    </div>
  );
}
