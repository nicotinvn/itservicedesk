# PHẦN MỀM TIẾP NHẬN VÀ QUẢN LÝ YÊU CẦU CÔNG VIỆC CNTT

## 1. Mục tiêu

Xây dựng hệ thống quản lý yêu cầu công việc từ các khoa phòng gửi đến Phòng Công nghệ Thông tin, giúp:

* Tiếp nhận yêu cầu tập trung.
* Theo dõi trạng thái xử lý.
* Trưởng phòng phân công công việc cho nhân viên.
* Nhân viên báo cáo kết quả thực hiện.
* Trưởng phòng đánh giá mức độ hoàn thành.
* Tự động tính điểm KPI và xếp loại hàng tháng.
* Báo cáo thống kê theo cá nhân, khoa phòng và thời gian.

Hệ thống hỗ trợ triển khai trên nền tảng Web và dễ dàng Deploy trên Vercel.

---

# 2. Phân quyền người dùng

## 2.1 Quản trị hệ thống (Admin)

Quyền:

* Quản lý người dùng.
* Quản lý danh mục.
* Quản lý cấu hình KPI.
* Xem toàn bộ dữ liệu.
* Xuất báo cáo.

---

## 2.2 Trưởng phòng CNTT

Quyền:

* Tiếp nhận yêu cầu.
* Duyệt hoặc từ chối yêu cầu.
* Phân công nhân viên xử lý.
* Theo dõi tiến độ.
* Đánh giá kết quả hoàn thành.
* Chấm điểm KPI.
* Xem báo cáo tổng hợp.

---

## 2.3 Nhân viên CNTT

Quyền:

* Xem công việc được giao.
* Cập nhật tiến độ.
* Báo cáo kết quả xử lý.
* Đính kèm hình ảnh, biên bản.
* Xem điểm KPI cá nhân.

---

## 2.4 Người dùng khoa phòng

Quyền:

* Tạo yêu cầu mới.
* Theo dõi tiến độ xử lý.
* Đánh giá mức độ hài lòng.
* Xem lịch sử yêu cầu đã gửi.

---

# 3. Danh mục hệ thống

## 3.1 Danh mục khoa phòng

Thông tin:

* Mã khoa phòng
* Tên khoa phòng
* Người phụ trách

---

## 3.2 Danh mục người dùng

Thông tin:

* Họ tên
* Tài khoản
* Email
* Số điện thoại
* Vai trò
* Trạng thái hoạt động

---

## 3.3 Danh mục loại yêu cầu

Ví dụ:

* Sửa chữa máy tính
* Sửa chữa máy in
* Cài đặt phần mềm
* Mạng Internet
* Camera
* Email
* Máy chủ
* Hỗ trợ người dùng
* Khác

---

## 3.4 Danh mục mức độ ưu tiên

* Khẩn cấp
* Cao
* Bình thường
* Thấp

---

# 4. Quy trình xử lý công việc

## Bước 1: Khoa phòng gửi yêu cầu

Thông tin yêu cầu:

* Tiêu đề
* Nội dung
* Loại yêu cầu
* Mức độ ưu tiên
* Người gửi
* Khoa phòng
* Hình ảnh đính kèm

Sau khi gửi:

* Sinh mã phiếu tự động
* Trạng thái = Chờ tiếp nhận

Ví dụ:

YC2025060001

---

## Bước 2: Trưởng phòng tiếp nhận

Các thao tác:

* Xem nội dung
* Phê duyệt
* Từ chối
* Chuyển xử lý

Trạng thái:

* Chờ tiếp nhận
* Đã tiếp nhận
* Từ chối

---

## Bước 3: Phân công nhân viên

Thông tin:

* Nhân viên xử lý
* Hạn hoàn thành
* Ghi chú

Trạng thái:

* Đang xử lý

---

## Bước 4: Nhân viên thực hiện

Nhân viên cập nhật:

* Nội dung xử lý
* Thời gian thực hiện
* Hình ảnh
* File đính kèm

Các trạng thái:

* Chưa thực hiện
* Đang xử lý
* Chờ xác nhận
* Hoàn thành

---

## Bước 5: Báo cáo hoàn thành

Nhân viên nhập:

* Nội dung công việc hoàn thành
* Kết quả đạt được
* Thời gian thực hiện
* Minh chứng

---

## Bước 6: Đánh giá của Trưởng phòng

Tiêu chí:

### Chất lượng công việc

* 1 đến 10 điểm

### Tiến độ hoàn thành

* 1 đến 10 điểm

### Tinh thần phối hợp

* 1 đến 10 điểm

### Ghi chú đánh giá

* Nhận xét chi tiết

---

## Bước 7: Đánh giá hài lòng của khoa phòng

Điểm:

* Rất hài lòng (10)
* Hài lòng (8)
* Bình thường (6)
* Chưa hài lòng (4)

Ghi chú phản hồi.

---

# 5. Tính điểm KPI tự động

## Công thức đề xuất

Điểm KPI =

(40% × Điểm chất lượng)

*

(30% × Điểm tiến độ)

*

(20% × Điểm hài lòng khoa phòng)

*

(10% × Số lượng công việc hoàn thành)

---

## Quy đổi xếp loại

### Xuất sắc

≥ 90 điểm

---

### Tốt

80 - 89 điểm

---

### Khá

70 - 79 điểm

---

### Trung bình

60 - 69 điểm

---

### Chưa hoàn thành

< 60 điểm

---

# 6. Dashboard

## Trưởng phòng

Hiển thị:

* Tổng số yêu cầu
* Yêu cầu chờ xử lý
* Yêu cầu quá hạn
* Yêu cầu hoàn thành
* Biểu đồ theo tháng
* KPI nhân viên

---

## Nhân viên

Hiển thị:

* Công việc được giao
* Công việc đang xử lý
* Công việc hoàn thành
* KPI cá nhân
* Lịch công việc

---

## Khoa phòng

Hiển thị:

* Yêu cầu đã gửi
* Yêu cầu đang xử lý
* Yêu cầu hoàn thành
* Mức độ hài lòng

---

# 7. Báo cáo

## Báo cáo theo khoa phòng

* Số lượng yêu cầu
* Thời gian xử lý trung bình
* Tỷ lệ hoàn thành

---

## Báo cáo theo nhân viên

* Số công việc được giao
* Số công việc hoàn thành
* Điểm KPI
* Xếp loại

---

## Báo cáo theo tháng

* Tổng số yêu cầu
* Tỷ lệ hoàn thành
* KPI toàn phòng

---

# 8. Thông báo

Hệ thống gửi thông báo:

* Có yêu cầu mới
* Có công việc được giao
* Sắp đến hạn xử lý
* Quá hạn xử lý
* Công việc hoàn thành

Hỗ trợ:

* Email
* Thông báo trên hệ thống

---

# 9. Cơ sở dữ liệu

## Bảng users

* id
* username
* fullname
* email
* role
* department_id

---

## Bảng departments

* id
* code
* name

---

## Bảng tickets

* id
* ticket_code
* title
* description
* department_id
* creator_id
* priority
* status
* created_at

---

## Bảng assignments

* id
* ticket_id
* employee_id
* assigned_by
* assigned_date
* due_date

---

## Bảng task_reports

* id
* ticket_id
* employee_id
* report_content
* completed_at

---

## Bảng evaluations

* id
* ticket_id
* employee_id
* quality_score
* progress_score
* satisfaction_score
* total_score

---

# 10. Công nghệ đề xuất

## Frontend

* Next.js 15
* TypeScript
* TailwindCSS
* Shadcn UI

## Backend

* Next.js API Route
* Prisma ORM

## Database

* PostgreSQL

## Authentication

* NextAuth

## Deploy

* Vercel
* Neon PostgreSQL

---

# 11. Chức năng mở rộng tương lai

* AI tự động phân loại yêu cầu.
* AI đề xuất nhân viên phù hợp.
* Tích hợp Zalo OA.
* Tích hợp Microsoft Teams.
* Chữ ký số biên bản nghiệm thu.
* Ứng dụng Mobile App.
* Tự động xuất báo cáo KPI PDF hàng tháng.
