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
} from "lucide-react";
import { formatCurrency, calculateBalances, simplifyDebts } from "@/lib/utils";
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
  currency: string;
  category: string;
  createdAt: string;
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
  const [pieChartFilter, setPieChartFilter] = useState<string>(
    currentMember?.id || "overall",
  );
  const [filterPayerId, setFilterPayerId] = useState<string>("all");
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>("");

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
    amount: "",
    category: "other",
    paidById: currentMember?.id || members[0]?.id || "",
    splitType: "equal" as "equal" | "custom",
    splits: members.reduce(
      (acc, m) => ({ ...acc, [m.id]: true }),
      {} as Record<string, boolean>,
    ),
    customAmounts: members.reduce(
      (acc, m) => ({ ...acc, [m.id]: "" }),
      {} as Record<string, string>,
    ),
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
            margin={{ top: 20, right: 45, left: 45, bottom: 40 }}
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
    "w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none";

  const openEditForm = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    const isEqual = expense.splits.every(
      (s) => Math.abs(s.amount - expense.amount / expense.splits.length) < 0.02,
    );
    setFormData({
      description: expense.description,
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
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingExpenseId(null);
    setFormData({
      description: "",
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
    });
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        alert(t.common.error);
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-70 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                {editingExpenseId ? "Edit Expense" : t.expenses.form.addTitle}
              </h3>
              <button
                onClick={closeForm}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t.expenses.form.description}
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={inputClasses}
                  placeholder={t.expenses.form.descriptionPlaceholder}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.expenses.form.amount}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className={inputClasses}
                    placeholder="0.00"
                  />
                </div>
                <div>
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
                <div className="w-max">
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
                    <option value="other">{t.expenses.categories.other}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  {t.expenses.form.splitType}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="splitType"
                      checked={formData.splitType === "equal"}
                      onChange={() =>
                        setFormData({ ...formData, splitType: "equal" })
                      }
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm dark:text-stone-300">
                      {t.expenses.form.equalSplit}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="splitType"
                      checked={formData.splitType === "custom"}
                      onChange={() =>
                        setFormData({ ...formData, splitType: "custom" })
                      }
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm dark:text-stone-300">
                      {t.expenses.form.customAmounts}
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  {t.expenses.form.splitBetween}
                </label>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 py-2 px-3 bg-stone-50 dark:bg-stone-800 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={formData.splits[member.id]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            splits: {
                              ...formData.splits,
                              [member.id]: e.target.checked,
                            },
                          })
                        }
                        className="text-orange-500 focus:ring-orange-500 rounded"
                      />
                      <span className="flex-1 text-sm font-medium dark:text-white">
                        {member.name}
                      </span>
                      {formData.splitType === "custom" &&
                        formData.splits[member.id] && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.customAmounts[member.id]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customAmounts: {
                                  ...formData.customAmounts,
                                  [member.id]: e.target.value,
                                },
                              })
                            }
                            className="w-24 px-2 py-1 border border-stone-300 dark:border-stone-600 rounded text-sm bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
                            placeholder="0.00"
                          />
                        )}
                      {formData.splitType === "equal" &&
                        formData.splits[member.id] &&
                        formData.amount && (
                          <span className="text-sm text-stone-500 dark:text-stone-400">
                            {formatCurrency(
                              parseFloat(formData.amount) /
                                members.filter((m) => formData.splits[m.id])
                                  .length,
                            )}
                          </span>
                        )}
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
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
                        {t.expenseSummary.payWero} (Empfohlen)
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
                      className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:underline"
                    >
                      <CheckCircle className="w-3 h-3" />
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
                <span className="text-xs text-stone-400" suppressHydrationWarning>
                  {new Date(payment.createdAt).toLocaleDateString()}
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
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-auto flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder={t.expenses.search}
              value={filterSearchQuery}
              onChange={(e) => setFilterSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={filterPayerId}
              onChange={(e) => setFilterPayerId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
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
                        {formatCurrency(expense.amount, expense.currency)}
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
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1" suppressHydrationWarning>
                      {new Date(expense.createdAt).toLocaleDateString()}
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
