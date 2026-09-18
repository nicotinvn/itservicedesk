"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import { ROLE_LABELS, type UserRole } from "@/lib/types";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { currentUser, setCurrentUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", specialty: "", avatar: "" });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open || !currentUser) return;
    setForm({
      fullName: currentUser.fullName,
      email: currentUser.email,
      phone: currentUser.phone || "",
      specialty: currentUser.specialty || "",
      avatar: currentUser.avatar || "",
    });
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [open, currentUser]);

  if (!open || !currentUser) return null;

  const updateUserContext = (user: any) => {
    setCurrentUser({
      ...currentUser,
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || undefined,
      specialty: user.specialty || undefined,
      avatar: user.avatar || undefined,
      departmentId: user.departmentId || undefined,
      departmentName: user.department?.name || currentUser.departmentName,
      role: user.role as UserRole,
    });
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = new FormData();
      data.append("files", file);
      const response = await fetch("/api/upload", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Không thể tải ảnh");
      setForm((previous) => ({ ...previous, avatar: result.url }));
      showToast("Đã tải ảnh", "Ảnh đại diện sẽ được lưu khi bạn bấm Cập nhật hồ sơ", "success");
    } catch (error) {
      showToast("Lỗi", error instanceof Error ? error.message : "Không thể tải ảnh đại diện", "error");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSavingProfile(true);
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể cập nhật hồ sơ");
      updateUserContext(result);
      showToast("Đã cập nhật", "Thông tin cá nhân đã được lưu", "success");
    } catch (error) {
      showToast("Lỗi", error instanceof Error ? error.message : "Không thể cập nhật hồ sơ", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      showToast("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Lỗi", "Mật khẩu xác nhận không khớp", "error");
      return;
    }

    try {
      setSavingPassword(true);
      const response = await fetch("/api/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể đổi mật khẩu");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Đã đổi mật khẩu", "Mật khẩu mới đã được cập nhật", "success");
    } catch (error) {
      showToast("Lỗi", error instanceof Error ? error.message : "Không thể đổi mật khẩu", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const avatar = form.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30">
        <div className="p-5 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">account_circle</span>
            <div>
              <h2 className="font-heading font-bold text-lg text-on-surface">Thông tin cá nhân</h2>
              <p className="text-xs text-on-surface-variant">Cập nhật hồ sơ và bảo mật tài khoản</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 grid md:grid-cols-[180px_1fr] gap-6">
          <div className="flex md:flex-col items-center gap-3">
            <img src={avatar} alt={currentUser.fullName} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary/10" />
            <label className="px-3 py-2 rounded-xl bg-surface-container text-primary text-xs font-bold cursor-pointer hover:bg-surface-container-high text-center">
              <span className="material-symbols-outlined text-[16px] align-middle mr-1">photo_camera</span>
              {uploading ? "Đang tải..." : "Đổi ảnh đại diện"}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarChange} disabled={uploading} className="hidden" />
            </label>
          </div>

          <div className="space-y-5">
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold">Tên đăng nhập</label>
                  <input value={currentUser.username} disabled className="w-full h-10 px-3 rounded-xl bg-surface-container text-on-surface-variant text-sm cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">Vai trò</label>
                  <input value={ROLE_LABELS[currentUser.role]} disabled className="w-full h-10 px-3 rounded-xl bg-surface-container text-on-surface-variant text-sm cursor-not-allowed" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">Họ và tên *</label>
                <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold">Email *</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">Số điện thoại</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">Chuyên môn / Ghi chú</label>
                <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-sm" />
              </div>
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-surface-container">
                <p className="text-xs text-on-surface-variant truncate">{currentUser.departmentName || "Chưa gán khoa phòng"}</p>
                <button type="submit" disabled={savingProfile} className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold">{savingProfile ? "Đang lưu..." : "Cập nhật hồ sơ"}</button>
              </div>
            </form>

            <form onSubmit={handleChangePassword} className="space-y-3 pt-3 border-t border-surface-container">
              <h3 className="font-heading font-bold text-sm">Đổi mật khẩu</h3>
              <div className="grid grid-cols-3 gap-3">
                <input required type="password" placeholder="Mật khẩu hiện tại" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs" />
                <input required minLength={6} type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs" />
                <input required minLength={6} type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs" />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={savingPassword} className="px-4 py-2 rounded-xl bg-surface-container text-primary text-xs font-bold">{savingPassword ? "Đang lưu..." : "Đổi mật khẩu"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}