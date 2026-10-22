import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { daysUntil, formatClock, formatINR, LiveClock } from '../src/ui';

function localDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

describe('dashboard display helpers', () => {
  it('formats rupee totals for the reference currency', () => {
    expect(formatINR(12500)).toContain('12,500');
    expect(formatINR(0)).toContain('0');
  });
  it('renders a live local date/time and advances the formatted time by seconds', () => {
    const first = new Date('2026-10-23T10:00:00.000Z');
    const next = new Date(first.getTime() + 1000);
    const html = renderToStaticMarkup(<LiveClock />);
    expect(html).toContain('class="live-time"');
    expect(formatClock(next)).not.toBe(formatClock(first));
  });
  it('distinguishes an upcoming reminder from an overdue one', () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    expect(daysUntil(localDate(tomorrow))).toBe(1);
    expect(daysUntil(localDate(yesterday))).toBe(-1);
  });
});
