import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = requirePermission(request, "MANAGE_KPI");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    let config = await prisma.kpiConfig.findFirst({
      where: { isDefault: true },
    });

    if (!config) {
      config = await prisma.kpiConfig.create({
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
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching KPI config:", error);
    return NextResponse.json({ error: "Failed to fetch KPI config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "MANAGE_KPI");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const {
      qualityWeight,
      progressWeight,
      satisfactionWeight,
      workloadWeight,
      excellentThreshold = 90,
      goodThreshold = 80,
      fairThreshold = 70,
      averageThreshold = 60,
    } = body;

    const total =
      Number(qualityWeight) +
      Number(progressWeight) +
      Number(satisfactionWeight) +
      Number(workloadWeight);

    if (Math.abs(total - 100) > 0.01) {
      return NextResponse.json(
        { error: `Tổng các trọng số phải bằng 100%. Hiện tại: ${total}%` },
        { status: 400 }
      );
    }

    let existing = await prisma.kpiConfig.findFirst({
      where: { isDefault: true },
    });

    let config;
    if (existing) {
      config = await prisma.kpiConfig.update({
        where: { id: existing.id },
        data: {
          qualityWeight: Number(qualityWeight),
          progressWeight: Number(progressWeight),
          satisfactionWeight: Number(satisfactionWeight),
          workloadWeight: Number(workloadWeight),
          excellentThreshold: Number(excellentThreshold),
          goodThreshold: Number(goodThreshold),
          fairThreshold: Number(fairThreshold),
          averageThreshold: Number(averageThreshold),
        },
      });
    } else {
      config = await prisma.kpiConfig.create({
        data: {
          qualityWeight: Number(qualityWeight),
          progressWeight: Number(progressWeight),
          satisfactionWeight: Number(satisfactionWeight),
          workloadWeight: Number(workloadWeight),
          excellentThreshold: Number(excellentThreshold),
          goodThreshold: Number(goodThreshold),
          fairThreshold: Number(fairThreshold),
          averageThreshold: Number(averageThreshold),
          isDefault: true,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error updating KPI config:", error);
    return NextResponse.json({ error: "Failed to update KPI config" }, { status: 500 });
  }
}
