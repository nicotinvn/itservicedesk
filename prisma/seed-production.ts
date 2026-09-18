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
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
