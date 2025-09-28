"use client";
import React, { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold">{title || ""}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

