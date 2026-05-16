import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { item, category, assignedToId } = body;

    if (!item) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const packingItem = await prisma.packingItem.create({
      data: {
        item,
        category,
        assignedToId,
        tripId,
      },
      include: {
        assignedTo: true,
      },
    });

    return NextResponse.json(packingItem);
  } catch (error) {
    console.error("Error creating packing item:", error);
    return NextResponse.json({ error: "Failed to create packing item" }, { status: 500 });
  }
}
