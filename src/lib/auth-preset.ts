import type { UserRole } from "./types";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  specialty?: string;
  avatar?: string;
}

export const AUTH_STORAGE_KEY = "itservicedesk_user";
export const AUTH_COOKIE_KEY = "itservicedesk_user";
export const AUTH_ROLE_COOKIE_KEY = "itservicedesk_role";
export const AUTH_SESSION_COOKIE_KEY = "itservicedesk_session";

export const PRESET_USERS: AuthUser[] = [
  {
    id: "manager-nam",
    username: "nam.nguyen",
    fullName: "ThS. Nguyễn Hoàng Nam",
    email: "nam.nguyen@benhvien.vn",
    phone: "0913.999.888",
    role: "MANAGER",
    departmentId: "cmu3dxztp0005ui30n571ew0r",
    departmentName: "Phòng Công nghệ Thông tin",
    specialty: "Trưởng phòng Quản lý Vận hành CNTT",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
  },
  {
    id: "ktv-minh",
    username: "minh.le",
    fullName: "Lê Văn Minh",
    email: "minh.le@benhvien.vn",
    phone: "0988.112.233",
    role: "TECHNICIAN",
    departmentId: "cmu3dxztp0005ui30n571ew0r",
    departmentName: "Đội Cơ động & Mạng Bệnh viện",
    specialty: "KTV Chính (Chuyên sâu Mạng LAN & HIS)",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCgCbXYraZH5ObcvFnRMBOXDzMMCFMzYe0GjqMppLaSqOCvmLxiI5rxr8vikdB6oi1p4rbPlJ1VeRwSJhTOIIetVIORN3AiL8Jb966MNZj1FTuWLjm1FiX67oATKdSMD5HRa-9QB7sTDpzkhYpbABBpnbZofMczf9KvFC1c77gK16V4a6SeQ6GNm0qdAYU4A5lqlu_8W2iYOp39sU6RvL3jR-OLMw2dKD8iH3kfL8mUo0TtvTj0HlFG",
  },
  {
    id: "user-ha",
    username: "ha.tran",
    fullName: "BS. Trần Thu Hà",
    email: "ha.tran@benhvien.vn",
    phone: "0912.345.678",
    role: "DEPARTMENT_USER",
    departmentId: "cmu3dxzt70000ui30md2rqccd",
    departmentName: "Khoa Cấp cứu & Chống độc",
    specialty: "Bác sĩ Cấp cứu",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
  },
  {
    id: "admin-system",
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    email: "admin@benhvien.vn",
    phone: "0900.000.001",
    role: "ADMIN",
    departmentId: "cmu3dxztp0005ui30n571ew0r",
    departmentName: "Ban Quản trị CNTT Bệnh viện",
    specialty: "Toàn quyền cấu hình & Báo cáo",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
  },
  {
    id: "manager-test",
    username: "manager.test",
    fullName: "Quản lý Test",
    email: "manager.test@benhvien.vn",
    phone: "0900.300.001",
    role: "MANAGER",
    departmentName: "Phòng Công nghệ Thông tin",
    specialty: "Kiểm thử luồng duyệt & giao việc",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
  },
  {
    id: "ktv-test",
    username: "ktv.test",
    fullName: "Kỹ thuật viên Test",
    email: "ktv.test@benhvien.vn",
    phone: "0900.300.002",
    role: "TECHNICIAN",
    departmentName: "Đội Cơ động & Mạng Bệnh viện",
    specialty: "Kiểm thử xử lý sự cố và báo cáo",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCgCbXYraZH5ObcvFnRMBOXDzMMCFMzYe0GjqMppLaSqOCvmLxiI5rxr8vikdB6oi1p4rbPlJ1VeRwSJhTOIIetVIORN3AiL8Jb966MNZj1FTuWLjm1FiX67oATKdSMD5HRa-9QB7sTDpzkhYpbABBpnbZofMczf9KvFC1c77gK16V4a6SeQ6GNm0qdAYU4A5lqlu_8W2iYOp39sU6RvL3jR-OLMw2dKD8iH3kfL8mUo0TtvTj0HlFG",
  },
  {
    id: "khoa-test",
    username: "khoa.test",
    fullName: "Bác sĩ Khoa Test",
    email: "khoa.test@benhvien.vn",
    phone: "0900.300.003",
    role: "DEPARTMENT_USER",
    departmentName: "Khoa Cấp cứu & Chống độc",
    specialty: "Tạo yêu cầu và xác nhận dịch vụ",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
  },
  {
    id: "admin-test",
    username: "admin.test",
    fullName: "Quản trị Test",
    email: "admin.test@benhvien.vn",
    phone: "0900.300.004",
    role: "ADMIN",
    departmentName: "Ban Quản trị CNTT Bệnh viện",
    specialty: "Kiểm thử phân quyền hệ thống",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
  },
];

export function findAuthUserByUsername(username?: string | null): AuthUser | null {
  if (!username) return null;
  return PRESET_USERS.find((user) => user.username === username) ?? null;
}
