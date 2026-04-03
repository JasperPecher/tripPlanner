import { nanoid } from "nanoid";

export function generateShareCode(): string {
  return nanoid(10);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("de-DE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "Not set";
  return new Date(date).toLocaleString("de-DE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(
  amount: number,
  currency: string = "EUR",
): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}

export function calculateBalances(
  expenses: {
    paidById: string;
    amount: number;
    splits: { memberId: string; amount: number }[];
  }[],
  payments: { fromId: string; toId: string; amount: number }[] = [],
): Map<string, number> {
  const balances = new Map<string, number>();

  for (const expense of expenses) {
    balances.set(
      expense.paidById,
      (balances.get(expense.paidById) || 0) + expense.amount,
    );

    for (const split of expense.splits) {
      balances.set(
        split.memberId,
        (balances.get(split.memberId) || 0) - split.amount,
      );
    }
  }

  for (const payment of payments) {
    balances.set(
      payment.fromId,
      (balances.get(payment.fromId) || 0) + payment.amount,
    );
    balances.set(
      payment.toId,
      (balances.get(payment.toId) || 0) - payment.amount,
    );
  }

  return balances;
}

export function simplifyDebts(
  balances: Map<string, number>,
): { from: string; to: string; amount: number }[] {
  const debts: { from: string; to: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, balance] of balances) {
    if (balance < -0.01) {
      debtors.push({ id, amount: -balance });
    } else if (balance > 0.01) {
      creditors.push({ id, amount: balance });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.01) {
      debts.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return debts;
}

export function normalizeInputDate(s?: string): string {
  if (!s) return "";
  return s.replace(/\.\d+Z?$/, "").slice(0, 16);
}
