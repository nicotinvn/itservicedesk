import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Demo seed is destructive. Set ALLOW_DEMO_SEED=true explicitly for local demo data only."
    );
  }

  console.log("🌱 Seeding ITServiceDesk database...");

  // 1. Clean existing data
  await prisma.csatRating.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.taskReport.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.kpiConfig.deleteMany();

  // 2. Create Departments
  const cc = await prisma.department.create({
    data: {
      code: "KP-CC01",
      name: "Khoa Cấp cứu & Chống độc",
      category: "CLINICAL",
      building: "Tòa A1",
      floor: "Tầng Trệt",
      room: "Cổng tiếp đón BHYT",
      leaderName: "TS. BS. Nguyễn Văn Cường",
      phone: "0243.888.115",
      staffCount: 28,
    },
  });

  const cdha = await prisma.department.create({
    data: {
      code: "KP-CDHA",
      name: "Khoa Chẩn đoán Hình ảnh (PACS/MRI)",
      category: "PARACLINICAL",
      building: "Tòa B",
      floor: "Tầng 1",
      room: "Phòng điều hành PACS",
      leaderName: "BSCKII. Phạm Minh Đức",
      phone: "0243.888.204",
      staffCount: 14,
    },
  });

  const kb = await prisma.department.create({
    data: {
      code: "KP-KHAM",
      name: "Khoa Khám Bệnh & Tiếp đón",
      category: "CLINICAL",
      building: "Tòa A",
      floor: "Tầng 1 & 2",
      room: "Phòng Khám 102 - Quầy thu ngân",
      leaderName: "BSCKI. Vũ Thu Hằng",
      phone: "0243.888.101",
      staffCount: 45,
    },
  });

  const ngoai = await prisma.department.create({
    data: {
      code: "KP-NGOAI",
      name: "Khoa Ngoại Tổng hợp",
      category: "CLINICAL",
      building: "Tòa C",
      floor: "Tầng 4",
      room: "Khu Hậu phẫu & Giao ban",
      leaderName: "PGS. TS. Trần Hải Đăng",
      phone: "0243.888.405",
      staffCount: 32,
    },
  });

  const noitm = await prisma.department.create({
    data: {
      code: "KP-NOITM",
      name: "Khoa Nội Tim mạch",
      category: "CLINICAL",
      building: "Tòa C",
      floor: "Tầng 3",
      room: "Phòng Siêu âm & Bệnh án",
      leaderName: "TS. BS. Lê Quang Hưng",
      phone: "0243.888.303",
      staffCount: 26,
    },
  });

  const cntt = await prisma.department.create({
    data: {
      code: "PB-CNTT",
      name: "Phòng Công nghệ Thông tin",
      category: "ADMINISTRATIVE",
      building: "Tòa Điều Hành",
      floor: "Tầng 2",
      room: "Trung tâm Vận hành NOC / Server",
      leaderName: "ThS. Nguyễn Hoàng Nam",
      phone: "0243.888.999",
      staffCount: 8,
    },
  });

  // Additional mock departments for directory & reports
  const deptList = [
    { code: "KP-HSTC", name: "Khoa Hồi sức tích cực (ICU)", category: "CLINICAL", staffCount: 30, building: "Tòa A", floor: "Tầng 2" },
    { code: "KP-DUOC", name: "Khoa Dược & Kho thuốc", category: "PARACLINICAL", staffCount: 18, building: "Tòa D", floor: "Tầng 1" },
    { code: "KP-XN", name: "Khoa Xét nghiệm Trung tâm", category: "PARACLINICAL", staffCount: 22, building: "Tòa B", floor: "Tầng 2" },
    { code: "PB-KHTH", name: "Phòng Kế hoạch Tổng hợp", category: "ADMINISTRATIVE", staffCount: 12, building: "Tòa ĐH", floor: "Tầng 3" },
    { code: "PB-TCKT", name: "Phòng Tài chính Kế toán", category: "ADMINISTRATIVE", staffCount: 16, building: "Tòa ĐH", floor: "Tầng 1" },
    { code: "PB-TCCB", name: "Phòng Tổ chức Cán bộ", category: "ADMINISTRATIVE", staffCount: 8, building: "Tòa ĐH", floor: "Tầng 4" },
    { code: "PB-DD", name: "Phòng Điều dưỡng", category: "ADMINISTRATIVE", staffCount: 10, building: "Tòa ĐH", floor: "Tầng 2" },
    { code: "KP-SAN", name: "Khoa Phụ Sản & KHHGĐ", category: "CLINICAL", staffCount: 24, building: "Tòa E", floor: "Tầng 3" },
    { code: "KP-NHI", name: "Khoa Nhi & Sơ sinh", category: "CLINICAL", staffCount: 20, building: "Tòa E", floor: "Tầng 2" },
    { code: "KP-TMH", name: "Khoa Tai Mũi Họng", category: "CLINICAL", staffCount: 15, building: "Tòa A", floor: "Tầng 3" },
    { code: "KP-RHM", name: "Khoa Răng Hàm Mặt", category: "CLINICAL", staffCount: 14, building: "Tòa A", floor: "Tầng 3" },
    { code: "KP-MAT", name: "Khoa Mắt Kỹ thuật cao", category: "CLINICAL", staffCount: 12, building: "Tòa A", floor: "Tầng 4" },
    { code: "KP-UNGBUOU", name: "Khoa Ung bướu & Xạ trị", category: "CLINICAL", staffCount: 25, building: "Tòa F", floor: "Tầng Trệt" },
    { code: "KP-YHCT", name: "Khoa Y học Cổ truyền & PHCN", category: "CLINICAL", staffCount: 19, building: "Tòa G", floor: "Tầng 1" },
    { code: "PB-VTBYT", name: "Phòng Vật tư Trang thiết bị y tế", category: "ADMINISTRATIVE", staffCount: 11, building: "Tòa ĐH", floor: "Tầng 1" },
    { code: "PB-QLCL", name: "Phòng Quản lý Chất lượng", category: "ADMINISTRATIVE", staffCount: 6, building: "Tòa ĐH", floor: "Tầng 3" },
    { code: "KP-KSNK", name: "Khoa Kiểm soát Nhiễm khuẩn", category: "PARACLINICAL", staffCount: 14, building: "Tòa D", floor: "Tầng 2" },
    { code: "KP-DDT", name: "Khoa Dinh dưỡng & Tiết chế", category: "PARACLINICAL", staffCount: 9, building: "Tòa D", floor: "Tầng Trệt" },
  ];

  for (const d of deptList) {
    await prisma.department.create({
      data: {
        code: d.code,
        name: d.name,
        category: d.category,
        building: d.building,
        floor: d.floor,
        staffCount: d.staffCount,
      },
    });
  }

  // 3. Create Users
  // 3.1 Admin
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      fullName: "Quản trị viên Hệ thống",
      email: "admin@benhvien.vn",
      phone: "0900.000.001",
      role: "ADMIN",
      departmentId: cntt.id,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
      active: true,
    },
  });

  // 3.2 Trưởng phòng CNTT
  const manager = await prisma.user.create({
    data: {
      username: "nam.nguyen",
      fullName: "ThS. Nguyễn Hoàng Nam",
      email: "nam.nguyen@benhvien.vn",
      phone: "0913.999.888",
      role: "MANAGER",
      departmentId: cntt.id,
      specialty: "Trưởng phòng Quản lý Vận hành CNTT",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
      active: true,
    },
  });

  // 3.3 Kỹ thuật viên CNTT
  const ktv1 = await prisma.user.create({
    data: {
      username: "minh.le",
      fullName: "Lê Văn Minh",
      email: "minh.le@benhvien.vn",
      phone: "0988.112.233",
      role: "TECHNICIAN",
      departmentId: cntt.id,
      specialty: "Chuyên sâu Hạ tầng Mạng LAN/WAN & Phần mềm HIS",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgCbXYraZH5ObcvFnRMBOXDzMMCFMzYe0GjqMppLaSqOCvmLxiI5rxr8vikdB6oi1p4rbPlJ1VeRwSJhTOIIetVIORN3AiL8Jb966MNZj1FTuWLjm1FiX67oATKdSMD5HRa-9QB7sTDpzkhYpbABBpnbZofMczf9KvFC1c77gK16V4a6SeQ6GNm0qdAYU4A5lqlu_8W2iYOp39sU6RvL3jR-OLMw2dKD8iH3kfL8mUo0TtvTj0HlFG",
      active: true,
    },
  });

  const ktv2 = await prisma.user.create({
    data: {
      username: "anh.nguyen",
      fullName: "Nguyễn Hoàng Anh",
      email: "anh.nguyen@benhvien.vn",
      phone: "0977.223.344",
      role: "TECHNICIAN",
      departmentId: cntt.id,
      specialty: "Phần cứng, Máy in mã vạch, Thiết bị đầu cuối & Camera",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMgXZtXATit1hGkNebGsFuqFdksytcO1_aveHs8wfl0moxvbxHQyqBrDqzW8dv53gQaMi9J5TtxzlTswa-pzt7fTu27zzUO0c9vLWBTG4cVyXJAy6J7uEswh9pz8s3TeKSXJnrE1fML4MjWTKGS-l2f7htu3tfxH7iFWUUG9y5YL0qzIwovUdPi4eCghgtC9-m89Qwh2MmNw9nx7caYJRMGCgaLW9v-RHydr6mhS2icFCxEPTJSBhb",
      active: true,
    },
  });

  const ktv3 = await prisma.user.create({
    data: {
      username: "tuan.do",
      fullName: "Đỗ Quốc Tuấn",
      email: "tuan.do@benhvien.vn",
      phone: "0966.334.455",
      role: "TECHNICIAN",
      departmentId: cntt.id,
      specialty: "Hệ thống PACS, Máy chủ ảo hóa & Cơ sở dữ liệu Oracle",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
      active: true,
    },
  });

  // 3.4 Người dùng Khoa phòng
  const drHa = await prisma.user.create({
    data: {
      username: "ha.tran",
      fullName: "BS. Trần Thu Hà",
      email: "ha.tran@benhvien.vn",
      phone: "0912.345.678",
      role: "DEPARTMENT_USER",
      departmentId: cc.id,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
      active: true,
    },
  });

  const drLong = await prisma.user.create({
    data: {
      username: "long.le",
      fullName: "ThS. BS. Lê Hoàng Long",
      email: "long.le@benhvien.vn",
      phone: "0904.556.789",
      role: "DEPARTMENT_USER",
      departmentId: kb.id,
      active: true,
    },
  });

  // 4. Create Default KPI Configuration
  await prisma.kpiConfig.create({
    data: {
      qualityWeight: 40,
      progressWeight: 30,
      satisfactionWeight: 20,
      workloadWeight: 10,
      excellentThreshold: 90,
      goodThreshold: 80,
      fairThreshold: 70,
      averageThreshold: 60,
      isDefault: true,
    },
  });

  // 5. Create Tickets with all 7-step stages

  // Ticket 1: Active In-Progress Urgent Ticket (Matching Mockup screen Phieu_yeu_cau)
  const t1 = await prisma.ticket.create({
    data: {
      ticketCode: "YC2025060001",
      title: "Lỗi máy trạm tiếp đón khoa Cấp cứu mất kết nối mạng và máy in mã vạch",
      description: "Máy trạm số 1 cổng tiếp nhận BHYT không kết nối được phần mềm HIS, đèn switch cổng báo đỏ. Máy in mã vạch Zebra không nhận lệnh in từ phần mềm, bệnh nhân cấp cứu ùn ứ.",
      category: "NETWORK",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      currentStep: 3,
      departmentId: cc.id,
      creatorId: drHa.id,
      requesterName: "BS. Trần Thu Hà",
      requesterPhone: "0912.345.678",
      roomLocation: "Tầng 1 - Khu Cổng tiếp đón bệnh nhân BHYT",
      images: JSON.stringify([
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBhn4XTimyASVsNheKZKM75NIwcElPerRmwA8rosMXZHujSsfOMGHp3etFYlV4Qo8Q24ZsFVlybAtdR6eA3cDMLaOfwk0oo36auvA-TOY5Bt4eXO4Er3R2H1X7o3xEpsKLJ1Swx8GWkGGjwBqQKFUIoLFirEAteBZfC2zRGnoSvN2ohKuT8mTLCWJT2QdT3vyvlNi-qvnVvBwr4p3gm8UZwHEcFDQ3jjfzpxnfJf5Qu3mv91oRfXhfK",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA8IXIIzFrhcF4JTVQIuTqdNAemN-usvVe3dz4_K3Wks5X1q2Gb0eEjgCRQIybDHp02un59n9YV3ZGACiwThbS7bQSXIsHRq9Qsm28t6i8GWj9_p-EpC4gcSbyO8P5zLz12n23ssVqgT93tPWu609BUV86XpWNSxHDodajmQv7HUtRgVmJs8bEQAI8eUhal827u2qHBKlnAF0HE5qPSP3mxK9C-5_RM2H7R8DbodrPE09EMzT3WIpgt",
      ]),
      createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
    },
  });

  await prisma.assignment.create({
    data: {
      ticketId: t1.id,
      technicianId: ktv1.id,
      assignedById: manager.id,
      assignedDate: new Date(Date.now() - 25 * 60 * 1000),
      dueDate: new Date(Date.now() + 20 * 60 * 1000), // 45m SLA total
      managerNote: "Ưu tiên thay switch mạng dự phòng hoặc đấu nối line trực tiếp cho máy tiếp đón số 1. Xử lý khẩn cấp tránh ùn tắc bệnh nhân cấp cứu.",
    },
  });

  // Ticket 2: Pending Approval Ticket (Step 2)
  await prisma.ticket.create({
    data: {
      ticketCode: "YC2025060002",
      title: "Máy in hóa đơn viện phí tại Quầy thu ngân 3 kẹt giấy và rách băng mực",
      description: "Quầy 3 khoa khám bệnh đông người chờ nộp viện phí. Máy in kim EPSON LQ-310 phát tiếng kêu cạch cạch rồi kẹt cứng giấy liên 3, rách dải mực in.",
      category: "PRINTER",
      priority: "HIGH",
      status: "PENDING_APPROVAL",
      currentStep: 2,
      departmentId: kb.id,
      creatorId: drLong.id,
      requesterName: "ThS. BS. Lê Hoàng Long",
      requesterPhone: "0904.556.789",
      roomLocation: "Tầng 1 - Quầy thu ngân số 3",
      images: JSON.stringify([
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA8IXIIzFrhcF4JTVQIuTqdNAemN-usvVe3dz4_K3Wks5X1q2Gb0eEjgCRQIybDHp02un59n9YV3ZGACiwThbS7bQSXIsHRq9Qsm28t6i8GWj9_p-EpC4gcSbyO8P5zLz12n23ssVqgT93tPWu609BUV86XpWNSxHDodajmQv7HUtRgVmJs8bEQAI8eUhal827u2qHBKlnAF0HE5qPSP3mxK9C-5_RM2H7R8DbodrPE09EMzT3WIpgt",
      ]),
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  });

  // Ticket 3: Pending Confirmation & Evaluation (Step 5/6)
  const t3 = await prisma.ticket.create({
    data: {
      ticketCode: "YC2025060003",
      title: "Hệ thống PACS không tải được ảnh chụp cắt lớp CT 128 dãy",
      description: "Bác sĩ đọc phim không xem được chuỗi ảnh DICOM từ máy CT chuyển sang máy trạm chẩn đoán số 4. Cần đồng bộ lại service DICOM Receiver.",
      category: "SOFTWARE",
      priority: "CRITICAL",
      status: "PENDING_CONFIRMATION",
      currentStep: 5,
      departmentId: cdha.id,
      creatorId: drHa.id,
      requesterName: "BSCKII. Phạm Minh Đức",
      requesterPhone: "0243.888.204",
      roomLocation: "Tòa B - Tầng 1 - Phòng đọc phim CT",
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    },
  });

  await prisma.assignment.create({
    data: {
      ticketId: t3.id,
      technicianId: ktv3.id,
      assignedById: manager.id,
      assignedDate: new Date(Date.now() - 2.8 * 3600 * 1000),
      dueDate: new Date(Date.now() - 1.5 * 3600 * 1000),
      managerNote: "Kiểm tra dung lượng ổ đĩa đệm lưu trữ PACS Storage và restart DICOM Router daemon.",
    },
  });

  await prisma.taskReport.create({
    data: {
      ticketId: t3.id,
      technicianId: ktv3.id,
      reportContent: "Đã kiểm tra và giải phóng 120GB bộ nhớ đệm cache tạm thời, restart DICOM Service, test truyền nhận ảnh ca CT 128 dãy thành công với tốc độ ổn định 100MB/s.",
      proofImages: JSON.stringify([
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBhn4XTimyASVsNheKZKM75NIwcElPerRmwA8rosMXZHujSsfOMGHp3etFYlV4Qo8Q24ZsFVlybAtdR6eA3cDMLaOfwk0oo36auvA-TOY5Bt4eXO4Er3R2H1X7o3xEpsKLJ1Swx8GWkGGjwBqQKFUIoLFirEAteBZfC2zRGnoSvN2ohKuT8mTLCWJT2QdT3vyvlNi-qvnVvBwr4p3gm8UZwHEcFDQ3jjfzpxnfJf5Qu3mv91oRfXhfK",
      ]),
      completedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  // Ticket 4: Fully Completed Ticket with KPI Evaluation & CSAT (Step 7)
  const t4 = await prisma.ticket.create({
    data: {
      ticketCode: "YC2025060004",
      title: "Cài đặt phần mềm đọc bệnh án điện tử EMR cho 3 máy bác sĩ mới",
      description: "Khoa Nội tim mạch bổ sung 3 bác sĩ nội trú mới tại Buồng bệnh 302, cần cài đặt và phân quyền tài khoản chữ ký số và EMR.",
      category: "SOFTWARE",
      priority: "MEDIUM",
      status: "COMPLETED",
      currentStep: 7,
      departmentId: noitm.id,
      creatorId: drLong.id,
      requesterName: "TS. BS. Lê Quang Hưng",
      requesterPhone: "0243.888.303",
      roomLocation: "Tòa C - Tầng 3 - Buồng bệnh 302",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
  });

  await prisma.assignment.create({
    data: {
      ticketId: t4.id,
      technicianId: ktv1.id,
      assignedById: manager.id,
      assignedDate: new Date(Date.now() - 23 * 3600 * 1000),
      dueDate: new Date(Date.now() - 19 * 3600 * 1000),
      managerNote: "Hướng dẫn các bác sĩ mới đổi mật khẩu lần đầu và kiểm tra kết nối USB token chữ ký số.",
    },
  });

  await prisma.taskReport.create({
    data: {
      ticketId: t4.id,
      technicianId: ktv1.id,
      reportContent: "Hoàn tất cài đặt EMR, phân quyền mẫu biểu mẫu tim mạch, cấu hình chữ ký số và hướng dẫn bác sĩ sử dụng đầy đủ.",
      completedAt: new Date(Date.now() - 20 * 3600 * 1000),
    },
  });

  await prisma.evaluation.create({
    data: {
      ticketId: t4.id,
      technicianId: ktv1.id,
      qualityScore: 9,
      progressScore: 10,
      coordinationScore: 9,
      totalScore: 9.3,
      managerComment: "Thực hiện đúng hạn, hướng dẫn người dùng chu đáo, tác phong hòa nhã.",
    },
  });

  await prisma.csatRating.create({
    data: {
      ticketId: t4.id,
      score: 10,
      feedbackNote: "Kỹ thuật viên Minh hỗ trợ rất nhiệt tình, tận tâm và chuyên nghiệp!",
    },
  });

  // Ticket 5: In progress maintenance
  const t5 = await prisma.ticket.create({
    data: {
      ticketCode: "YC2025060005",
      title: "Kiểm tra switch mạng tầng 4 thỉnh thoảng chập chờn giờ cao điểm",
      description: "Các máy tính phòng giao ban Ngoại khoa thỉnh thoảng bị dis mạng tầm 10h-11h sáng, cần đo kiểm suy hao cáp quang hoặc thay thế cổng switch.",
      category: "NETWORK",
      priority: "LOW",
      status: "IN_PROGRESS",
      currentStep: 4,
      departmentId: ngoai.id,
      creatorId: drHa.id,
      requesterName: "PGS. TS. Trần Hải Đăng",
      requesterPhone: "0243.888.405",
      roomLocation: "Tòa C - Tầng 4 - Tủ Rack mạng trung tâm",
      createdAt: new Date(Date.now() - 8 * 3600 * 1000),
    },
  });

  await prisma.assignment.create({
    data: {
      ticketId: t5.id,
      technicianId: ktv1.id,
      assignedById: manager.id,
      assignedDate: new Date(Date.now() - 7 * 3600 * 1000),
      dueDate: new Date(Date.now() + 5 * 3600 * 1000),
      managerNote: "Đo lại công suất cổng SFP quang và kiểm tra log loop mạng.",
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
