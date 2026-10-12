import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE: Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; taskId: string }> }
) {
  try {
    const { taskId } = await params;

    await prisma.casinoTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting casino task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
