import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { notes } = body;
    const trip = await prisma.trip.update({ where: { id: tripId }, data: { notes } });
    return NextResponse.json({ success: true, notes: trip.notes });
  } catch (error) {
    console.error("Error updating notes:", error);
    return NextResponse.json({ error: "Failed to update notes" }, { status: 500 });
  }
}
