# ITServiceDesk - Phần Mềm Quản Lý Yêu Cầu & Giao Việc CNTT Bệnh Viện

Phần mềm được phát triển dựa trên tài liệu đặc tả nghiệp vụ [Quan_ly_yeu_cau_va_giao_viec.md](file:///D:/yeucaugiaoviec/Quan_ly_yeu_cau_va_giao_viec.md) và hiện thực hóa 100% ngôn ngữ thiết kế từ 9 bộ giao diện trong thư mục [Giaodien](file:///D:/yeucaugiaoviec/Giaodien).

---

## 🌟 Tính Năng Nổi Bật

1. **Quy trình SLA 7 bước chuẩn BV-ITIL**:
   - **Bước 1**: Khoa phòng gửi yêu cầu (tự động sinh mã `#YC2025...`, phân loại thiết bị).
   - **Bước 2**: Trưởng phòng CNTT duyệt hoặc từ chối yêu cầu.
   - **Bước 3**: Điều phối & Giao việc (gợi ý KTV tối ưu theo tải việc & SLA %, hẹn giờ cam kết Code Red 45 phút).
   - **Bước 4**: Kỹ thuật viên thực hiện tại hiện trường.
   - **Bước 5**: Kỹ thuật viên nộp báo cáo kết quả và minh chứng hoàn thành.
   - **Bước 6**: Trưởng phòng đánh giá nghiệm thu 3 tiêu chí chuyên môn (Chất lượng 40%, Tiến độ 30%, Phối hợp 30%).
   - **Bước 7**: Khoa phòng chấm điểm hài lòng CSAT (10 - Rất hài lòng, 8 - Hài lòng, 6 - Bình thường, 4 - Chưa hài lòng).

2. **Chấm điểm & Xếp loại KPI tự động**:
   - Công thức: `Điểm KPI = (40% × Chất lượng) + (30% × Tiến độ) + (20% × CSAT) + (10% × Tải việc)`.
   - Bảng xếp loại hàng tháng: Xuất sắc (≥90), Tốt (80-89), Khá (70-79), Trung bình (60-69), Chưa hoàn thành (<60).
   - Trang **Cấu hình KPI** tương tác: Cho phép tùy biến thanh trượt trọng số và thang điểm realtime.

3. **Chuyển đổi vai trò nhanh (Role Switcher)**:
   - Tích hợp ngay trên thanh Header, cho phép chuyển đổi ngay giữa 4 vai trò:
     - 👨‍💼 **Trưởng phòng CNTT** (ThS. Nguyễn Hoàng Nam)
     - 🛠️ **Kỹ thuật viên CNTT** (Lê Văn Minh)
     - 👩‍⚕️ **Bác sĩ Khoa phòng** (BS. Trần Thu Hà - Khoa Cấp cứu)
     - 🛡️ **Quản trị hệ thống** (Admin)

4. **Quản lý Danh mục & Phân quyền**:
   - Quản lý 24 Khoa/Phòng (Lâm sàng, Cận lâm sàng, Hành chính, vị trí tòa nhà, tầng).
   - Quản lý nhân sự y tế & kỹ thuật viên, phân quyền 4 vai trò, kích hoạt/khóa tài khoản.
   - Hỗ trợ modal thêm mới và modal chỉnh sửa đầy đủ theo thiết kế.

5. **Báo cáo Thống kê & Xuất Excel**:
   - Thống kê tỷ lệ tuân thủ SLA, thời gian xử lý trung bình, tỷ lệ sự cố theo khoa và thiết bị.
   - Bảng xếp hạng KPI nhân sự.
   - Tích hợp tính năng **Xuất dữ liệu Excel (.xlsx)** với 3 sheet chi tiết: Danh sách phiếu, Bảng điểm KPI KTV, Thống kê Khoa/Phòng.

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Cài đặt và nạp dữ liệu mẫu
```bash
npm install
npx prisma db push
npm run db:seed
```

### 2. Chạy ứng dụng ở chế độ phát triển
```bash
npm run dev
```
Mở trình duyệt tại địa chỉ: `http://localhost:3000`

### 3. Build sản phẩm sẵn sàng triển khai Vercel
```bash
npm run build
npm run start
```

### 4. Triển khai production trên Vercel

Production sử dụng PostgreSQL, không sử dụng SQLite local. Sao chép `.env.example` thành `.env` và điền `DATABASE_URL`, sau đó chuẩn bị schema trên database production:

```bash
npx prisma generate
npx prisma db push
```

Tạo tài khoản quản trị production bằng các biến `PRODUCTION_ADMIN_USERNAME`, `PRODUCTION_ADMIN_EMAIL` và `PRODUCTION_ADMIN_PASSWORD` (tối thiểu 12 ký tự), rồi chạy:

```bash
npm run db:seed:production
```

Không chạy `npm run db:seed` trên production. Seed demo có tính phá hủy dữ liệu và chỉ chạy khi đặt rõ `ALLOW_DEMO_SEED=true` ở môi trường local.

Trên Vercel, thêm các biến môi trường trong Project Settings trước khi deploy. Ảnh upload production cần cấu hình Cloudinary; filesystem của Vercel không dùng để lưu ảnh lâu dài.

---

## 📁 Cấu Trúc Mã Nguồn

```text
D:\yeucaugiaoviec
├── prisma/
│   ├── schema.prisma       # Database schema (Tickets, Users, Departments, KPI)
│   ├── seed.ts             # Dữ liệu khởi tạo chuẩn Bệnh viện
│   └── dev.db              # SQLite Database cục bộ
├── src/
│   ├── app/
│   │   ├── page.tsx            # Trang Tổng quan (Dashboard)
│   │   ├── tickets/
│   │   │   ├── page.tsx        # Danh sách Phiếu yêu cầu & Bộ lọc
│   │   │   └── [id]/page.tsx   # Chi tiết phiếu & Quy trình 7 bước SLA
│   │   ├── technicians/page.tsx# Danh sách KTV & KPI cá nhân
│   │   ├── departments/page.tsx# Cổng Khoa phòng (Tạo phiếu & CSAT)
│   │   ├── kpi-config/page.tsx # Cấu hình Trọng số KPI & Thang xếp loại
│   │   ├── management/page.tsx # Danh mục Khoa phòng & Phân quyền
│   │   ├── reports/page.tsx    # Báo cáo Thống kê & Xuất Excel
│   │   ├── api/                # REST API endpoints cho toàn hệ thống
│   │   ├── layout.tsx          # Root Layout với Header & Navigation
│   │   └── globals.css         # Styling, tokens, Google Material Symbols
│   ├── components/
│   │   ├── Header.tsx          # Top Header với Role Switcher & Thông báo
│   │   ├── Navigation.tsx      # Thanh điều hướng (Mobile bottom bar & Desktop)
│   │   └── Toast.tsx           # Thông báo Toast tương tác
│   └── lib/
│       ├── prisma.ts           # Prisma client singleton
│       ├── types.ts            # Type definitions, enums & helpers
│       └── auth-context.tsx    # Quản lý phiên và chuyển đổi vai trò người dùng
├── package.json
└── tailwind.config.ts
```
