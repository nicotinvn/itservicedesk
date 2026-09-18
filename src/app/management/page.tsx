"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import RoleGuard from "@/components/RoleGuard";
import { ROLE_LABELS, UserRole } from "@/lib/types";

export default function ManagementPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"dept" | "user">("dept");
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [deptCategoryFilter, setDeptCategoryFilter] = useState("ALL");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<"user" | "dept">("user");

  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Add User Form
  const [newUserData, setNewUserData] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    role: "DEPARTMENT_USER" as UserRole,
    departmentId: "",
    specialty: "",
    password: "",
  });

  // Add Dept Form
  const [newDeptData, setNewDeptData] = useState({
    code: "",
    name: "",
    category: "CLINICAL",
    building: "Tòa A",
    floor: "Tầng 1",
    room: "",
    leaderName: "",
    phone: "",
    staffCount: 15,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, userRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/users"),
      ]);
      const depts = await deptRes.json();
      const usrs = await userRes.json();
      if (!deptRes.ok || !userRes.ok) {
        throw new Error(depts?.error || usrs?.error || "Không thể tải dữ liệu quản lý");
      }
      setDepartments(Array.isArray(depts) ? depts : []);
      setUsers(Array.isArray(usrs) ? usrs : []);
      if (Array.isArray(depts) && depts.length > 0 && !newUserData.departmentId) {
        setNewUserData((prev) => ({ ...prev, departmentId: depts[0].id }));
      }
    } catch (e: any) {
      console.error(e);
      showToast("Không thể tải dữ liệu", e.message || "Phiên đăng nhập không hợp lệ", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add User action
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.fullName || !newUserData.email) {
      showToast("Thiếu thông tin", "Vui lòng nhập đầy đủ tên, username và email", "error");
      return;
    }
    if (newUserData.password.length < 6) {
      showToast("Mật khẩu chưa hợp lệ", "Mật khẩu phải có ít nhất 6 ký tự", "error");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Create user failed");
      showToast("Thành công", `Đã thêm cán bộ ${newUserData.fullName}`);
      setShowAddModal(false);
      setNewUserData({
        username: "",
        fullName: "",
        email: "",
        phone: "",
        role: "DEPARTMENT_USER",
        departmentId: departments[0]?.id || "",
        specialty: "",
        password: "",
      });
      fetchData();
    } catch (e: any) {
      showToast("Lỗi", e.message || "Không thể thêm người dùng mới", "error");
    }
  };

  // Add Dept action
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptData.code || !newDeptData.name) {
      showToast("Thiếu thông tin", "Vui lòng nhập mã và tên khoa phòng", "error");
      return;
    }

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeptData),
      });
      if (!res.ok) throw new Error("Create dept failed");
      showToast("Thành công", `Đã thêm khoa phòng ${newDeptData.name}`);
      setShowAddModal(false);
      setNewDeptData({
        code: "",
        name: "",
        category: "CLINICAL",
        building: "Tòa A",
        floor: "Tầng 1",
        room: "",
        leaderName: "",
        phone: "",
        staffCount: 15,
      });
      fetchData();
    } catch (e) {
      showToast("Lỗi", "Không thể thêm khoa phòng mới", "error");
    }
  };

  // Update Dept action
  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingDept),
      });
      if (!res.ok) throw new Error("Update failed");
      showToast("Đã lưu", `Đã cập nhật thông tin khoa ${editingDept.name}`);
      setShowEditDeptModal(false);
      fetchData();
    } catch (e) {
      showToast("Lỗi", "Không thể cập nhật khoa phòng", "error");
    }
  };

  // Update User action
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser.password && editingUser.password.length < 6) {
      showToast("Mật khẩu chưa hợp lệ", "Mật khẩu mới phải có ít nhất 6 ký tự", "error");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      });
      if (!res.ok) throw new Error("Update failed");
      showToast("Đã lưu", `Đã cập nhật tài khoản ${editingUser.fullName}`);
      setShowEditUserModal(false);
      fetchData();
    } catch (e) {
      showToast("Lỗi", "Không thể cập nhật người dùng", "error");
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Xóa tài khoản ${user.fullName}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(user.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      showToast("Đã xóa", `Đã xóa tài khoản ${user.fullName}`);
      fetchData();
    } catch (e: any) {
      showToast("Không thể xóa", e.message || "Tài khoản có dữ liệu liên quan", "error");
    }
  };

  // Filtered lists
  const filteredDepts = departments.filter((d) => {
    const matchSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      deptCategoryFilter === "ALL" || d.category === deptCategoryFilter;
    return matchSearch && matchCat;
  });

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      userRoleFilter === "ALL" || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const clinicalCount = departments.filter((d) => d.category === "CLINICAL").length;
  const paraclinicalCount = departments.filter((d) => d.category === "PARACLINICAL").length;
  const adminCount = departments.filter((d) => d.category === "ADMINISTRATIVE").length;

  return (
    <RoleGuard allowedRoles={["ADMIN"]} requiredPermissions={["MANAGE_USERS"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* 1. Top Segmented Controls & Action Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="bg-surface-container-low p-1 rounded-xl flex items-center shadow-inner flex-1 max-w-md">
            <button
              onClick={() => setActiveTab("dept")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "dept"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">apartment</span>
              <span>Khoa / Phòng</span>
              <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {departments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("user")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "user"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Người dùng & Quyền</span>
              <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {users.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              setAddModalType(activeTab === "dept" ? "dept" : "user");
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Thêm mới {activeTab === "dept" ? "Khoa/Phòng" : "Người dùng"}</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "dept"
                  ? "Tìm kiếm theo mã khoa, tên khoa, tòa nhà..."
                  : "Tìm kiếm cán bộ y tế, email, username, vai trò..."
              }
              className="w-full h-10 pl-10 pr-4 bg-surface-container-low text-on-surface placeholder:text-outline text-xs sm:text-sm rounded-xl focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: KHOA / PHÒNG */}
      {activeTab === "dept" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Quick Statistics Bento */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <span className="text-xs text-outline font-semibold">Tổng danh mục</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
                  {departments.length}
                </span>
                <span className="text-[11px] text-tertiary font-bold">Khoa/Phòng</span>
              </div>
              <div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <span className="text-xs text-outline font-semibold">Khối Lâm sàng</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-heading font-bold text-xl sm:text-2xl text-primary">
                  {clinicalCount}
                </span>
                <span className="text-[11px] text-outline font-semibold">Đơn vị</span>
              </div>
              <div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-secondary-container h-full rounded-full"
                  style={{ width: `${(clinicalCount / (departments.length || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <span className="text-xs text-outline font-semibold">Cận LS & Chức năng</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-heading font-bold text-xl sm:text-2xl text-tertiary">
                  {paraclinicalCount + adminCount}
                </span>
                <span className="text-[11px] text-outline font-semibold">Đơn vị</span>
              </div>
              <div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-tertiary h-full rounded-full"
                  style={{
                    width: `${((paraclinicalCount + adminCount) / (departments.length || 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "ALL", label: `Tất cả (${departments.length})` },
              { id: "CLINICAL", label: `Khối Lâm sàng (${clinicalCount})` },
              { id: "PARACLINICAL", label: `Cận lâm sàng (${paraclinicalCount})` },
              { id: "ADMINISTRATIVE", label: `Hành chính / Phòng ban (${adminCount})` },
            ].map((chip) => {
              const isSelected = deptCategoryFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setDeptCategoryFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container shadow-sm"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Department Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDepts.map((dept) => (
              <div
                key={dept.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-surface-container text-secondary font-bold text-xs">
                      {dept.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        dept.category === "CLINICAL"
                          ? "bg-blue-100 text-blue-800"
                          : dept.category === "PARACLINICAL"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {dept.category === "CLINICAL"
                        ? "Lâm sàng"
                        : dept.category === "PARACLINICAL"
                        ? "Cận lâm sàng"
                        : "Hành chính"}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-on-surface mt-2">
                    {dept.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1.5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">
                        location_on
                      </span>
                      {dept.building} - {dept.floor} {dept.room ? `(${dept.room})` : ""}
                    </span>
                    <span>•</span>
                    <span>{dept.staffCount} cán bộ</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-surface-container text-xs">
                  <span className="text-on-surface-variant font-medium">
                    Phụ trách: <strong>{dept.leaderName || "Chưa cập nhật"}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setEditingDept(dept);
                      setShowEditDeptModal(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Chỉnh sửa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: NGƯỜI DÙNG & PHÂN QUYỀN */}
      {activeTab === "user" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Role Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "ALL", label: `Tất cả (${users.length})` },
              { id: "ADMIN", label: "Quản trị viên" },
              { id: "MANAGER", label: "Trưởng phòng CNTT" },
              { id: "TECHNICIAN", label: "Kỹ thuật viên" },
              { id: "DEPARTMENT_USER", label: "Người dùng Khoa phòng" },
            ].map((chip) => {
              const isSelected = userRoleFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setUserRoleFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container shadow-sm"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={
                      user.avatar ||
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY"
                    }
                    alt={user.fullName}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary/10 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-bold text-sm text-on-surface truncate">
                        {user.fullName}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">
                        {ROLE_LABELS[user.role as UserRole] || user.role}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      @{user.username} • {user.email}
                    </p>
                    <p className="text-xs text-primary font-medium mt-1 truncate">
                      {user.department?.name || "Chưa gán khoa phòng"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-surface-container text-xs">
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    {user.phone || "0912.345.678"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingUser({ ...user, password: "" });
                        setShowEditUserModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="w-8 h-8 rounded-lg bg-error-container text-error hover:bg-error hover:text-on-error transition-colors flex items-center justify-center"
                      aria-label={`Xóa ${user.fullName}`}
                      title="Xóa người dùng"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL THÊM MỚI (Matching Giaodien/Modal them moi) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-on-surface">
                    Thêm mới vào hệ thống
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Phân quyền tài khoản y tế & thực thể khoa viện
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Toggle Tabs */}
            <div className="px-4 pt-3 pb-1">
              <div className="p-1 rounded-xl bg-surface-container flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAddModalType("user")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    addModalType === "user"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant"
                  }`}
                >
                  Thêm Người dùng mới
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalType("dept")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    addModalType === "dept"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant"
                  }`}
                >
                  Thêm Khoa / Phòng
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <div className="p-4 overflow-y-auto flex-1">
              {addModalType === "user" ? (
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">
                      Họ và tên cán bộ / Y bác sĩ *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: ThS. BS. Lê Hoàng Long"
                      value={newUserData.fullName}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, fullName: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface">
                        Tên đăng nhập (Username) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="long.le"
                        value={newUserData.username}
                        onChange={(e) =>
                          setNewUserData({ ...newUserData, username: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface">Email công vụ *</label>
                      <input
                        type="email"
                        required
                        placeholder="long.le@benhvien.vn"
                        value={newUserData.email}
                        onChange={(e) =>
                          setNewUserData({ ...newUserData, email: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface">Vai trò hệ thống *</label>
                      <select
                        value={newUserData.role}
                        onChange={(e) =>
                          setNewUserData({ ...newUserData, role: e.target.value as UserRole })
                        }
                        className="w-full h-10 px-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-bold"
                      >
                        <option value="DEPARTMENT_USER">Người dùng Khoa phòng</option>
                        <option value="TECHNICIAN">Kỹ thuật viên CNTT</option>
                        <option value="MANAGER">Trưởng phòng CNTT</option>
                        <option value="ADMIN">Quản trị hệ thống (Admin)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface">Khoa phòng trực thuộc</label>
                      <select
                        value={newUserData.departmentId}
                        onChange={(e) =>
                          setNewUserData({ ...newUserData, departmentId: e.target.value })
                        }
                        className="w-full h-10 px-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Số điện thoại</label>
                    <input
                      type="text"
                      placeholder="0912.345.678"
                      value={newUserData.phone}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, phone: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Mật khẩu * (ít nhất 6 ký tự)</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Mật khẩu đăng nhập"
                      value={newUserData.password}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, password: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-surface-container">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl bg-surface-container text-xs font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md"
                    >
                      Lưu người dùng
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateDept} className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface">Mã khoa *</label>
                      <input
                        type="text"
                        required
                        placeholder="KP-CC01"
                        value={newDeptData.code}
                        onChange={(e) =>
                          setNewDeptData({ ...newDeptData, code: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-on-surface">Tên Khoa / Phòng *</label>
                      <input
                        type="text"
                        required
                        placeholder="Khoa Cấp cứu & Chống độc"
                        value={newDeptData.name}
                        onChange={(e) =>
                          setNewDeptData({ ...newDeptData, name: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface">Phân loại đơn vị</label>
                      <select
                        value={newDeptData.category}
                        onChange={(e) =>
                          setNewDeptData({ ...newDeptData, category: e.target.value })
                        }
                        className="w-full h-10 px-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs"
                      >
                        <option value="CLINICAL">Khối Lâm sàng</option>
                        <option value="PARACLINICAL">Khối Cận lâm sàng</option>
                        <option value="ADMINISTRATIVE">Phòng ban chức năng</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface">Tòa nhà</label>
                      <input
                        type="text"
                        placeholder="Tòa A1"
                        value={newDeptData.building}
                        onChange={(e) =>
                          setNewDeptData({ ...newDeptData, building: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface">Người phụ trách</label>
                      <input
                        type="text"
                        placeholder="TS. BS. Nguyễn Văn Cường"
                        value={newDeptData.leaderName}
                        onChange={(e) =>
                          setNewDeptData({ ...newDeptData, leaderName: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface">Số lượng cán bộ</label>
                      <input
                        type="number"
                        value={newDeptData.staffCount}
                        onChange={(e) =>
                          setNewDeptData({
                            ...newDeptData,
                            staffCount: Number(e.target.value),
                          })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-surface-container">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl bg-surface-container text-xs font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md"
                    >
                      Lưu Khoa / Phòng
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA KHOA PHÒNG (Matching Giaodien/Modal chinh sua khoa- phong) */}
      {showEditDeptModal && editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden">
            <div className="p-4 border-b border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">edit_note</span>
                <h3 className="font-heading font-bold text-base text-on-surface">
                  Chỉnh sửa Khoa / Phòng: {editingDept.code}
                </h3>
              </div>
              <button
                onClick={() => setShowEditDeptModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateDept} className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Tên Khoa / Phòng</label>
                <input
                  type="text"
                  required
                  value={editingDept.name}
                  onChange={(e) =>
                    setEditingDept({ ...editingDept, name: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Tòa nhà</label>
                  <input
                    type="text"
                    value={editingDept.building || ""}
                    onChange={(e) =>
                      setEditingDept({ ...editingDept, building: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Tầng / Vị trí</label>
                  <input
                    type="text"
                    value={editingDept.floor || ""}
                    onChange={(e) =>
                      setEditingDept({ ...editingDept, floor: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Người phụ trách</label>
                  <input
                    type="text"
                    value={editingDept.leaderName || ""}
                    onChange={(e) =>
                      setEditingDept({ ...editingDept, leaderName: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Số lượng cán bộ</label>
                  <input
                    type="number"
                    value={editingDept.staffCount || 0}
                    onChange={(e) =>
                      setEditingDept({
                        ...editingDept,
                        staffCount: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowEditDeptModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA QUYỀN USER */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden">
            <div className="p-4 border-b border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">manage_accounts</span>
                <h3 className="font-heading font-bold text-base text-on-surface">
                  Phân quyền: {editingUser.fullName}
                </h3>
              </div>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.fullName}
                    onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Email *</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Số điện thoại</label>
                  <input
                    type="text"
                    value={editingUser.phone || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Mật khẩu mới</label>
                  <input
                    type="password"
                    minLength={6}
                    placeholder="Để trống nếu không đổi"
                    value={editingUser.password || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Vai trò phân quyền *</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm font-bold"
                >
                  <option value="DEPARTMENT_USER">Người dùng Khoa phòng (Gửi phiếu, CSAT)</option>
                  <option value="TECHNICIAN">Kỹ thuật viên CNTT (Nhận việc, Báo cáo)</option>
                  <option value="MANAGER">Trưởng phòng CNTT (Tiếp nhận, Giao việc, Chấm KPI)</option>
                  <option value="ADMIN">Quản trị hệ thống (Toàn quyền)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Khoa phòng công tác</label>
                <select
                  value={editingUser.departmentId || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, departmentId: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Chuyên môn / Ghi chú</label>
                <input
                  type="text"
                  value={editingUser.specialty || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, specialty: e.target.value })
                  }
                  placeholder="Chuyên sâu Mạng, HIS, PACS..."
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
