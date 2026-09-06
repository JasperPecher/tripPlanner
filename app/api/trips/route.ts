import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateShareCode } from "@/lib/utils";
import { getTripMemberCookieName, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, startDate, endDate, adminName } = body;
    if (!name || !adminName) return NextResponse.json({ error: "Trip name and your name are required" }, { status: 400 });
    const shareCode = generateShareCode();
    const trip = await prisma.trip.create({
      data: { name, description: description || null, shareCode, startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null, members: { create: { name: adminName } } },
      include: { members: true },
    });
    const memberId = trip.members[0]?.id;
    const response = NextResponse.json({ trip, memberId });
    if (memberId) {
      response.cookies.set({
        name: getTripMemberCookieName(trip.id),
        value: encodeURIComponent(JSON.stringify({ id: memberId, name: adminName })),
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
      });
    }
    return response;
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}

