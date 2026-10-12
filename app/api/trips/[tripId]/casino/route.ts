import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_TASKS = [
  { text: "Jaspers weltberühmten Nudelsalat zaubern", icon: "🍝" },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;

    // Check if trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        casinoTasks: {
          orderBy: { createdAt: "asc" },
        },
        casinoSpins: {
          include: { member: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    let tasks = trip.casinoTasks;

    // If no tasks exist in DB yet, auto-seed with default tasks
    if (tasks.length === 0) {
      await prisma.casinoTask.createMany({
        data: DEFAULT_TASKS.map((t) => ({
          tripId,
          text: t.text,
          icon: t.icon,
        })),
      });

      tasks = await prisma.casinoTask.findMany({
        where: { tripId },
        orderBy: { createdAt: "asc" },
      });
    }

    const spins = trip.casinoSpins.map((s) => ({
      id: s.id,
      who: s.member?.name || "Unknown",
      task: s.taskText,
      timestamp: s.createdAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      tasks: tasks.map((t) => ({
        id: t.id,
        text: t.text,
        icon: t.icon,
        createdAt: t.createdAt.toISOString(),
      })),
      spins,
    });
  } catch (error) {
    console.error("Error fetching casino data:", error);
    return NextResponse.json(
      { error: "Failed to fetch casino data" },
      { status: 500 },
    );
  }
}

// POST: Record a new spin result
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { memberId, taskId, taskText, taskIcon } = body;

    if (!memberId || !taskText) {
      return NextResponse.json(
        { error: "memberId and taskText are required" },
        { status: 400 },
      );
    }

    const spin = await prisma.casinoSpin.create({
      data: {
        tripId,
        memberId,
        taskId: taskId || null,
        taskText,
        taskIcon: taskIcon || "🍳",
      },
      include: {
        member: true,
      },
    });

    return NextResponse.json({
      spin: {
        id: spin.id,
        who: spin.member?.name || "Unknown",
        task: spin.taskText,
        timestamp: spin.createdAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: spin.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error recording casino spin:", error);
    return NextResponse.json(
      { error: "Failed to record spin" },
      { status: 500 },
    );
  }
}

// DELETE: Clear all spin history for this trip
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;

    await prisma.casinoSpin.deleteMany({
      where: { tripId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing casino history:", error);
    return NextResponse.json(
      { error: "Failed to clear history" },
      { status: 500 },
    );
  }
}
