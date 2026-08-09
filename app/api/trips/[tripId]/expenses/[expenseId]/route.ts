import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ tripId: string; expenseId: string }> }) {
  try {
    const { expenseId } = await params;
    await prisma.expense.delete({ where: { id: expenseId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; expenseId: string }> }
) {
  try {
    const { expenseId } = await params;
    const json = await request.json();
    const { description, amount, paidById, splits, category } = json;

    const updatedExpense = await prisma.$transaction(async (tx) => {
      await tx.splitMember.deleteMany({
        where: { expenseId },
      });

      return await tx.expense.update({
        where: { id: expenseId },
        data: {
          description,
          amount,
          paidById,
          category: category || "other",
          splits: {
            create: splits.map((s: { amount: number; memberId: string }) => ({
              amount: s.amount,
              memberId: s.memberId,
            })),
          },
        },
        include: {
          paidBy: true,
          splits: {
            include: { member: true },
          },
        },
      });
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}
