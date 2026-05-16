import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { item, category, packed, assignedToId } = body;

    const updateData: any = {};
    if (item !== undefined) updateData.item = item;
    if (category !== undefined) updateData.category = category;
    if (packed !== undefined) updateData.packed = packed;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

    const packingItem = await prisma.packingItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        assignedTo: true,
      },
    });

    return NextResponse.json(packingItem);
  } catch (error) {
    console.error("Error updating packing item:", error);
    return NextResponse.json({ error: "Failed to update packing item" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> },
) {
  try {
    const { itemId } = await params;

    await prisma.packingItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting packing item:", error);
    return NextResponse.json({ error: "Failed to delete packing item" }, { status: 500 });
  }
}
