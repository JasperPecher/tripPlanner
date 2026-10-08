import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { memberId, defaultTab } = await request.json();

    if (!memberId || !defaultTab) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: { defaultTab },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Failed to update default tab:", error);
    return NextResponse.json(
      { error: "Failed to update default tab" },
      { status: 500 }
    );
  }
}
