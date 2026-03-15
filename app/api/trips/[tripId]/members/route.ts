import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { name } = body;
    if (!name || !name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    const existing = await prisma.member.findFirst({ where: { tripId, name: { equals: name.trim(), mode: "insensitive" } } });
    if (existing) return NextResponse.json({ error: "This name is already taken" }, { status: 400 });
    const member = await prisma.member.create({ data: { name: name.trim(), tripId, isAdmin: false } });
    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error joining trip:", error);
    return NextResponse.json({ error: "Failed to join trip" }, { status: 500 });
  }
}
