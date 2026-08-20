import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { location, latitude, longitude, date, order, travelType } = body;

    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    // Determine the next order index for this trip by finding the maximum current order
    const lastPoint = await prisma.routePoint.findFirst({
      where: { tripId },
      orderBy: { order: 'desc' }
    });
    const nextOrder = lastPoint ? lastPoint.order + 1 : 0;

    const routePoint = await prisma.routePoint.create({
      data: {
        location,
        latitude,
        longitude,
        date: date ? new Date(date) : null,
        order: nextOrder,
        travelType: travelType || null,
        tripId,
      },
    });

    return NextResponse.json(routePoint);
  } catch (error) {
    console.error("Error creating route point:", error);
    return NextResponse.json({ error: "Failed to create route point" }, { status: 500 });
  }
}
