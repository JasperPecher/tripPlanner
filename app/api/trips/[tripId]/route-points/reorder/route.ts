import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { pointIds } = body;

    if (!Array.isArray(pointIds)) {
      return NextResponse.json({ error: "pointIds must be an array" }, { status: 400 });
    }

    // Update each point with its new index as order
    const updatePromises = pointIds.map((id, index) =>
      prisma.routePoint.update({
        where: { id, tripId },
        data: { order: index },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering route points:", error);
    return NextResponse.json(
      { error: "Failed to reorder route points" },
      { status: 500 },
    );
  }
}
