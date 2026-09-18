export type UserRole = "ADMIN" | "MANAGER" | "TECHNICIAN" | "DEPARTMENT_USER";

export type TicketPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type TicketStatus =
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "APPROVED"
  | "IN_PROGRESS"
  | "PENDING_CONFIRMATION"
  | "COMPLETED"
  | "CLOSED";

export type TicketCategory =
  | "COMPUTER"
  | "PRINTER"
  | "SOFTWARE"
  | "NETWORK"
  | "CAMERA"
  | "EMAIL"
  | "SERVER"
  | "SUPPORT"
  | "OTHER";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Quản trị hệ thống",
  MANAGER: "Trưởng phòng CNTT",
  TECHNICIAN: "Kỹ thuật viên CNTT",
  DEPARTMENT_USER: "Người dùng Khoa/Phòng",
};

export const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; bg: string; text: string; dot: string; defaultSlaMinutes: number }
> = {
  CRITICAL: {
    label: "Khẩn cấp",
    bg: "bg-error-container",
    text: "text-on-error-container",
    dot: "bg-error",
    defaultSlaMinutes: 45,
  },
  HIGH: {
    label: "Ưu tiên cao",
    bg: "bg-amber-100",
    text: "text-amber-900",
    dot: "bg-amber-500",
    defaultSlaMinutes: 120,
  },
  MEDIUM: {
    label: "Bình thường",
    bg: "bg-blue-100",
    text: "text-blue-900",
    dot: "bg-blue-500",
    defaultSlaMinutes: 240,
  },
  LOW: {
    label: "Thấp",
    bg: "bg-slate-100",
    text: "text-slate-800",
    dot: "bg-slate-400",
    defaultSlaMinutes: 480,
  },
};

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; step: number; bg: string; text: string; icon: string }
> = {
  PENDING_APPROVAL: {
    label: "Chờ tiếp nhận",
    step: 2,
    bg: "bg-surface-container",
    text: "text-on-surface-variant",
    icon: "pending_actions",
  },
  REJECTED: {
    label: "Từ chối",
    step: 2,
    bg: "bg-error-container",
    text: "text-on-error-container",
    icon: "cancel",
  },
  APPROVED: {
    label: "Đã tiếp nhận",
    step: 2,
    bg: "bg-secondary-fixed",
    text: "text-on-secondary-fixed",
    icon: "verified",
  },
  IN_PROGRESS: {
    label: "Đang xử lý",
    step: 4,
    bg: "bg-amber-50 text-amber-800",
    text: "text-amber-800",
    icon: "engineering",
  },
  PENDING_CONFIRMATION: {
    label: "Chờ trưởng phòng xác nhận",
    step: 5,
    bg: "bg-purple-100",
    text: "text-purple-900",
    icon: "fact_check",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    step: 6,
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    icon: "check_circle",
  },
  CLOSED: {
    label: "Đã đóng",
    step: 6,
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: "task_alt",
  },
};

export const CATEGORY_CONFIG: Record<
  TicketCategory,
  { label: string; icon: string; desc: string }
> = {
  COMPUTER: { label: "Máy tính & Laptop", icon: "computer", desc: "Không lên nguồn, BSOD, treo đơ" },
  PRINTER: { label: "Máy in & Scan", icon: "print", desc: "Kẹt giấy, mờ mực, in mã vạch" },
  SOFTWARE: { label: "Phần mềm HIS / PACS", icon: "terminal", desc: "Lỗi kết nối bệnh án, báo cáo" },
  NETWORK: { label: "Mạng Internet & LAN", icon: "wifi", desc: "Mất mạng, IP tĩnh, chập chờn" },
  CAMERA: { label: "Camera an ninh", icon: "videocam", desc: "Mất hình, camera sảnh, hành lang" },
  EMAIL: { label: "Email công vụ & Tài khoản", icon: "mail", desc: "Quên mật khẩu, khóa tài khoản" },
  SERVER: { label: "Máy chủ & Sao lưu", icon: "dns", desc: "Database, server dịch vụ" },
  SUPPORT: { label: "Hỗ trợ người dùng", icon: "support_agent", desc: "Hướng dẫn thao tác, chữ ký số" },
  OTHER: { label: "Yêu cầu khác", icon: "more_horiz", desc: "Các vấn đề hạ tầng CNTT khác" },
};

export function getKpiRank(
  score: number,
  thresholds = { excellent: 90, good: 80, fair: 70, average: 60 }
): { rank: string; color: string; bg: string } {
  if (score >= thresholds.excellent) {
    return { rank: "Xuất sắc", color: "text-emerald-700", bg: "bg-emerald-100" };
  }
  if (score >= thresholds.good) {
    return { rank: "Tốt", color: "text-blue-700", bg: "bg-blue-100" };
  }
  if (score >= thresholds.fair) {
    return { rank: "Khá", color: "text-amber-700", bg: "bg-amber-100" };
  }
  if (score >= thresholds.average) {
    return { rank: "Trung bình", color: "text-orange-700", bg: "bg-orange-100" };
  }
  return { rank: "Chưa hoàn thành", color: "text-red-700", bg: "bg-red-100" };
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "--";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTimeAgo(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}
