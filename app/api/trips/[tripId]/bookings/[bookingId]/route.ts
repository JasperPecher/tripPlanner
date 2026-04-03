import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; bookingId: string }> },
) {
  try {
    const { bookingId } = await params;
    await prisma.booking.delete({ where: { id: bookingId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params;
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
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        title,
        description: description || null,
        type: type || "other",
        reference: reference || null,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        location: location || null,
        price: price ? parseFloat(price) : null,
        currency: currency || "EUR",
      },
    });
    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}
