import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: { orderBy: { joinedAt: "asc" } },
        expenses: { include: { paidBy: true, splits: { include: { member: true } } }, orderBy: { createdAt: "desc" } },
        bookings: { orderBy: { createdAt: "desc" } },
        photos: { orderBy: { createdAt: "desc" } },
        storageConfig: true,
      },
    });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    const serialized = {
      ...trip,
      startDate: trip.startDate ? trip.startDate.toISOString() : null,
      endDate: trip.endDate ? trip.endDate.toISOString() : null,
      createdAt: trip.createdAt.toISOString(), updatedAt: trip.updatedAt.toISOString(),
      members: trip.members.map((m) => ({ ...m, joinedAt: m.joinedAt.toISOString() })),
      expenses: trip.expenses.map((e) => ({ ...e, createdAt: e.createdAt.toISOString(), paidBy: { ...e.paidBy, joinedAt: e.paidBy.joinedAt.toISOString() }, splits: e.splits.map((s) => ({ ...s, member: { ...s.member, joinedAt: s.member.joinedAt.toISOString() } })) })),
      bookings: trip.bookings.map((b) => ({ ...b, checkIn: b.checkIn ? b.checkIn.toISOString() : null, checkOut: b.checkOut ? b.checkOut.toISOString() : null, createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString() })),
      photos: trip.photos.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    };
    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching trip:", error);
    return NextResponse.json({ error: "Failed to fetch trip" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { name, description, startDate, endDate } = body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    const trip = await prisma.trip.update({ where: { id: tripId }, data: updateData });
    return NextResponse.json({ trip: { ...trip, startDate: trip.startDate ? trip.startDate.toISOString() : null, endDate: trip.endDate ? trip.endDate.toISOString() : null, createdAt: trip.createdAt.toISOString(), updatedAt: trip.updatedAt.toISOString() } });
  } catch (error) {
    console.error("Error updating trip:", error);
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    await prisma.trip.delete({ where: { id: tripId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trip:", error);
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }
}
