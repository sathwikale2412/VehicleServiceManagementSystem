import { useMemo, useState } from 'react';
import { BellRing, CalendarDays, CircleAlert, Plus, Check, Pencil } from 'lucide-react';
import { ApiError, send } from '../api';
import { useAuth } from '../auth-context';
import { useLocation } from 'react-router-dom';
import { daysUntil, EmptyState, formatDate, LoadState, useLoad } from '../ui';
import type { RecordItem, Reminder, Vehicle } from '../types';
import { RecordModal } from '../components/RecordModal';

export function RemindersPage() {
  const { status } = useAuth();
  const location = useLocation();
  const presetVehicleId = (location.state as { vehicleId?: string } | null)?.vehicleId ?? '';
  const { data, loading, error, reload } = useLoad<{ items: Reminder[] }>('/reminders', { items: [] });
  const vehicleLoad = useLoad<{ items: Vehicle[] }>('/vehicles', { items: [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const sorted = useMemo(() => [...data.items].filter((item) => showDismissed || !item.dismissed).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))), [data.items, showDismissed]);
  const pending = data.items.filter((item) => !item.dismissed);
  const overdue = pending.filter((item) => daysUntil(item.dueDate) < 0).length;
  async function dismiss(item: Reminder) {
    setBusyId(item.id); setActionError(null);
    try { await send(`/reminders/${item.id}`, { vehicleId: item.vehicleId ?? '', kind: item.kind, title: item.title, dueDate: item.dueDate.slice(0, 10), notes: item.notes ?? '', dismissed: true }, 'PATCH'); await reload(); }
    catch (cause) { setActionError(cause instanceof ApiError ? cause.message : 'Could not update this reminder.'); }
    finally { setBusyId(null); }
  }
  return <div>
    <div className="page-header"><div><div className="eyebrow">STAY AHEAD OF THE DATE</div><h1>Reminders</h1><p>Keep service visits and document renewals visible.</p></div><div className="page-header-action"><button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /> Set reminder</button></div></div>
    {actionError && <div className="inline-error">{actionError}</div>}
    {!status?.emailConfigured && <div className="setup-inline">In-app reminders are available. Scheduled email reminders will activate after an email provider is configured.</div>}
    <div className="metric-row" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))', marginBottom: 15 }}><div className="metric-inline"><span>ACTIVE REMINDERS</span><strong>{pending.length}</strong></div><div className="metric-inline"><span>OVERDUE</span><strong style={{ color: overdue ? '#b85849' : undefined }}>{overdue}</strong></div><div className="metric-inline"><span>VEHICLES</span><strong>{vehicleLoad.data.items.length}</strong></div></div>
    <section className="panel"><div className="panel-head"><div><h2>Service &amp; renewal dates</h2><p>Sorted by what is due next</p></div><label className="toggle-label"><input type="checkbox" checked={showDismissed} onChange={(e) => setShowDismissed(e.target.checked)} /> Show dismissed</label></div><LoadState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && (sorted.length ? sorted.map((item) => <ReminderRow key={item.id} reminder={item} onDismiss={() => void dismiss(item)} onEdit={() => { setEditing(item as RecordItem); setOpen(true); }} busy={busyId === item.id} />) : <EmptyState title="No reminders yet" detail="Add a service, insurance renewal, or PUCC date to keep it in view." action={<button className="btn-quiet" onClick={() => setOpen(true)}><CalendarDays size={13} /> Set your first reminder</button>} />)}
    </section>
    {!vehicleLoad.data.items.length && <div className="setup-inline" style={{ marginTop: 13 }}>You can set general reminders now. Add a vehicle to attach renewal and service dates to it.</div>}
    <RecordModal open={open} kind="reminder" vehicles={vehicleLoad.data.items} initial={editing} presetVehicleId={presetVehicleId} onClose={() => setOpen(false)} onSaved={reload} />
  </div>;
}

function ReminderRow({ reminder, onDismiss, onEdit, busy }: { reminder: Reminder; onDismiss: () => void; onEdit: () => void; busy: boolean }) {
  const days = daysUntil(reminder.dueDate);
  const status = reminder.dismissed ? 'Dismissed' : days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days left`;
  const kindIcon = reminder.kind === 'Insurance renewal' ? <BellRing size={16} /> : reminder.kind === 'PUCC renewal' ? <FileIcon /> : <WrenchIcon />;
  return <div className="reminder-card"><span className={`due-icon ${days > 7 && !reminder.dismissed ? 'green' : ''}`}>{kindIcon}</span><span className="reminder-card-copy"><strong>{reminder.title}</strong><span>{reminder.vehicle ?? reminder.kind} · {reminder.kind} · Due {formatDate(reminder.dueDate)}</span></span><span className="reminder-card-meta"><strong className={days < 0 && !reminder.dismissed ? 'status-overdue' : ''}>{status}</strong><span><button className="table-action-text" onClick={onEdit}><Pencil size={12} /> Edit</button>{!reminder.dismissed && <button className="table-action-text" onClick={onDismiss} disabled={busy}>{busy ? 'Saving…' : <><Check size={12} /> Dismiss</>}</button>}</span></span></div>;
}
function FileIcon() { return <CircleAlert size={16} />; }
function WrenchIcon() { return <BellRing size={16} />; }
