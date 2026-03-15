import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { description, amount, paidById, splits, currency } = body;
    if (!description || !amount || !paidById || !splits || splits.length === 0)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    const member = await prisma.member.findFirst({ where: { id: paidById, tripId } });
    if (!member) return NextResponse.json({ error: "Invalid member" }, { status: 400 });
    const expense = await prisma.expense.create({
      data: { description, amount: parseFloat(amount), currency: currency || "EUR", tripId, paidById, splits: { create: splits.map((s: { memberId: string; amount: number }) => ({ memberId: s.memberId, amount: s.amount })) } },
      include: { paidBy: true, splits: { include: { member: true } } },
    });
    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
