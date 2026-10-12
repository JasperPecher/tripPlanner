import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Add a new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { text, icon } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Task text is required" },
        { status: 400 }
      );
    }

    const task = await prisma.casinoTask.create({
      data: {
        tripId,
        text: text.trim(),
        icon: icon || "✨",
      },
    });

    return NextResponse.json({
      task: {
        id: task.id,
        text: task.text,
        icon: task.icon,
        createdAt: task.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating casino task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
