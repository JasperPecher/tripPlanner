import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { location, latitude, longitude, date, order } = body;

    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    const routePoint = await prisma.routePoint.create({
      data: {
        location,
        latitude,
        longitude,
        date: date ? new Date(date) : null,
        order: order || 0,
        tripId,
      },
    });

    return NextResponse.json(routePoint);
  } catch (error) {
    console.error("Error creating route point:", error);
    return NextResponse.json({ error: "Failed to create route point" }, { status: 500 });
  }
}
