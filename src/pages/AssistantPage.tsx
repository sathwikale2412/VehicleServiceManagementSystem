import { useState } from 'react';
import { ArrowRight, CalendarDays, Database, Sparkles } from 'lucide-react';
import { ApiError, send } from '../api';
import { useAuth } from '../auth-context';
import { formatDate, formatINR, LoadState, useLoad } from '../ui';
import type { DashboardData } from '../types';

type InsightResult = { insight: string; basedOn?: { vehicleCount: number; serviceCount: number; expenseCount: number; reminderCount: number; from: string | null; to: string | null } };
export function AssistantPage() {
  const { status } = useAuth();
  const { data, loading, error } = useLoad<DashboardData>('/dashboard', { vehicleCount: 0, reminderCount: 0, currentMonthTotal: 0, yearTotal: 0, reminders: [], recentServices: [], vehicles: [] });
  const report = useLoad<{ totalExpense: number; totalServiceCost: number; serviceCount: number }>('/reports', { totalExpense: 0, totalServiceCost: 0, serviceCount: 0 });
  const [result, setResult] = useState<InsightResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true); setAiError(null); setResult(null);
    try { setResult(await send<InsightResult>('/ai/insights', {})); }
    catch (cause) { setAiError(cause instanceof ApiError ? cause.message : 'Insights could not be generated right now.'); }
    finally { setBusy(false); }
  }
  return <div>
    <div className="page-header"><div><div className="eyebrow">A SECOND LOOK AT YOUR LOGBOOK</div><h1>AI Assistant</h1><p>Maintenance and spending observations from the records in this account.</p></div></div>
    <div className="ai-page-layout"><div>
      <section className="ai-prompt-card"><div className="assistant-card-head"><span className="assistant-orb"><Sparkles size={17} /></span><div><strong>Vehicle Desk insights</strong><span>Grounded in your saved records</span></div></div><h2>What stands out in your vehicle history?</h2><p>Request a short review of service activity, expenses, and upcoming reminders. Only this signed-in account’s relevant records are used.</p><button className="btn-primary" style={{ marginTop: 15 }} onClick={refresh} disabled={busy || !status?.aiConfigured}>{busy ? 'Reviewing your records…' : 'Generate insights'}<ArrowRight size={15} /></button>{!status?.aiConfigured && <div className="setup-inline" style={{ marginTop: 12 }}>AI Gateway is not configured for this deployment yet. You can still review all records and totals in Reports.</div>}</section>
      {aiError && <div className="inline-error">{aiError}</div>}
      {(!status?.aiConfigured || aiError) && <section className="panel fallback-summary" style={{ marginTop: 14 }}><div className="panel-head"><div><h2>Record-based summary</h2><p>Calculated directly from your saved entries; no AI-generated advice.</p></div><span className="tag-chip">{report.loading ? 'Updating…' : 'Live records'}</span></div><div className="fallback-stat-row"><span><strong>{data.vehicleCount}</strong> vehicles</span><span><strong>{report.data.serviceCount}</strong> service records</span><span><strong>{formatINR(report.data.totalExpense)}</strong> recorded expenses</span><span><strong>{formatINR(report.data.totalServiceCost)}</strong> recorded service cost</span></div>{data.reminders.length > 0 && <div className="fallback-reminders"><strong>Next reminders on file</strong>{data.reminders.slice(0, 3).map((item) => <span key={item.id}>{item.title} · {formatDate(item.dueDate)}</span>)}</div>}</section>}
      {result && <section className="panel" style={{ marginTop: 14 }}><div className="panel-head"><div><h2>What I noticed</h2><p>Generated from this account’s recent activity</p></div><span className="badge-admin"><Sparkles size={12} /> AI insight</span></div><div className="ai-result">{result.insight}</div>{result.basedOn && <div className="evidence-note"><Database size={14} /><span>Based on {result.basedOn.vehicleCount} vehicle{result.basedOn.vehicleCount === 1 ? '' : 's'}, {result.basedOn.serviceCount} service records, {result.basedOn.expenseCount} expenses, and {result.basedOn.reminderCount} active reminders{result.basedOn.from && result.basedOn.to ? ` · ${formatDate(result.basedOn.from)} to ${formatDate(result.basedOn.to)}` : ''}.</span></div>}</section>}
      {!result && !aiError && !busy && <section className="panel assistant-empty"><span className="assistant-orb"><Sparkles size={17} /></span><h2>A little context goes a long way.</h2><p>Insights become more specific after you add service dates, odometer readings, and expenses to your logbook.</p><div className="quick-context"><span><strong>{data.vehicles.length}</strong> vehicles visible on dashboard</span><span><strong>{formatINR(data.yearTotal)}</strong> expenses this year</span></div></section>}
      <p className="assistant-disclaimer" style={{ fontSize: 10, marginTop: 13 }}>AI output can be incomplete or mistaken. Treat suggestions as informational planning help—not a mechanical diagnosis, repair instruction, insurance recommendation, or replacement for a qualified professional.</p>
    </div><aside className="ai-side-column"><div className="panel"><div className="panel-head"><div><h2>Available context</h2><p>Records this account keeps</p></div></div><LoadState loading={loading} error={error} /><div className="context-list"><Context icon={<Database size={14} />} label="Vehicles" value={String(data.vehicleCount)} /><Context icon={<CalendarDays size={14} />} label="Upcoming reminders" value={String(data.reminderCount)} /><Context icon={<CalendarDays size={14} />} label="This month's spend" value={formatINR(data.currentMonthTotal)} /><Context icon={<CalendarDays size={14} />} label="This year's spend" value={formatINR(data.yearTotal)} /></div></div><div className="assistant-card"><div className="assistant-card-head"><span className="assistant-orb"><Database size={15} /></span><div><strong>Privacy by design</strong><span>Account-owned records only</span></div></div><p>Record ownership is checked by the server. The assistant receives minimized vehicle, service, expense, and reminder fields—not passwords or uploaded document contents.</p></div></aside></div>
  </div>;
}
function Context({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="context-item"><span className="context-icon">{icon}</span><span>{label}</span><strong>{value}</strong></div>; }
