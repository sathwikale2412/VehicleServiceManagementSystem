import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from 'recharts';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { ApiError, send } from '../api';
import { formatDate, formatINR, LoadState, useLoad, EmptyState } from '../ui';
import type { RecordItem, Vehicle } from '../types';
import { RecordModal } from '../components/RecordModal';
import { ConfirmDialog } from '../components/Modal';

const palette = ['#578d7a', '#d5a65a', '#7396a0', '#bd7768', '#8c9b70', '#8d84a3'];
export function ExpensesPage() {
  const { data, loading, error, reload } = useLoad<{ items: RecordItem[] }>('/expenses', { items: [] });
  const vehicleLoad = useLoad<{ items: Vehicle[] }>('/vehicles', { items: [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [removeItem, setRemoveItem] = useState<RecordItem | null>(null);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const items = useMemo(() => data.items.filter((item) => filter === 'all' || item.category === filter), [data.items, filter]);
  const now = new Date();
  const thisMonth = data.items.filter((item) => String(item.date).slice(0, 7) === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const thisYear = data.items.filter((item) => String(item.date).slice(0, 4) === String(now.getFullYear())).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const categoryMap = new Map<string, number>();
  data.items.forEach((item) => categoryMap.set(String(item.category), (categoryMap.get(String(item.category)) || 0) + Number(item.amount || 0)));
  const chartData = [...categoryMap].map(([name, value]) => ({ name, value }));
  async function remove() {
    if (!removeItem) return;
    setBusy(true); setActionError(null);
    try { await send(`/expenses/${removeItem.id}`, undefined, 'DELETE'); setRemoveItem(null); await reload(); }
    catch (cause) { setActionError(cause instanceof ApiError ? cause.message : 'Could not remove this expense.'); }
    finally { setBusy(false); }
  }
  return <div>
    <div className="page-header"><div><div className="eyebrow">COSTS, MADE CLEAR</div><h1>Expense tracker</h1><p>See what vehicle ownership is costing, one entry at a time.</p></div><div className="page-header-action"><button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /> Record expense</button></div></div>
    {actionError && <div className="inline-error">{actionError}</div>}
    <LoadState loading={loading} error={error} onRetry={reload} />
    {!loading && !error && <>
      <div className="metric-row" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))', marginBottom: 15 }}><div className="metric-inline"><span>THIS MONTH</span><strong>{formatINR(thisMonth)}</strong></div><div className="metric-inline"><span>THIS YEAR</span><strong>{formatINR(thisYear)}</strong></div><div className="metric-inline"><span>ALL RECORDED</span><strong>{formatINR(data.items.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</strong></div></div>
      <div className="chart-grid" style={{ marginBottom: 15 }}><section className="panel chart-card"><div className="chart-head"><div><h3>By category</h3><p>Share of recorded vehicle costs</p></div></div>{chartData.length ? <div style={{ height: 230, display: 'flex', alignItems: 'center' }}><div style={{ width: '58%', height: 220 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={82} paddingAngle={3} stroke="none">{chartData.map((item, index) => <Cell key={item.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip formatter={(value) => formatINR(Number(value))} /></PieChart></ResponsiveContainer></div><div className="chart-legend">{chartData.map((item, index) => <span key={item.name}><i className="legend-dot" style={{ background: palette[index % palette.length] }} />{item.name} · {formatINR(item.value)}</span>)}</div></div> : <EmptyState title="Category view will appear here" detail="Add an expense to see how costs are split." />}</section><section className="panel chart-card"><div className="chart-head"><div><h3>Keep the context with the cost</h3><p>A little detail makes reports more useful</p></div></div><div className="assistant-insight">Link an expense to a vehicle when you can. The same saved entry feeds its lifetime total, your monthly view, reports, and AI insights.</div><div className="metric-inline" style={{ marginTop: 14 }}><span>ENTRIES THIS YEAR</span><strong>{data.items.filter((item) => String(item.date).startsWith(String(now.getFullYear()))).length}</strong></div></section></div>
      <div className="panel table-panel"><div className="table-toolbar"><p>{items.length} expense {items.length === 1 ? 'entry' : 'entries'}</p><select className="form-select filter-select" aria-label="Filter expenses by category" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All categories</option>{['Service','Fuel','Repair','Insurance','Parts','Other'].map((item) => <option key={item}>{item}</option>)}</select></div>{items.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>DATE</th><th>DESCRIPTION</th><th>CATEGORY</th><th>VEHICLE</th><th>AMOUNT</th><th>ACTIONS</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{formatDate(String(item.date))}</td><td><strong>{String(item.description)}</strong></td><td><span className="tag-chip">{String(item.category)}</span></td><td>{String(item.vehicle ?? '—')}</td><td className="mono">{formatINR(Number(item.amount))}</td><td><div className="table-actions"><button aria-label="Edit expense" onClick={() => { setEditing(item); setOpen(true); }}><Pencil size={14} /></button><button className="danger" aria-label="Remove expense" onClick={() => setRemoveItem(item)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No expenses recorded" detail="Fuel, service, repair, insurance, and other costs can all be tracked here." action={<button className="btn-quiet" onClick={() => setOpen(true)}><Wallet size={13} /> Record your first expense</button>} />}</div>
    </>}
    <RecordModal open={open} kind="expense" vehicles={vehicleLoad.data.items} initial={editing} onClose={() => setOpen(false)} onSaved={reload} />
    <ConfirmDialog open={Boolean(removeItem)} onClose={() => setRemoveItem(null)} onConfirm={remove} busy={busy} title="Remove expense?" message={`Remove “${removeItem?.description ?? 'this expense'}” from your tracker? This cannot be undone.`} />
  </div>;
}
