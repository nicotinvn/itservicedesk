import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.PRODUCTION_ADMIN_USERNAME;
  const email = process.env.PRODUCTION_ADMIN_EMAIL;
  const password = process.env.PRODUCTION_ADMIN_PASSWORD;

  if (!username || !email || !password || password.length < 12) {
    throw new Error(
      "Set PRODUCTION_ADMIN_USERNAME, PRODUCTION_ADMIN_EMAIL and a PRODUCTION_ADMIN_PASSWORD with at least 12 characters."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { username },
    update: { email, passwordHash, active: true, role: "ADMIN" },
    create: {
      username,
      fullName: "Quản trị viên hệ thống",
      email,
      passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  console.log(`Production admin is ready: ${admin.username}`);

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
      staffCount: 6,
    },
  });

  const demoPasswordHash = await bcrypt.hash("123456", 12);
  const demoUsers = [
    {
      username: "admin",
      fullName: "Quản trị viên Hệ thống",
      email: "admin@benhvien.vn",
      role: "ADMIN",
      departmentId: it.id,
      specialty: "Toàn quyền cấu hình và báo cáo",
    },
    {
      username: "nam.nguyen",
      fullName: "ThS. Nguyễn Hoàng Nam",
      email: "nam.nguyen@benhvien.vn",
      role: "MANAGER",
      departmentId: it.id,
      specialty: "Trưởng phòng Quản lý Vận hành CNTT",
    },
    {
      username: "minh.le",
      fullName: "Lê Văn Minh",
      email: "minh.le@benhvien.vn",
      role: "TECHNICIAN",
      departmentId: it.id,
      specialty: "Kỹ thuật viên mạng và máy trạm",
    },
    {
      username: "ha.tran",
      fullName: "BS. Trần Thu Hà",
      email: "ha.tran@benhvien.vn",
      role: "DEPARTMENT_USER",
      departmentId: emergency.id,
      specialty: "Khoa Cấp cứu",
    },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        fullName: user.fullName,
        passwordHash: demoPasswordHash,
        role: user.role,
        departmentId: user.departmentId,
        specialty: user.specialty,
        active: true,
      },
      create: {
        ...user,
        passwordHash: demoPasswordHash,
        active: true,
      },
    });
  }

  if (!(await prisma.kpiConfig.findFirst())) {
    await prisma.kpiConfig.create({ data: {} });
  }

  console.log("Test users are ready: admin, nam.nguyen, minh.le, ha.tran");
  console.log("Test password: 123456 (change these passwords after verification)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
