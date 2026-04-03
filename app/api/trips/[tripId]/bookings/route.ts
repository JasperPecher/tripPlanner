import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      type,
      reference,
      checkIn,
      checkOut,
      location,
      price,
      currency,
    } = body;
    if (!title)
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    const booking = await prisma.booking.create({
      data: {
        title,
        description: description || null,
        type: type || "other",
        reference: reference || null,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        location: location || null,
        price: price ? parseFloat(price) : null,
        currency: currency || "EUR",
        tripId,
      },
    });
    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
