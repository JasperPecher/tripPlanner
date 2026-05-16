import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; pointId: string }> },
) {
  try {
    const { pointId } = await params;
    const body = await request.json();
    const { location, latitude, longitude, date, order } = body;

    const updateData: any = {};
    if (location !== undefined) updateData.location = location;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (date !== undefined) updateData.date = date ? new Date(date) : null;
    if (order !== undefined) updateData.order = order;

    const routePoint = await prisma.routePoint.update({
      where: { id: pointId },
      data: updateData,
    });

    return NextResponse.json(routePoint);
  } catch (error) {
    console.error("Error updating route point:", error);
    return NextResponse.json({ error: "Failed to update route point" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; pointId: string }> },
) {
  try {
    const { pointId } = await params;

    await prisma.routePoint.delete({
      where: { id: pointId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting route point:", error);
    return NextResponse.json({ error: "Failed to delete route point" }, { status: 500 });
  }
}
