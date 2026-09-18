"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

export default function ChangePasswordModal() {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("openChangePasswordModal", handler as EventListener);
    return () => window.removeEventListener("openChangePasswordModal", handler as EventListener);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Lỗi", "Mật khẩu xác nhận không khớp", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to change password");
      showToast("Thành công", "Đã cập nhật mật khẩu.", "success");
      setOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      showToast("Lỗi", err instanceof Error ? err.message : "Không thể đổi mật khẩu", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Đổi mật khẩu</h3>
          <button onClick={() => setOpen(false)} className="text-on-surface-variant">Đóng</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs">Mật khẩu hiện tại</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-surface-container-low" />
          </div>
          <div>
            <label className="text-xs">Mật khẩu mới</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-surface-container-low" />
          </div>
          <div>
            <label className="text-xs">Xác nhận mật khẩu mới</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-surface-container-low" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl bg-surface-container text-xs">Hủy</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs">{submitting ? 'Đang lưu...' : 'Lưu mật khẩu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
