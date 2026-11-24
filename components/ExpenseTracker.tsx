"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Receipt,
  ArrowRight,
  X,
  Loader2,
  Wallet,
  ExternalLink,
  CreditCard,
  Users,
  CheckCircle,
  Pencil,
  PieChart as PieChartIcon,
  BadgeEuro,
  Search,
  Filter,
  Percent,
  RotateCcw,
} from "lucide-react";
import {
  formatDate,
  formatCurrency,
  calculateBalances,
  simplifyDebts,
} from "@/lib/utils";
import { useLocale } from "@/lib/LocaleContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

type Member = {
  id: string;
  name: string;
  joinedAt: string;
  paypalLink?: string | null;
  weroNumber?: string | null;
};
type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  createdAt: string;
  date: string;
  paidById: string;
  paidBy: Member;
  splits: { id: string; amount: number; memberId: string; member: Member }[];
};
type Payment = {
  id: string;
  amount: number;
  createdAt: string;
  fromId: string;
  toId: string;
  from: Member;
  to: Member;
};

interface ExpenseTrackerProps {
  tripId: string;
  members: Member[];
  expenses: Expense[];
  payments: Payment[];
  currentMember: Member | null;
}

const CHART_COLORS = [
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

function calculateEqualPercentages(
  memberIds: string[],
): Record<string, number> {
  if (memberIds.length === 0) return {};
  const count = memberIds.length;
  const baseShare = Math.floor(100 / count);
  const remainder = 100 - baseShare * count;
  const result: Record<string, number> = {};
  memberIds.forEach((id, index) => {
    const add = index < remainder ? 1 : 0;
    result[id] = baseShare + add;
  });
  return result;
}

export function ExpenseTracker({
  tripId,
  members,
  expenses: initialExpenses,
  payments: initialPayments,
  currentMember,
}: ExpenseTrackerProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [payments, setPayments] = useState(initialPayments);
  const [showForm, setShowForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [percentageInputs, setPercentageInputs] = useState<
    Record<string, string>
  >(() => {
    const initialMap = calculateEqualPercentages(members.map((m) => m.id));
    const inputs: Record<string, string> = {};
    Object.entries(initialMap).forEach(([id, val]) => {
      inputs[id] = val.toString();
    });
    return inputs;
  });
  const [pieChartFilter, setPieChartFilter] = useState<string>(
    currentMember?.id || "overall",
  );
  const [filterPayerId, setFilterPayerId] = useState<string>("all");
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>("");
  const [payingDebtKey, setPayingDebtKey] = useState<string | null>(null);

  const filteredExpensesList = useMemo(() => {
    return expenses.filter((expense) => {
      const matchPayer =
        filterPayerId === "all" || expense.paidById === filterPayerId;
      const matchSearch = expense.description
        .toLowerCase()
        .includes(filterSearchQuery.toLowerCase());
      return matchPayer && matchSearch;
    });
  }, [expenses, filterPayerId, filterSearchQuery]);

  const [formData, setFormData] = useState({
    description: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "other",
    paidById: currentMember?.id || members[0]?.id || "",
    splitType: "equal" as "equal" | "custom" | "percentage",
    splits: members.reduce(
      (acc, m) => ({ ...acc, [m.id]: true }),
      {} as Record<string, boolean>,
    ),
    customAmounts: members.reduce(
      (acc, m) => ({ ...acc, [m.id]: "" }),
      {} as Record<string, string>,
    ),
    customPercentages: calculateEqualPercentages(members.map((m) => m.id)),
  });

  const balances = useMemo(
    () =>
      calculateBalances(
        expenses.map((e) => ({
          paidById: e.paidById,
          amount: e.amount,
          splits: e.splits.map((s) => ({
            memberId: s.memberId,
            amount: s.amount,
          })),
        })),
        payments.map((p) => ({
          fromId: p.fromId,
          toId: p.toId,
          amount: p.amount,
        })),
      ),
    [expenses, payments],
  );

  const debts = useMemo(() => simplifyDebts(balances), [balances]);

  const memberTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const expense of expenses) {
      totals.set(
        expense.paidById,
        (totals.get(expense.paidById) || 0) + expense.amount,
      );
    }
    return totals;
  }, [expenses]);

  const pieChartData = useMemo(() => {
    const categoryTotals = new Map<string, number>();

    expenses.forEach((expense) => {
      const cat = expense.category || "other";
      if (pieChartFilter === "overall") {
        categoryTotals.set(
          cat,
          (categoryTotals.get(cat) || 0) + expense.amount,
        );
      } else {
        const userSplit = expense.splits.find(
          (s) => s.memberId === pieChartFilter,
        );
        if (userSplit) {
          categoryTotals.set(
            cat,
            (categoryTotals.get(cat) || 0) + userSplit.amount,
          );
        }
      }
    });

    const data = Array.from(categoryTotals.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return data;
  }, [expenses, pieChartFilter]);

  const totalExpensesAmount = useMemo(() => {
    return pieChartData.reduce((sum, item) => sum + item.value, 0);
  }, [pieChartData]);

  const chartMarkup = useMemo(() => {
    if (pieChartData.length === 0) {
      return (
        <div className="h-64 w-full flex items-center justify-center text-sm text-stone-500 dark:text-stone-400">
          Keine Ausgaben
        </div>
      );
    }
    return (
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart
            key={pieChartFilter}
            margin={{ top: 40, right: 45, left: 45, bottom: 20 }}
          >
            <Pie
              data={pieChartData}
              cx="50%"
              cy="42%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              animationDuration={1000}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                value,
                name,
              }: any) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 20;
                const safeMidAngle = midAngle || 0;
                const x = cx + radius * Math.cos(-safeMidAngle * RADIAN);
                const y = cy + radius * Math.sin(-safeMidAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill="currentColor"
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    className="text-[10px] sm:text-xs font-medium dark:text-stone-300"
                  >
                    <tspan x={x} dy="-0.6em">
                      {t.expenses.categories[
                        name as keyof typeof t.expenses.categories
                      ] || name}
                    </tspan>
                    <tspan x={x} dy="1.2em">
                      {formatCurrency(value)}
                    </tspan>
                  </text>
                );
              }}
              labelLine={true}
            >
              {pieChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Legend
              formatter={(value) =>
                t.expenses.categories[
                  value as keyof typeof t.expenses.categories
                ] || value
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieChartData, pieChartFilter]);

  const inputClasses =
    "w-full px-4 py-2.5 text-base sm:text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-colors";

  const applyCascadePercentages = (memberId: string, rawNewValue: number) => {
    const selected = members.filter((m) => formData.splits[m.id]);
    if (selected.length <= 1) {
      if (selected.length === 1) {
        const onlyId = selected[0].id;
        setFormData((prev) => ({
          ...prev,
          customPercentages: { ...prev.customPercentages, [onlyId]: 100 },
        }));
        setPercentageInputs((prev) => ({ ...prev, [onlyId]: "100" }));
      }
      return;
    }

    const memberIndex = selected.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) return;

    const newPercentages = { ...formData.customPercentages };
    const newInputs = { ...percentageInputs };

    if (memberIndex === selected.length - 1) {
      // Last member: adjust with the member directly above it
      const prevMember = selected[memberIndex - 1];
      let sumBeforePrev = 0;
      for (let i = 0; i < memberIndex - 1; i++) {
        sumBeforePrev += newPercentages[selected[i].id] || 0;
      }
      const maxForLast = Math.max(0, 100 - sumBeforePrev);
      const clampedLast = Math.max(
        0,
        Math.min(maxForLast, Math.round(rawNewValue)),
      );
      newPercentages[memberId] = clampedLast;
      newInputs[memberId] = clampedLast.toString();

      const prevVal = 100 - sumBeforePrev - clampedLast;
      newPercentages[prevMember.id] = prevVal;
      newInputs[prevMember.id] = prevVal.toString();
    } else {
      // Members below memberIndex get adapted
      let sumBefore = 0;
      for (let i = 0; i < memberIndex; i++) {
        sumBefore += newPercentages[selected[i].id] || 0;
      }

      const maxForMember = Math.max(0, 100 - sumBefore);
      const clampedVal = Math.max(
        0,
        Math.min(maxForMember, Math.round(rawNewValue)),
      );
      newPercentages[memberId] = clampedVal;
      newInputs[memberId] = clampedVal.toString();

      const remaining = 100 - sumBefore - clampedVal;
      const lowerMembers = selected.slice(memberIndex + 1);
      const lowerCount = lowerMembers.length;

      const baseShare = Math.floor(remaining / lowerCount);
      const remainder = remaining - baseShare * lowerCount;

      lowerMembers.forEach((m, idx) => {
        const val = baseShare + (idx < remainder ? 1 : 0);
        newPercentages[m.id] = val;
        newInputs[m.id] = val.toString();
      });
    }

    setFormData((prev) => ({ ...prev, customPercentages: newPercentages }));
    setPercentageInputs(newInputs);
  };

  const handlePercentageSliderChange = (
    memberId: string,
    rawNewValue: number,
  ) => {
    applyCascadePercentages(memberId, rawNewValue);
  };

  const handlePercentageInputChange = (
    memberId: string,
    valueStr: string,
  ) => {
    const cleanStr = valueStr.replace(/[^0-9]/g, "");
    setPercentageInputs((prev) => ({ ...prev, [memberId]: cleanStr }));
    if (cleanStr !== "") {
      const parsed = parseInt(cleanStr, 10);
      if (!isNaN(parsed)) {
        applyCascadePercentages(memberId, parsed);
      }
    }
  };

  const handlePercentageInputBlur = (memberId: string) => {
    const raw = percentageInputs[memberId];
    const parsed = parseInt(raw, 10);
    const fallback = formData.customPercentages[memberId] ?? 0;
    const finalVal = isNaN(parsed) ? fallback : parsed;
    applyCascadePercentages(memberId, finalVal);
  };

  const handleEqualize = () => {
    const selected = members.filter((m) => formData.splits[m.id]);
    const equalMap = calculateEqualPercentages(selected.map((m) => m.id));
    const nextPercentages = { ...formData.customPercentages, ...equalMap };
    const nextInputs = { ...percentageInputs };
    Object.entries(equalMap).forEach(([id, val]) => {
      nextInputs[id] = val.toString();
    });
    setPercentageInputs(nextInputs);
    setFormData((prev) => ({ ...prev, customPercentages: nextPercentages }));
  };

  const handleTakeCustomRemainder = (memberId: string) => {
    if (customSplitDiff <= 0.01) return;
    const cur = parseFloat(formData.customAmounts[memberId]) || 0;
    const nextVal = Math.round((cur + customSplitDiff) * 100) / 100;
    setFormData({
      ...formData,
      customAmounts: {
        ...formData.customAmounts,
        [memberId]: nextVal.toFixed(2),
      },
    });
  };

  const handleSelectSplitType = (
    newType: "equal" | "custom" | "percentage",
  ) => {
    if (newType === "percentage") {
      const selected = members.filter((m) => formData.splits[m.id]);
      const currentSum = selected.reduce(
        (sum, m) => sum + (formData.customPercentages[m.id] || 0),
        0,
      );
      if (currentSum !== 100) {
        const equalMap = calculateEqualPercentages(selected.map((m) => m.id));
        const nextPercentages = { ...formData.customPercentages, ...equalMap };
        const nextInputs = { ...percentageInputs };
        Object.entries(equalMap).forEach(([id, val]) => {
          nextInputs[id] = val.toString();
        });
        setPercentageInputs(nextInputs);
        setFormData({
          ...formData,
          splitType: newType,
          customPercentages: nextPercentages,
        });
        return;
      }
    }
    setFormData({ ...formData, splitType: newType });
  };

  const handleToggleMember = (memberId: string, checked: boolean) => {
    const newSplits = { ...formData.splits, [memberId]: checked };
    const selected = members.filter((m) => newSplits[m.id]);

    if (formData.splitType === "percentage" && selected.length > 0) {
      const equalMap = calculateEqualPercentages(selected.map((m) => m.id));
      const nextPercentages = { ...formData.customPercentages, ...equalMap };
      const nextInputs = { ...percentageInputs };
      Object.entries(equalMap).forEach(([id, val]) => {
        nextInputs[id] = val.toString();
      });
      setPercentageInputs(nextInputs);
      setFormData({
        ...formData,
        splits: newSplits,
        customPercentages: nextPercentages,
      });
    } else {
      setFormData({
        ...formData,
        splits: newSplits,
      });
    }
  };

  const handleSelectAllMembers = (selectAll: boolean) => {
    const newSplits: Record<string, boolean> = {};
    members.forEach((m) => {
      newSplits[m.id] = selectAll;
    });
    if (formData.splitType === "percentage" && selectAll) {
      const equalMap = calculateEqualPercentages(members.map((m) => m.id));
      const nextPercentages = { ...formData.customPercentages, ...equalMap };
      const nextInputs = { ...percentageInputs };
      Object.entries(equalMap).forEach(([id, val]) => {
        nextInputs[id] = val.toString();
      });
      setPercentageInputs(nextInputs);
      setFormData({
        ...formData,
        splits: newSplits,
        customPercentages: nextPercentages,
      });
    } else {
      setFormData({
        ...formData,
        splits: newSplits,
      });
    }
  };

  const openEditForm = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    const isEqual = expense.splits.every(
      (s) => Math.abs(s.amount - expense.amount / expense.splits.length) < 0.02,
    );
    const rawPercentages = members.map((m) => {
      const split = expense.splits.find((s) => s.memberId === m.id);
      return {
        id: m.id,
        val: split ? Math.round((split.amount / expense.amount) * 100) : 0,
        isSplit: !!split,
      };
    });
    const splitMembers = rawPercentages.filter((r) => r.isSplit);
    const sum = splitMembers.reduce((acc, r) => acc + r.val, 0);
    if (splitMembers.length > 0 && sum !== 100) {
      const largest = splitMembers.reduce(
        (max, r) => (r.val > max.val ? r : max),
        splitMembers[0],
      );
      largest.val += 100 - sum;
    }
    const percentagesMap: Record<string, number> = {};
    rawPercentages.forEach((r) => {
      percentagesMap[r.id] = r.val;
    });
    const inputs: Record<string, string> = {};
    Object.entries(percentagesMap).forEach(([id, val]) => {
      inputs[id] = val.toString();
    });
    setPercentageInputs(inputs);

    setFormData({
      description: expense.description,
      date: new Date(expense.date).toISOString().split("T")[0],
      amount: expense.amount.toString(),
      category: expense.category || "other",
      paidById: expense.paidById,
      splitType: isEqual ? "equal" : "custom",
      splits: members.reduce(
        (acc, m) => ({
          ...acc,
          [m.id]: expense.splits.some((s) => s.memberId === m.id),
        }),
        {} as Record<string, boolean>,
      ),
      customAmounts: members.reduce(
        (acc, m) => {
          const split = expense.splits.find((s) => s.memberId === m.id);
          return { ...acc, [m.id]: split ? split.amount.toString() : "" };
        },
        {} as Record<string, string>,
      ),
      customPercentages: percentagesMap,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingExpenseId(null);
    const initialPercentages = calculateEqualPercentages(
      members.map((m) => m.id),
    );
    setFormData({
      description: "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      category: "other",
      paidById: currentMember?.id || members[0]?.id || "",
      splitType: "equal",
      splits: members.reduce(
        (acc, m) => ({ ...acc, [m.id]: true }),
        {} as Record<string, boolean>,
      ),
      customAmounts: members.reduce(
        (acc, m) => ({ ...acc, [m.id]: "" }),
        {} as Record<string, string>,
      ),
      customPercentages: initialPercentages,
    });
    const inputs: Record<string, string> = {};
    Object.entries(initialPercentages).forEach(([id, val]) => {
      inputs[id] = val.toString();
    });
    setPercentageInputs(inputs);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        alert(t.common.error);
        setLoading(false);
        return;
      }
      if (!formData.date) {
        alert(t.common.error);
        setLoading(false);
        return;
      }
      const selectedMembers = members.filter((m) => formData.splits[m.id]);
      if (selectedMembers.length === 0) {
        alert(t.common.error);
        return;
      }
      let splits: { memberId: string; amount: number }[];
      if (formData.splitType === "equal") {
        const splitAmount = amount / selectedMembers.length;
        splits = selectedMembers.map((m) => ({
          memberId: m.id,
          amount: Math.round(splitAmount * 100) / 100,
        }));
        const totalCalculated = splits.reduce((sum, s) => sum + s.amount, 0);
        const centDiff = Math.round((amount - totalCalculated) * 100) / 100;
        if (Math.abs(centDiff) > 0.001 && splits.length > 0) {
          splits[0].amount =
            Math.round((splits[0].amount + centDiff) * 100) / 100;
        }
      } else if (formData.splitType === "percentage") {
        if (isPercentageSplitInvalid) {
          alert(t.expenses.form.percentageMustBe100);
          setLoading(false);
          return;
        }
        splits = selectedMembers.map((m) => ({
          memberId: m.id,
          amount:
            Math.round(
              ((formData.customPercentages[m.id] || 0) / 100) * amount * 100,
            ) / 100,
        }));

        const totalCustom = splits.reduce((sum, s) => sum + s.amount, 0);
        const centDiff = Math.round((amount - totalCustom) * 100) / 100;
        if (Math.abs(centDiff) > 0.001 && splits.length > 0) {
          // Adjust cent difference on the split with largest amount
          const largestSplit = splits.reduce(
            (max, s) => (s.amount > max.amount ? s : max),
            splits[0],
          );
          largestSplit.amount =
            Math.round((largestSplit.amount + centDiff) * 100) / 100;
        }
      } else {
        splits = selectedMembers.map((m) => ({
          memberId: m.id,
          amount: parseFloat(formData.customAmounts[m.id]) || 0,
        }));
        const totalCustom = splits.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(totalCustom - amount) > 0.01) {
          alert(t.common.error);
          setLoading(false);
          return;
        }
      }

      const url = editingExpenseId
        ? `/api/trips/${tripId}/expenses/${editingExpenseId}`
        : `/api/trips/${tripId}/expenses`;
      const method = editingExpenseId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.description,
          date: formData.date,
          amount,
          category: formData.category,
          paidById: formData.paidById,
          splits,
        }),
      });
      if (response.ok) {
        const savedExpense = await response.json();
        if (editingExpenseId) {
          setExpenses(
            expenses.map((e) => (e.id === editingExpenseId ? savedExpense : e)),
          );
        } else {
          setExpenses([savedExpense, ...expenses]);
        }
        router.refresh();
        closeForm();
      } else {
        const data = await response.json();
        alert(data.error || t.common.error);
      }
    } catch (error) {
      alert(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Ausgabe löschen?")) return;
    try {
      const response = await fetch(
        `/api/trips/${tripId}/expenses/${expenseId}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setExpenses(expenses.filter((e) => e.id !== expenseId));
        router.refresh();
      }
    } catch (error) {
      alert(t.common.error);
    }
  };

  const handlePayDebt = async (debt: {
    from: string;
    to: string;
    amount: number;
  }) => {
    const debtKey = `${debt.from}-${debt.to}`;
    setPayingDebtKey(debtKey);
    try {
      const response = await fetch(`/api/trips/${tripId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromId: debt.from,
          toId: debt.to,
          amount: debt.amount,
        }),
      });
      if (response.ok) {
        const newPayment = await response.json();
        setPayments([newPayment, ...payments]);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to record payment:", error);
    } finally {
      setPayingDebtKey(null);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm(t.expenseSummary.confirmDeletePayment)) return;
    try {
      const response = await fetch(
        `/api/trips/${tripId}/payments?paymentId=${paymentId}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        setPayments(payments.filter((p) => p.id !== paymentId));
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete payment:", error);
    }
  };

  const selectedMembers = useMemo(
    () => members.filter((m) => formData.splits[m.id]),
    [members, formData.splits],
  );

  const parsedAmount = parseFloat(formData.amount) || 0;

  const customTotal = useMemo(
    () =>
      selectedMembers.reduce(
        (sum, m) => sum + (parseFloat(formData.customAmounts[m.id]) || 0),
        0,
      ),
    [selectedMembers, formData.customAmounts],
  );

  const customSplitDiff = Math.round((parsedAmount - customTotal) * 100) / 100;
  const isCustomSplitInvalid =
    formData.splitType === "custom" && Math.abs(customSplitDiff) > 0.01;

  const percentageTotal = useMemo(
    () =>
      selectedMembers.reduce(
        (sum, m) => sum + (formData.customPercentages[m.id] || 0),
        0,
      ),
    [selectedMembers, formData.customPercentages],
  );

  const percentageDiff = 100 - percentageTotal;
  const isPercentageSplitInvalid =
    formData.splitType === "percentage" && percentageDiff !== 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Receipt className="w-6 h-6 text-orange-500" />
          {t.expenses.title}
        </h2>
        <button
          onClick={() => {
            setEditingExpenseId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t.expenses.addExpense}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-200 bg-black/60 backdrop-blur-xs flex flex-col sm:items-center justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-stone-900 w-full h-[95dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in sm:zoom-in-95 duration-200">
            {/* Mobile pull indicator */}
            <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                {editingExpenseId
                  ? t.expenses.form.editTitle
                  : t.expenses.form.addTitle}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="p-2 -mr-2 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form scroll area */}
            <form
              onSubmit={handleSubmitExpense}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="w-full min-w-0">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      {t.expenses.form.description}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className={inputClasses}
                      placeholder={t.expenses.form.descriptionPlaceholder}
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      {t.expenses.form.date || "Datum"}
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData({ ...formData, date: e.target.value });
                        }
                      }}
                      style={{
                        WebkitAppearance: "none",
                        width: "100%",
                        maxWidth: "100%",
                        display: "block",
                      }}
                      className={`${inputClasses} min-h-11 [&::-webkit-clear-button]:hidden [&::-webkit-inner-spin-button]:appearance-none min-w-0`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="min-w-0 w-full">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      {t.expenses.form.amount}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        required
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        className={`${inputClasses} pr-8 font-semibold`}
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium">
                        €
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      {t.expenses.form.paidBy}
                    </label>
                    <select
                      value={formData.paidById}
                      onChange={(e) =>
                        setFormData({ ...formData, paidById: e.target.value })
                      }
                      className={inputClasses}
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      {t.expenses.category}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className={inputClasses}
                    >
                      <option value="food">{t.expenses.categories.food}</option>
                      <option value="transport">
                        {t.expenses.categories.transport}
                      </option>
                      <option value="accommodation">
                        {t.expenses.categories.accommodation}
                      </option>
                      <option value="activity">
                        {t.expenses.categories.activity}
                      </option>
                      <option value="shopping">
                        {t.expenses.categories.shopping}
                      </option>
                      <option value="other">
                        {t.expenses.categories.other}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Split Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    {t.expenses.form.splitType}
                  </label>
                  <div className="grid grid-cols-3 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectSplitType("equal")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                        formData.splitType === "equal"
                          ? "bg-white dark:bg-stone-700 text-orange-600 dark:text-orange-400 shadow-xs"
                          : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                      }`}
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {t.expenses.form.equalSplit}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSplitType("percentage")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                        formData.splitType === "percentage"
                          ? "bg-white dark:bg-stone-700 text-orange-600 dark:text-orange-400 shadow-xs"
                          : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                      }`}
                    >
                      <Percent className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {t.expenses.form.percentageSplit}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSplitType("custom")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                        formData.splitType === "custom"
                          ? "bg-white dark:bg-stone-700 text-orange-600 dark:text-orange-400 shadow-xs"
                          : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                      }`}
                    >
                      <BadgeEuro className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {t.expenses.form.customAmounts}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Percentage Status Toolbar (when percentage mode is active) */}
                {formData.splitType === "percentage" && (
                  <div className="space-y-2 p-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {t.expenses.form.totalPercentage || "Total:"}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                            percentageDiff === 0
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : percentageDiff > 0
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                          }`}
                        >
                          {percentageTotal}%{" "}
                          {percentageDiff === 0
                            ? "✓"
                            : percentageDiff > 0
                              ? `(-${percentageDiff}%)`
                              : `(+${Math.abs(percentageDiff)}%)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={handleEqualize}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors flex items-center gap-1 cursor-pointer"
                          title={
                            t.expenses.form.splitEqually || "Split equally"
                          }
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t.expenses.form.splitEqually || "Equal"}</span>
                        </button>
                      </div>
                    </div>
                    {/* Progress track */}
                    <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percentageDiff === 0
                            ? "bg-emerald-500"
                            : percentageDiff > 0
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, percentageTotal))}%`,
                        }}
                      />
                    </div>
                    {percentageDiff !== 0 && (
                      <p
                        className={`text-xs font-medium ${
                          percentageDiff > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {percentageDiff > 0
                          ? `${t.expenses.form.missingAmount || "Remaining:"} ${percentageDiff}%`
                          : `${t.expenses.form.overAmount || "Over by:"} ${Math.abs(percentageDiff)}%`}
                      </p>
                    )}
                  </div>
                )}

                {/* Custom Split Difference status */}
                {formData.splitType === "custom" && isCustomSplitInvalid && (
                  <div
                    className={`text-xs sm:text-sm p-2.5 rounded-lg font-medium ${
                      customSplitDiff > 0
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    {customSplitDiff > 0
                      ? `${t.expenses.form.missingAmount || "Remaining:"} ${formatCurrency(customSplitDiff)}`
                      : `${t.expenses.form.overAmount || "Over by:"} ${formatCurrency(Math.abs(customSplitDiff))}`}
                  </div>
                )}

                {/* Member selection & split details */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t.expenses.form.splitBetween} ({selectedMembers.length}/
                      {members.length})
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSelectAllMembers(true)}
                        className="text-orange-600 dark:text-orange-400 hover:underline font-medium cursor-pointer"
                      >
                        {t.expenses.form.selectAll || "All"}
                      </button>
                      <span className="text-stone-300 dark:text-stone-600">
                        •
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectAllMembers(false)}
                        className="text-stone-500 dark:text-stone-400 hover:underline cursor-pointer"
                      >
                        {t.expenses.form.deselectAll || "None"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {members.map((member) => {
                      const isSelected = !!formData.splits[member.id];
                      const currentPercentage =
                        formData.customPercentages[member.id] || 0;
                      const memberSplitAmount =
                        formData.splitType === "equal"
                          ? parsedAmount / Math.max(1, selectedMembers.length)
                          : formData.splitType === "percentage"
                            ? (currentPercentage / 100) * parsedAmount
                            : parseFloat(formData.customAmounts[member.id]) ||
                              0;

                      if (!isSelected) {
                        return (
                          <div
                            key={member.id}
                            onClick={() => handleToggleMember(member.id, true)}
                            className="flex items-center gap-3 py-2 px-3 bg-stone-50/60 dark:bg-stone-800/40 rounded-xl border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition-colors opacity-50 hover:opacity-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => {}}
                              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 pointer-events-none"
                            />
                            <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 flex items-center justify-center text-xs font-semibold shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-stone-500 dark:text-stone-400 truncate">
                              {member.name}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={member.id}
                          className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 transition-all shadow-2xs"
                        >
                          {/* Member Row Header */}
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={(e) =>
                                handleToggleMember(member.id, e.target.checked)
                              }
                              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 cursor-pointer"
                            />
                            <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-semibold shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                              {member.name}
                            </span>
                            <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 ml-auto shrink-0">
                              {parsedAmount > 0
                                ? formatCurrency(memberSplitAmount)
                                : formData.splitType === "percentage"
                                  ? `${currentPercentage}%`
                                  : "0,00 €"}
                            </span>
                          </div>

                          {/* Controls for Percentage Split */}
                          {formData.splitType === "percentage" && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={currentPercentage}
                                onChange={(e) =>
                                  handlePercentageSliderChange(
                                    member.id,
                                    parseFloat(e.target.value),
                                  )
                                }
                                className="flex-1 h-2.5 bg-stone-200 dark:bg-stone-700 rounded-lg accent-orange-500 cursor-pointer touch-none"
                                aria-label={`${member.name} percentage`}
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={
                                    percentageInputs[member.id] ??
                                    currentPercentage.toString()
                                  }
                                  onChange={(e) =>
                                    handlePercentageInputChange(
                                      member.id,
                                      e.target.value,
                                    )
                                  }
                                  onBlur={() =>
                                    handlePercentageInputBlur(member.id)
                                  }
                                  className="w-16 sm:w-20 px-2 py-1 text-right text-base sm:text-sm font-semibold border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                                <span className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
                                  %
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Controls for Custom Split */}
                          {formData.splitType === "custom" && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                              <div className="flex-1" />
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  inputMode="decimal"
                                  value={
                                    formData.customAmounts[member.id] || ""
                                  }
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      customAmounts: {
                                        ...formData.customAmounts,
                                        [member.id]: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="0.00"
                                  className="w-24 px-2 py-1 text-right text-base sm:text-sm font-semibold border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                                <span className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
                                  €
                                </span>
                              </div>
                              {customSplitDiff > 0.01 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleTakeCustomRemainder(member.id)
                                  }
                                  className="text-xs px-2 py-1 rounded-md bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/80 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-300 font-medium shrink-0 transition-colors cursor-pointer"
                                  title={
                                    t.expenses.form.takeRemaining ||
                                    "Take remainder"
                                  }
                                >
                                  +{formatCurrency(customSplitDiff)}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sticky Modal Footer with Submit Button */}
              <div className="sticky bottom-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs px-4 sm:px-6 py-3 sm:py-4 border-t border-stone-200 dark:border-stone-800 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    isCustomSplitInvalid ||
                    isPercentageSplitInvalid ||
                    !formData.date ||
                    !formData.description.trim() ||
                    parsedAmount <= 0 ||
                    selectedMembers.length === 0
                  }
                  className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : editingExpenseId ? (
                    "Save Changes"
                  ) : (
                    t.expenses.form.addButton
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {expenses.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 shadow-sm border border-stone-200 dark:border-stone-800">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            {t.expenseSummary.title}
          </h3>
          <div className="space-y-2">
            {members.map((member) => {
              const total = memberTotals.get(member.id) || 0;
              const balance = balances.get(member.id) || 0;
              return (
                <div
                  key={member.id}
                  className="py-2 px-3 bg-stone-50 dark:bg-stone-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3 text-sm">
                    <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-medium shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-stone-900 dark:text-white truncate">
                      {member.name}
                    </span>
                    <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
                      <span className="text-stone-500 dark:text-stone-400 hidden sm:inline">
                        {t.expenseSummary.totalSpent}:{" "}
                        <span className="font-medium text-stone-700 dark:text-stone-300">
                          {formatCurrency(total)}
                        </span>
                      </span>
                      <span
                        className={`font-semibold ${balance > 0.01 ? "text-green-600 dark:text-green-400" : balance < -0.01 ? "text-red-600 dark:text-red-400" : "text-stone-400"}`}
                      >
                        {balance > 0.01 ? "+" : ""}
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  </div>
                  {member.weroNumber && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(member.weroNumber!);
                        alert(t.common.copied);
                      }}
                      className="mt-1 flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 hover:underline "
                    >
                      <CreditCard className="w-3 h-3" />
                      WERO: {member.weroNumber}
                      <span className="opacity-70 ml-1">{t.common.copy}</span>
                    </button>
                  )}
                  {member.paypalLink && (
                    <a
                      href={member.paypalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <CreditCard className="w-3 h-3" />
                      PayPal:{" "}
                      {member.paypalLink
                        .replace(/^https?:\/\//, "")
                        .replace(/\/$/, "")}
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {debts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
          <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
            <BadgeEuro className="w-5 h-5" />
            {t.expenses.whoOwes}
          </h3>
          <div className="space-y-2">
            {debts.map((debt, idx) => {
              const from = members.find((m) => m.id === debt.from);
              const to = members.find((m) => m.id === debt.to);
              const debtKey = `${debt.from}-${debt.to}`;
              const isPayingThisDebt = payingDebtKey === debtKey;

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-stone-800 rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="font-medium text-amber-900 dark:text-amber-300">
                      {from?.name}
                    </span>
                    <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span className="font-medium text-amber-900 dark:text-amber-300">
                      {to?.name}
                    </span>
                    <span className="ml-auto font-semibold text-amber-700 dark:text-amber-400">
                      {formatCurrency(debt.amount)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                    {to?.weroNumber && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(to.weroNumber!);
                          alert(t.common.copied);
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded"
                      >
                        <CreditCard className="w-3 h-3" />
                        {t.expenseSummary.payWero}
                      </button>
                    )}
                    {to?.paypalLink && (
                      <a
                        href={`${to.paypalLink.replace(/\/$/, "")}/${debt.amount}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <CreditCard className="w-3 h-3" />
                        {t.expenseSummary.payVia} PayPal ({to.name})
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    )}
                    <button
                      onClick={() => handlePayDebt(debt)}
                      disabled={Boolean(payingDebtKey)}
                      className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isPayingThisDebt ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {t.expenseSummary.markAsPaid}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <h3 className="font-semibold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {t.expenseSummary.paymentHistory}
          </h3>
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center gap-2 text-sm bg-white dark:bg-stone-800 rounded-lg px-3 py-2 group"
              >
                <span className="font-medium text-green-900 dark:text-green-300">
                  {payment.from.name}
                </span>
                <ArrowRight className="w-3 h-3 text-green-600 dark:text-green-500" />
                <span className="font-medium text-green-900 dark:text-green-300">
                  {payment.to.name}
                </span>
                <span className="ml-auto font-semibold text-green-700 dark:text-green-400">
                  {formatCurrency(payment.amount)}
                </span>
                <span
                  className="text-xs text-stone-400"
                  suppressHydrationWarning
                >
                  {formatDate(payment.createdAt)}
                </span>
                <button
                  onClick={() => handleDeletePayment(payment.id)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 shadow-sm border border-stone-200 dark:border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="flex flex-col">
              <h3 className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-orange-500" />
                {t.expenses.breakdown}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                {t.expenses.total}:{" "}
                <span className="font-medium text-stone-700 dark:text-stone-300">
                  {formatCurrency(totalExpensesAmount)}
                </span>
              </p>
            </div>

            <select
              value={pieChartFilter}
              onChange={(e) => setPieChartFilter(e.target.value)}
              className="px-3 py-1.5 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 min-w-35"
            >
              <option value="overall">{t.expenses.total}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {chartMarkup}
        </div>
      )}

      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div className="relative w-full sm:w-auto flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t.expenses.search}
              value={filterSearchQuery}
              onChange={(e) => setFilterSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <select
              value={filterPayerId}
              onChange={(e) => setFilterPayerId(e.target.value)}
              className="w-full sm:w-auto pl-9 pr-8 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">{t.expenses.allPayers}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredExpensesList.length === 0 ? (
          <div className="p-8 text-center text-stone-500 dark:text-stone-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-stone-600" />
            <p>
              {expenses.length === 0
                ? t.expenses.noExpenses
                : "Keine Ausgaben gefunden"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {filteredExpensesList.map((expense) => (
              <div
                key={expense.id}
                className="p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-stone-900 dark:text-white">
                        {expense.description}
                      </h4>
                      <span className="text-lg font-semibold text-stone-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {
                          t.expenses.categories[
                            (expense.category ||
                              "other") as keyof typeof t.expenses.categories
                          ]
                        }
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                      {t.expenses.paidBy}{" "}
                      <span className="font-medium">{expense.paidBy.name}</span>{" "}
                      &middot; {t.expenses.splitBetween}{" "}
                      {expense.splits.map((s) => s.member.name).join(", ")}
                    </p>
                    <p
                      className="text-xs text-stone-400 dark:text-stone-500 mt-1"
                      suppressHydrationWarning
                    >
                      {formatDate(expense.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(expense)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition p-1"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-stone-400 hover:text-red-500 transition p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
