"use client";

import { useState, useMemo } from "react";
import { Plus, Receipt, ArrowRight, X, Loader2, TrendingUp, Wallet } from "lucide-react";
import { formatCurrency, calculateBalances, simplifyDebts } from "@/lib/utils";
import { useLocale } from "@/lib/LocaleContext";

type Member = { id: string; name: string; isAdmin: boolean; joinedAt: string };
type Expense = {
  id: string; description: string; amount: number; currency: string; createdAt: string;
  paidById: string; paidBy: Member;
  splits: { id: string; amount: number; memberId: string; member: Member }[];
};

interface ExpenseTrackerProps {
  tripId: string; members: Member[]; expenses: Expense[]; currentMember: Member | null;
}

export function ExpenseTracker({ tripId, members, expenses: initialExpenses, currentMember }: ExpenseTrackerProps) {
  const { t } = useLocale();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "", amount: "",
    paidById: currentMember?.id || members[0]?.id || "",
    splitType: "equal" as "equal" | "custom",
    splits: members.reduce((acc, m) => ({ ...acc, [m.id]: true }), {} as Record<string, boolean>),
    customAmounts: members.reduce((acc, m) => ({ ...acc, [m.id]: "" }), {} as Record<string, string>),
  });

  const balances = useMemo(() => calculateBalances(expenses.map((e) => ({
    paidById: e.paidById, amount: e.amount,
    splits: e.splits.map((s) => ({ memberId: s.memberId, amount: s.amount })),
  }))), [expenses]);

  const debts = useMemo(() => simplifyDebts(balances), [balances]);
  const inputClasses = "w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none";

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) { alert(t.common.error); return; }
      const selectedMembers = members.filter((m) => formData.splits[m.id]);
      if (selectedMembers.length === 0) { alert(t.common.error); return; }
      let splits: { memberId: string; amount: number }[];
      if (formData.splitType === "equal") {
        const splitAmount = amount / selectedMembers.length;
        splits = selectedMembers.map((m) => ({ memberId: m.id, amount: Math.round(splitAmount * 100) / 100 }));
      } else {
        splits = selectedMembers.map((m) => ({ memberId: m.id, amount: parseFloat(formData.customAmounts[m.id]) || 0 }));
        const totalCustom = splits.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(totalCustom - amount) > 0.01) { alert(t.common.error); setLoading(false); return; }
      }
      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: formData.description, amount, paidById: formData.paidById, splits }),
      });
      if (response.ok) {
        const newExpense = await response.json();
        setExpenses([newExpense, ...expenses]); setShowAddForm(false);
        setFormData({ description: "", amount: "", paidById: currentMember?.id || members[0]?.id || "",
          splitType: "equal",
          splits: members.reduce((acc, m) => ({ ...acc, [m.id]: true }), {} as Record<string, boolean>),
          customAmounts: members.reduce((acc, m) => ({ ...acc, [m.id]: "" }), {} as Record<string, string>),
        });
      } else { const data = await response.json(); alert(data.error || t.common.error); }
    } catch (error) { alert(t.common.error); } finally { setLoading(false); }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Ausgabe löschen?")) return;
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses/${expenseId}`, { method: "DELETE" });
      if (response.ok) setExpenses(expenses.filter((e) => e.id !== expenseId));
    } catch (error) { alert(t.common.error); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Receipt className="w-6 h-6 text-orange-500" />{t.expenses.title}
        </h2>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">
          <Plus className="w-4 h-4" />{t.expenses.addExpense}
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">{t.expenses.form.addTitle}</h3>
              <button onClick={() => setShowAddForm(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{t.expenses.form.description}</label>
                <input type="text" required value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={inputClasses} placeholder={t.expenses.form.descriptionPlaceholder} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{t.expenses.form.amount}</label>
                  <input type="number" step="0.01" min="0" required value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={inputClasses} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{t.expenses.form.paidBy}</label>
                  <select value={formData.paidById} onChange={(e) => setFormData({ ...formData, paidById: e.target.value })} className={inputClasses}>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t.expenses.form.splitType}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="splitType" checked={formData.splitType === "equal"}
                      onChange={() => setFormData({ ...formData, splitType: "equal" })} className="text-orange-500 focus:ring-orange-500" />
                    <span className="text-sm dark:text-stone-300">{t.expenses.form.equalSplit}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="splitType" checked={formData.splitType === "custom"}
                      onChange={() => setFormData({ ...formData, splitType: "custom" })} className="text-orange-500 focus:ring-orange-500" />
                    <span className="text-sm dark:text-stone-300">{t.expenses.form.customAmounts}</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t.expenses.form.splitBetween}</label>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 py-2 px-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
                      <input type="checkbox" checked={formData.splits[member.id]}
                        onChange={(e) => setFormData({ ...formData, splits: { ...formData.splits, [member.id]: e.target.checked } })}
                        className="text-orange-500 focus:ring-orange-500 rounded" />
                      <span className="flex-1 text-sm font-medium dark:text-white">{member.name}</span>
                      {formData.splitType === "custom" && formData.splits[member.id] && (
                        <input type="number" step="0.01" min="0" value={formData.customAmounts[member.id]}
                          onChange={(e) => setFormData({ ...formData, customAmounts: { ...formData.customAmounts, [member.id]: e.target.value } })}
                          className="w-24 px-2 py-1 border border-stone-300 dark:border-stone-600 rounded text-sm bg-white dark:bg-stone-700 text-stone-900 dark:text-white" placeholder="0.00" />
                      )}
                      {formData.splitType === "equal" && formData.splits[member.id] && formData.amount && (
                        <span className="text-sm text-stone-500 dark:text-stone-400">
                          {formatCurrency(parseFloat(formData.amount) / members.filter((m) => formData.splits[m.id]).length)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />{t.common.loading}</> : t.expenses.form.addButton}
              </button>
            </form>
          </div>
        </div>
      )}

      {debts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
          <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />{t.expenses.whoOwes}
          </h3>
          <div className="space-y-2">
            {debts.map((debt, idx) => {
              const from = members.find((m) => m.id === debt.from);
              const to = members.find((m) => m.id === debt.to);
              return (
                <div key={idx} className="flex items-center gap-2 text-sm bg-white dark:bg-stone-800 rounded-lg px-3 py-2">
                  <span className="font-medium text-amber-900 dark:text-amber-300">{from?.name}</span>
                  <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <span className="font-medium text-amber-900 dark:text-amber-300">{to?.name}</span>
                  <span className="ml-auto font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(debt.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-stone-500 dark:text-stone-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-stone-600" />
            <p>{t.expenses.noExpenses}</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-stone-900 dark:text-white">{expense.description}</h4>
                      <span className="text-lg font-semibold text-stone-900 dark:text-white">{formatCurrency(expense.amount, expense.currency)}</span>
                    </div>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                      {t.expenses.paidBy} <span className="font-medium">{expense.paidBy.name}</span> &middot; {t.expenses.splitBetween} {expense.splits.map((s) => s.member.name).join(", ")}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{new Date(expense.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteExpense(expense.id)} className="text-stone-400 hover:text-red-500 transition p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
