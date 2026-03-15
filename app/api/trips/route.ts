import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateShareCode } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, startDate, endDate, adminName } = body;
    if (!name || !adminName) return NextResponse.json({ error: "Trip name and your name are required" }, { status: 400 });
    const shareCode = generateShareCode();
    const trip = await prisma.trip.create({
      data: { name, description: description || null, shareCode, startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null, members: { create: { name: adminName, isAdmin: true } } },
      include: { members: true },
    });
    const adminMember = trip.members.find((m) => m.isAdmin);
    return NextResponse.json({ trip, memberId: adminMember?.id });
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}
