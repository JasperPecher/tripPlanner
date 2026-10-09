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
    } = body;
    if (!title)
      return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const parsedPrice = price ? parseFloat(price) : null;

    const booking = await prisma.booking.create({
      data: {
        title,
        description: description || null,
        type: type || "other",
        reference: reference || null,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        location: location || null,
        price: parsedPrice,
        tripId,
      },
    });

    let expense = null;
    if (parsedPrice && body.paidById) {
      const tripMembers = await prisma.member.findMany({
        where: { tripId },
      });

      const splitAmount = tripMembers.length > 0 ? parsedPrice / tripMembers.length : parsedPrice;

      const categoryMap: Record<string, string> = {
        hotel: "accommodation",
        flight: "transport",
        train: "transport",
        car: "transport",
        activity: "activity",
        other: "other",
      };
      const category = categoryMap[type || "other"] || "other";

      expense = await prisma.expense.create({
        data: {
          description: `Booking: ${title}`,
          amount: parsedPrice,
          category,
          date: new Date(),
          tripId,
          paidById: body.paidById,
          splits: {
            create: tripMembers.map(member => ({
              amount: splitAmount,
              memberId: member.id,
            })),
          },
        },
        include: {
          paidBy: true,
          splits: { include: { member: true } },
        },
      });
    }

    return NextResponse.json({ booking, expense });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
