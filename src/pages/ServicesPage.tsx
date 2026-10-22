import { useMemo, useState } from 'react';
import { ArrowDownWideNarrow, Plus, Trash2, Pencil, Wrench } from 'lucide-react';
import { ApiError, send } from '../api';
import { formatDate, formatINR, LoadState, useLoad, EmptyState } from '../ui';
import type { RecordItem, Vehicle } from '../types';
import { RecordModal } from '../components/RecordModal';
import { ConfirmDialog } from '../components/Modal';

export function ServicesPage() {
  const { data, loading, error, reload } = useLoad<{ items: RecordItem[]; totalCost: number }>('/services', { items: [], totalCost: 0 });
  const vehicleLoad = useLoad<{ items: Vehicle[] }>('/vehicles', { items: [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [removeItem, setRemoveItem] = useState<RecordItem | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const items = useMemo(() => data.items.filter((item) => vehicleFilter === 'all' || String(item.vehicleId) === vehicleFilter), [data.items, vehicleFilter]);
  async function remove() {
    if (!removeItem) return;
    setBusy(true); setActionError(null);
    try { await send(`/services/${removeItem.id}`, undefined, 'DELETE'); setRemoveItem(null); await reload(); }
    catch (cause) { setActionError(cause instanceof ApiError ? cause.message : 'Could not remove the service record.'); }
    finally { setBusy(false); }
  }
  return <div>
    <div className="page-header"><div><div className="eyebrow">MAINTENANCE LOGBOOK</div><h1>Service history</h1><p>Record what was done, when, and at what odometer reading.</p></div><div className="page-header-action"><button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /> Add service record</button></div></div>
    {actionError && <div className="inline-error">{actionError}</div>}
    <div className="metric-row" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))', marginBottom: 15 }}><div className="metric-inline"><span>TOTAL SERVICE COST</span><strong>{formatINR(data.totalCost)}</strong></div><div className="metric-inline"><span>RECORDS</span><strong>{data.items.length}</strong></div><div className="metric-inline"><span>VEHICLES</span><strong>{vehicleLoad.data.items.length}</strong></div></div>
    <div className="panel table-panel"><div className="table-toolbar"><p><ArrowDownWideNarrow size={13} /> Newest service records first</p><select className="form-select filter-select" aria-label="Filter service records by vehicle" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}><option value="all">All vehicles</option>{vehicleLoad.data.items.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model}</option>)}</select></div>
      <LoadState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && (items.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>DATE</th><th>SERVICE / WORK</th><th>VEHICLE</th><th>ODOMETER</th><th>COST</th><th>ACTIONS</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{formatDate(String(item.date))}</td><td><strong>{String(item.serviceType)}</strong><span className="help-inline">{String(item.workshop ?? '')}</span></td><td>{String(item.vehicle ?? 'Vehicle')}</td><td className="mono">{Number(item.odometer).toLocaleString('en-IN')} km</td><td className="mono">{formatINR(Number(item.cost))}</td><td><div className="table-actions"><button aria-label="Edit service record" onClick={() => { setEditing(item); setOpen(true); }}><Pencil size={14} /></button><button className="danger" aria-label="Remove service record" onClick={() => setRemoveItem(item)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No service history yet" detail="A saved maintenance entry will appear here with its date, odometer reading, vehicle, and cost." action={<button className="btn-quiet" onClick={() => setOpen(true)}><Wrench size={13} /> Add a service record</button>} />)}
    </div>
    <RecordModal open={open} kind="service" vehicles={vehicleLoad.data.items} initial={editing} onClose={() => setOpen(false)} onSaved={reload} />
    <ConfirmDialog open={Boolean(removeItem)} onClose={() => setRemoveItem(null)} onConfirm={remove} busy={busy} title="Remove service record?" message={`Remove “${removeItem?.serviceType ?? 'this service'}” from your history? This cannot be undone.`} />
  </div>;
}
