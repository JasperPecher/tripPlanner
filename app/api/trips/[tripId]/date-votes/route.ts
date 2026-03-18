import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const votes = await prisma.dateVote.findMany({
      where: { tripId },
      include: { member: true },
      orderBy: { date: "asc" },
    });
    const serialized = votes.map((v) => ({
      ...v,
      date: v.date.toISOString(),
      createdAt: v.createdAt.toISOString(),
      member: { ...v.member, joinedAt: v.member.joinedAt.toISOString() },
    }));
    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching date votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch date votes" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { date, memberId } = body;
    if (!date || !memberId) {
      return NextResponse.json(
        { error: "date and memberId are required" },
        { status: 400 },
      );
    }
    const voteDate = new Date(date);
    voteDate.setUTCHours(0, 0, 0, 0);

    const vote = await prisma.dateVote.upsert({
      where: {
        tripId_memberId_date: { tripId, memberId, date: voteDate },
      },
      update: {},
      create: { tripId, memberId, date: voteDate },
      include: { member: true },
    });
    return NextResponse.json({
      ...vote,
      date: vote.date.toISOString(),
      createdAt: vote.createdAt.toISOString(),
      member: { ...vote.member, joinedAt: vote.member.joinedAt.toISOString() },
    });
  } catch (error) {
    console.error("Error creating date vote:", error);
    return NextResponse.json(
      { error: "Failed to create date vote" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { date, memberId } = body;
    if (!date || !memberId) {
      return NextResponse.json(
        { error: "date and memberId are required" },
        { status: 400 },
      );
    }
    const voteDate = new Date(date);
    voteDate.setUTCHours(0, 0, 0, 0);

    await prisma.dateVote.delete({
      where: {
        tripId_memberId_date: { tripId, memberId, date: voteDate },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting date vote:", error);
    return NextResponse.json(
      { error: "Failed to delete date vote" },
      { status: 500 },
    );
  }
}
