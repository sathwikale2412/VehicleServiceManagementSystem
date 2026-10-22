import { describe, expect, it } from 'vitest';
import { aggregateReportData } from '../server/reporting';

describe('aggregateReportData', () => {
  it('calculates total expenses, service costs, categories, and monthly spend', () => {
    const result = aggregateReportData(
      [
        { date: '2026-02-12', category: 'Fuel', amount: 2000 },
        { date: '2026-01-02', category: 'Service', amount: 3500 },
        { date: '2026-02-28', category: 'Fuel', amount: 800 },
      ],
      [{ cost: 3500 }, { cost: 2400 }],
    );
    expect(result.totalExpense).toBe(6300);
    expect(result.totalServiceCost).toBe(5900);
    expect(result.serviceCount).toBe(2);
    expect(result.categoryTotals).toEqual([{ category: 'Fuel', amount: 2800 }, { category: 'Service', amount: 3500 }]);
    expect(result.monthlySpend).toEqual([{ month: '2026-01', amount: 3500 }, { month: '2026-02', amount: 2800 }]);
  });
  it('returns empty aggregates for an empty period', () => {
    expect(aggregateReportData([], [])).toEqual({ totalExpense: 0, totalServiceCost: 0, categoryTotals: [], monthlySpend: [], serviceCount: 0 });
  });
});
