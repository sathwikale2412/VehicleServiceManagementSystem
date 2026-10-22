export type ExpenseForReport = { date: string; category: string; amount: number };
export type ServiceForReport = { cost: number };

export function aggregateReportData(expenses: ExpenseForReport[], services: ServiceForReport[]) {
  const categories = new Map<string, number>();
  const months = new Map<string, number>();
  for (const expense of expenses) {
    categories.set(expense.category, (categories.get(expense.category) ?? 0) + expense.amount);
    const month = expense.date.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + expense.amount);
  }
  const monthlySpend = [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({ month, amount }));
  return {
    totalExpense: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    totalServiceCost: services.reduce((sum, service) => sum + service.cost, 0),
    categoryTotals: [...categories.entries()].map(([category, amount]) => ({ category, amount })),
    monthlySpend,
    serviceCount: services.length,
  };
}
