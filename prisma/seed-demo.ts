import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 12);

  const emergency = await prisma.department.upsert({
    where: { code: "DEMO-ER" },
    update: {},
    create: {
      code: "DEMO-ER",
      name: "Khoa Cấp cứu Demo",
      category: "CLINICAL",
      building: "Tòa Demo A",
      floor: "Tầng 1",
      room: "Phòng 101",
      leaderName: "BS. Nguyễn Minh Demo",
      phone: "0900.000.101",
      staffCount: 12,
    },
  });

  const it = await prisma.department.upsert({
    where: { code: "DEMO-IT" },
    update: {},
    create: {
      code: "DEMO-IT",
      name: "Phòng CNTT Demo",
      category: "ADMINISTRATIVE",
      building: "Tòa Demo A",
      floor: "Tầng 2",
      room: "NOC Demo",
      leaderName: "Quản lý CNTT Demo",
      phone: "0900.000.102",
      staffCount: 6,
    },
  });

  const admin = await prisma.user.upsert({
    where: { username: "demo.admin" },
    update: { passwordHash, active: true, departmentId: it.id },
    create: {
      username: "demo.admin",
      fullName: "Quản trị Demo",
      email: "demo.admin@benhvien.vn",
      passwordHash,
      role: "ADMIN",
      departmentId: it.id,
      specialty: "Kiểm thử quản trị",
    },
  });

  const manager = await prisma.user.upsert({
    where: { username: "demo.manager" },
    update: { passwordHash, active: true, departmentId: it.id },
    create: {
      username: "demo.manager",
      fullName: "Trưởng phòng Demo",
      email: "demo.manager@benhvien.vn",
      passwordHash,
      role: "MANAGER",
      departmentId: it.id,
      specialty: "Điều phối yêu cầu",
    },
  });

  const technician = await prisma.user.upsert({
    where: { username: "demo.technician" },
    update: { passwordHash, active: true, departmentId: it.id },
    create: {
      username: "demo.technician",
      fullName: "Kỹ thuật viên Demo",
      email: "demo.technician@benhvien.vn",
      passwordHash,
      role: "TECHNICIAN",
      departmentId: it.id,
      specialty: "Mạng và máy trạm",
    },
  });

  const requester = await prisma.user.upsert({
    where: { username: "demo.requester" },
    update: { passwordHash, active: true, departmentId: emergency.id },
    create: {
      username: "demo.requester",
      fullName: "Người yêu cầu Demo",
      email: "demo.requester@benhvien.vn",
      passwordHash,
      role: "DEPARTMENT_USER",
      departmentId: emergency.id,
      specialty: "Khoa Cấp cứu",
    },
  });

  const openTicket = await prisma.ticket.upsert({
    where: { ticketCode: "DEMO-0001" },
    update: {},
    create: {
      ticketCode: "DEMO-0001",
      title: "Máy tính quầy tiếp đón không truy cập được HIS",
      description: "Dữ liệu demo để kiểm thử tiếp nhận và phê duyệt yêu cầu.",
      category: "NETWORK",
      priority: "HIGH",
      status: "PENDING_APPROVAL",
      departmentId: emergency.id,
      creatorId: requester.id,
      requesterName: requester.fullName,
      requesterPhone: "0900.000.103",
      roomLocation: "Tòa Demo A - Phòng 101",
    },
  });

  const activeTicket = await prisma.ticket.upsert({
    where: { ticketCode: "DEMO-0002" },
    update: {},
    create: {
      ticketCode: "DEMO-0002",
      title: "Cài đặt máy in mã vạch cho phòng khám",
      description: "Dữ liệu demo đang được kỹ thuật viên xử lý.",
      category: "PRINTER",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      currentStep: 3,
      departmentId: emergency.id,
      creatorId: requester.id,
      requesterName: requester.fullName,
      requesterPhone: "0900.000.103",
      roomLocation: "Tòa Demo A - Phòng 102",
    },
  });

  await prisma.assignment.upsert({
    where: { ticketId: activeTicket.id },
    update: { technicianId: technician.id, assignedById: manager.id },
    create: {
      ticketId: activeTicket.id,
      technicianId: technician.id,
      assignedById: manager.id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      managerNote: "Ưu tiên xử lý trong ca trực demo.",
    },
  });

  const completedTicket = await prisma.ticket.upsert({
    where: { ticketCode: "DEMO-0003" },
    update: {},
    create: {
      ticketCode: "DEMO-0003",
      title: "Cấp quyền sử dụng phần mềm EMR",
      description: "Dữ liệu demo đã hoàn tất để kiểm thử đánh giá và CSAT.",
      category: "SOFTWARE",
      priority: "LOW",
      status: "COMPLETED",
      currentStep: 7,
      departmentId: emergency.id,
      creatorId: requester.id,
      requesterName: requester.fullName,
      requesterPhone: "0900.000.103",
      roomLocation: "Tòa Demo A - Phòng 103",
    },
  });

  await prisma.assignment.upsert({
    where: { ticketId: completedTicket.id },
    update: {},
    create: {
      ticketId: completedTicket.id,
      technicianId: technician.id,
      assignedById: manager.id,
      dueDate: new Date(Date.now() - 60 * 60 * 1000),
      managerNote: "Hoàn tất theo quy trình demo.",
    },
  });

  await prisma.taskReport.upsert({
    where: { ticketId: completedTicket.id },
    update: {},
    create: {
      ticketId: completedTicket.id,
      technicianId: technician.id,
      reportContent: "Đã cấp quyền và kiểm tra đăng nhập EMR thành công.",
    },
  });

  await prisma.evaluation.upsert({
    where: { ticketId: completedTicket.id },
    update: {},
    create: {
      ticketId: completedTicket.id,
      technicianId: technician.id,
      qualityScore: 9,
      progressScore: 9,
      coordinationScore: 10,
      totalScore: 9.3,
      managerComment: "Xử lý đúng hạn trong dữ liệu demo.",
    },
  });

  await prisma.csatRating.upsert({
    where: { ticketId: completedTicket.id },
    update: {},
    create: {
      ticketId: completedTicket.id,
      score: 10,
      feedbackNote: "Hỗ trợ nhanh và rõ ràng.",
    },
  });

  if (!(await prisma.kpiConfig.findFirst())) {
    await prisma.kpiConfig.create({ data: {} });
  }

  console.log("Demo data is ready.");
  console.log("Users: demo.admin, demo.manager, demo.technician, demo.requester");
  console.log("Password: 123456");
  console.log(`Tickets: ${openTicket.ticketCode}, ${activeTicket.ticketCode}, ${completedTicket.ticketCode}`);
  console.log(`Admin seed user: ${admin.username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });