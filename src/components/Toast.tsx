"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (title: string, message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render container */}
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-start gap-3 border transition-all animate-in slide-in-from-bottom-5 duration-200 ${
              toast.type === "error"
                ? "bg-error-container text-on-error-container border-error/20"
                : "bg-inverse-surface text-inverse-on-surface border-slate-700"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[24px] flex-shrink-0 ${
                toast.type === "error" ? "text-error" : "text-emerald-400"
              }`}
            >
              {toast.type === "error" ? "error" : "check_circle"}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm leading-tight">{toast.title}</h4>
              <p className="text-xs opacity-90 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-xs opacity-60 hover:opacity-100 p-1"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
