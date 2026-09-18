import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/server-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "UPDATE_TICKET");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { score = 10, feedbackNote } = body;

    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    if (existingTicket.status !== "COMPLETED" && existingTicket.status !== "CLOSED") {
      return NextResponse.json({ error: "Chỉ được đánh giá sau khi trưởng phòng xác nhận hoàn thành" }, { status: 409 });
    }

    const csat = await prisma.csatRating.upsert({
      where: { ticketId: id },
      create: {
        ticketId: id,
        score: Number(score),
        feedbackNote,
      },
      update: {
        score: Number(score),
        feedbackNote,
        ratedAt: new Date(),
      },
    });

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        // CSAT is optional feedback after the operational workflow is complete.
        currentStep: 6,
      },
      include: {
        csatRating: true,
        evaluation: true,
      },
    });

    return NextResponse.json({ success: true, ticket, csat });
  } catch (error) {
    console.error("Error rating CSAT:", error);
    return NextResponse.json({ error: "Failed to submit CSAT" }, { status: 500 });
  }
}
