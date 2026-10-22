import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, SlidersHorizontal } from 'lucide-react';
import { get } from '../api';
import type { RecordItem, Vehicle } from '../types';
import { EmptyState, formatDate, formatINR, LoadState, useLoad } from '../ui';

const colors = ['#578d7a', '#d4a254', '#789aa1', '#bd7768', '#8d9c71', '#9586a2'];
type ReportData = { totalExpense: number; totalServiceCost: number; categoryTotals: { category: string; amount: number }[]; monthlySpend: { month: string; amount: number }[]; serviceCount: number; services: RecordItem[] };
export function ReportsPage() {
  const [vehicleId, setVehicleId] = useState('all');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const path = useMemo(() => `/reports?${new URLSearchParams({ ...(vehicleId !== 'all' ? { vehicleId } : {}), ...(start ? { start } : {}), ...(end ? { end } : {}) }).toString()}`, [vehicleId, start, end]);
  const { data, loading, error, reload } = useLoad<ReportData>(path, { totalExpense: 0, totalServiceCost: 0, categoryTotals: [], monthlySpend: [], serviceCount: 0, services: [] });
  const vehicles = useLoad<{ items: Vehicle[] }>('/vehicles', { items: [] });
  const monthData = data.monthlySpend.map((entry) => ({ ...entry, label: new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(new Date(`${entry.month}-01T00:00:00`)) }));
  function exportCsv() {
    const rows = [['Date','Service','Odometer (km)','Cost'], ...data.services.map((item) => [String(item.date), String(item.serviceType), String(item.odometer), String(item.cost)])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'vehicle-service-report.csv'; anchor.click(); URL.revokeObjectURL(url);
  }
  return <div>
    <div className="page-header"><div><div className="eyebrow">PLAN WITH THE HISTORY</div><h1>Reports &amp; analytics</h1><p>See how service and vehicle costs change over time.</p></div><div className="page-header-action"><button className="btn-quiet" onClick={exportCsv} disabled={!data.services.length}><Download size={14} /> Export service CSV</button></div></div>
    <section className="panel report-filter"><div className="filter-title"><SlidersHorizontal size={15} /><strong>Report filters</strong><span>Apply to your account’s saved records</span></div><div className="report-filter-fields"><label>Vehicle<select className="form-select filter-select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}><option value="all">All vehicles</option>{vehicles.data.items.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model}</option>)}</select></label><label>From<input className="form-control filter-date" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label><label>To<input className="form-control filter-date" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label><button className="btn-quiet" onClick={() => { setVehicleId('all'); setStart(''); setEnd(''); }}>Clear filters</button></div></section>
    <LoadState loading={loading} error={error} onRetry={reload} />
    {!loading && !error && <>
      <div className="metric-row" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))', margin: '14px 0' }}><div className="metric-inline"><span>TOTAL EXPENSES</span><strong>{formatINR(data.totalExpense)}</strong></div><div className="metric-inline"><span>SERVICE COST</span><strong>{formatINR(data.totalServiceCost)}</strong></div><div className="metric-inline"><span>SERVICE RECORDS</span><strong>{data.serviceCount}</strong></div></div>
      <div className="chart-grid"><section className="panel chart-card"><div className="chart-head"><div><h3>Monthly spend</h3><p>Recorded vehicle expenses by month</p></div></div>{monthData.length ? <div style={{ height: 270 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={monthData} margin={{ top: 8, right: 8, bottom: 3, left: 0 }}><CartesianGrid vertical={false} stroke="#edf0eb" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#909b94', fontSize: 9 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#909b94', fontSize: 9 }} tickFormatter={(value) => `₹${Number(value) >= 1000 ? `${Math.round(Number(value) / 1000)}k` : value}`} width={42} /><Tooltip formatter={(value) => formatINR(Number(value))} cursor={{ fill: '#f4f7f4' }} /><Bar dataKey="amount" fill="#669783" radius={[5,5,0,0]} maxBarSize={35} /></BarChart></ResponsiveContainer></div> : <EmptyState title="No spending history yet" detail="Recorded expenses will form your monthly cost view." />}</section>
        <section className="panel chart-card"><div className="chart-head"><div><h3>Spend by category</h3><p>Costs grouped by their saved category</p></div></div>{data.categoryTotals.length ? <div style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.categoryTotals} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={86} paddingAngle={3} stroke="none">{data.categoryTotals.map((item, index) => <Cell key={item.category} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => formatINR(Number(value))} /></PieChart></ResponsiveContainer></div> : <EmptyState title="Category view will appear here" detail="There is not enough saved expense data for a breakdown yet." />}{data.categoryTotals.map((item, index) => <div className="report-category" key={item.category}><span><i className="legend-dot" style={{ background: colors[index % colors.length] }} />{item.category}</span><strong>{formatINR(item.amount)}</strong></div>)}</section></div>
      <section className="panel table-panel" style={{ marginTop: 14 }}><div className="panel-head"><div><h2>Maintenance history</h2><p>Latest service records in the selected range</p></div></div>{data.services.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>DATE</th><th>SERVICE</th><th>ODOMETER</th><th>COST</th></tr></thead><tbody>{data.services.map((item) => <tr key={item.id}><td>{formatDate(String(item.date))}</td><td><strong>{String(item.serviceType)}</strong></td><td className="mono">{Number(item.odometer).toLocaleString('en-IN')} km</td><td className="mono">{formatINR(Number(item.cost))}</td></tr>)}</tbody></table></div> : <EmptyState title="No service records in this period" detail="Try a wider date range or add a service entry." />}</section>
    </>}
  </div>;
}
