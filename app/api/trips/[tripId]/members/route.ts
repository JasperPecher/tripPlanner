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
    const member = await prisma.member.create({ data: { name: name.trim(), tripId } });
    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error joining trip:", error);
    return NextResponse.json({ error: "Failed to join trip" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { memberId, name, paypalLink } = body;

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const member = await prisma.member.findFirst({ where: { id: memberId, tripId } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const updateData: { name?: string; paypalLink?: string } = {};

    if (name && name.trim() && name.trim() !== member.name) {
      const existing = await prisma.member.findFirst({
        where: { tripId, name: { equals: name.trim(), mode: "insensitive" }, NOT: { id: memberId } },
      });
      if (existing) {
        return NextResponse.json({ error: "This name is already taken" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (paypalLink !== undefined) {
      updateData.paypalLink = paypalLink?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ member });
    }

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: updateData,
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}
