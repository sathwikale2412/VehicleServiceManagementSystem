import { useState } from 'react';
import { ArrowRight, CarFront, Plus, Search, Trash2, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError, get, send } from '../api';
import { useLoad, EmptyState, LoadState } from '../ui';
import type { Vehicle } from '../types';
import { RecordModal } from '../components/RecordModal';
import { ConfirmDialog } from '../components/Modal';

export function VehiclesPage() {
  const { data, loading, error, reload } = useLoad<{ items: Vehicle[] }>('/vehicles', { items: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState<Vehicle | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const items = data.items.filter((vehicle) => `${vehicle.make} ${vehicle.model} ${vehicle.registration}`.toLowerCase().includes(search.toLowerCase()));

  async function remove() {
    if (!removing) return;
    setBusy(true); setActionError(null);
    try { await send(`/vehicles/${removing.id}`, undefined, 'DELETE'); setRemoving(null); await reload(); }
    catch (cause) { setActionError(cause instanceof ApiError ? cause.message : 'Could not remove this vehicle.'); }
    finally { setBusy(false); }
  }

  return <div>
    <div className="page-header"><div><div className="eyebrow">YOUR GARAGE</div><h1>My vehicles</h1><p>Keep the details and records for every vehicle together.</p></div><div className="page-header-action"><button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Add vehicle</button></div></div>
    {actionError && <div className="inline-error">{actionError}</div>}
    <div className="table-toolbar panel" style={{ marginBottom: 15 }}><p>{data.items.length} {data.items.length === 1 ? 'vehicle' : 'vehicles'} in your garage</p><div className="search-box"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search make, model or registration" /></div></div>
    <LoadState loading={loading} error={error} onRetry={reload} />
    {!loading && !error && (items.length ? <div className="vehicle-grid">{items.map((vehicle) => <article className="vehicle-card" key={vehicle.id}><div className="vehicle-card-top"><span className="vehicle-avatar"><CarFront size={20} /></span><span className="status-chip">{vehicle.status}</span></div><h3>{vehicle.make} {vehicle.model}</h3><span className="vehicle-registration">{vehicle.registration}</span><div className="vehicle-meta"><span>{vehicle.year} · {vehicle.fuelType}</span><span>{Number(vehicle.odometer).toLocaleString('en-IN')} km</span></div><div className="vehicle-card-actions"><Link className="vehicle-card-link" to={`/app/vehicles/${vehicle.id}`}>View details <ArrowRight size={13} /></Link><div className="table-actions"><button aria-label={`Edit ${vehicle.make} ${vehicle.model}`} onClick={() => { setEditing(vehicle); setModalOpen(true); }}><Pencil size={14} /></button><button className="danger" aria-label={`Remove ${vehicle.make} ${vehicle.model}`} onClick={() => setRemoving(vehicle)}><Trash2 size={14} /></button></div></div></article>)}</div> : <div className="panel"><EmptyState title={search ? 'No matching vehicles' : 'Start your garage'} detail={search ? 'Try a different registration number or model.' : 'Add your first vehicle to start keeping its service history in one place.'} action={!search && <button className="btn-quiet" onClick={() => setModalOpen(true)}>Add your first vehicle <Plus size={13} /></button>} /></div>)}
    <RecordModal open={modalOpen} kind="vehicle" initial={editing} onClose={() => setModalOpen(false)} onSaved={reload} />
    <ConfirmDialog open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={remove} busy={busy} title="Remove this vehicle?" message={`This will remove ${removing?.make ?? ''} ${removing?.model ?? ''} from your garage. Its service, expense, and reminder entries remain stored but will no longer appear under the vehicle.`} />
  </div>;
}
