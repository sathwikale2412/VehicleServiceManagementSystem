import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDownToLine, FileText, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ApiError, get, send, uploadDocument } from '../api';
import type { RecordItem, Vehicle } from '../types';
import { daysUntil, EmptyState, formatDate, LoadState, useLoad } from '../ui';
import { ConfirmDialog, Modal } from '../components/Modal';

export function DocumentsPage() {
  const location = useLocation();
  const presetVehicleId = (location.state as { vehicleId?: string } | null)?.vehicleId ?? '';
  const { data, loading, error, reload } = useLoad<{ items: RecordItem[] }>('/documents', { items: [] });
  const vehicleLoad = useLoad<{ items: Vehicle[] }>('/vehicles', { items: [] });
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(Boolean(presetVehicleId));
  const [removeItem, setRemoveItem] = useState<RecordItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const items = useMemo(() => data.items.filter((item) => filter === 'all' || String(item.vehicleId) === filter), [data.items, filter]);
  async function remove() {
    if (!removeItem) return;
    setBusy(true); setErrorMessage(null);
    try { await send(`/documents/${removeItem.id}`, undefined, 'DELETE'); setRemoveItem(null); await reload(); }
    catch (cause) { setErrorMessage(cause instanceof ApiError ? cause.message : 'Could not remove this document.'); }
    finally { setBusy(false); }
  }
  async function download(id: string) {
    setDownloadBusy(id); setErrorMessage(null);
    try { const result = await get<{ url: string }>(`/documents/${id}/download`); window.open(result.url, '_blank', 'noopener,noreferrer'); }
    catch (cause) { setErrorMessage(cause instanceof ApiError ? cause.message : 'Secure download is unavailable.'); }
    finally { setDownloadBusy(null); }
  }
  return <div>
    <div className="page-header"><div><div className="eyebrow">PROOF, WHEN YOU NEED IT</div><h1>Documents &amp; insurance</h1><p>Keep insurance, PUCC, registration, and service documents with the vehicle.</p></div><div className="page-header-action"><button className="btn-primary" onClick={() => setOpen(true)}><UploadCloud size={16} /> Upload document</button></div></div>
    {errorMessage && <div className="inline-error">{errorMessage}</div>}
    <div className="setup-inline">Files are stored privately. Downloads use a short-lived link and remain restricted to your account.</div>
    <div className="panel table-panel"><div className="table-toolbar"><p>{items.length} stored {items.length === 1 ? 'document' : 'documents'}</p><select className="form-select filter-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter documents by vehicle"><option value="all">All vehicles</option>{vehicleLoad.data.items.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model}</option>)}</select></div><LoadState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && (items.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>DOCUMENT</th><th>TYPE</th><th>VEHICLE</th><th>EXPIRY / RENEWAL</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{items.map((item) => { const days = item.expiryDate ? daysUntil(String(item.expiryDate)) : null; return <tr key={item.id}><td><strong><FileText size={13} /> {String(item.name)}</strong></td><td><span className="tag-chip">{String(item.kind)}</span></td><td>{String(item.vehicle ?? vehicleLoad.data.items.find((v) => v.id === item.vehicleId)?.make ?? 'Vehicle')}</td><td>{formatDate(String(item.expiryDate ?? ''))}</td><td>{days === null ? <span className="status-chip">No expiry set</span> : days < 0 ? <span className="status-chip overdue">{Math.abs(days)} days overdue</span> : days <= 30 ? <span className="status-chip warn">Due in {days} days</span> : <span className="status-chip">In date</span>}</td><td><div className="table-actions"><button title="Secure download" onClick={() => void download(item.id)} disabled={downloadBusy === item.id}><ArrowDownToLine size={14} /></button><button className="danger" aria-label="Delete document" onClick={() => setRemoveItem(item)}><Trash2 size={14} /></button></div></td></tr>; })}</tbody></table></div> : <EmptyState title="No documents on file" detail="Store insurance, PUCC, registration, or a service invoice with the vehicle it belongs to." action={<button className="btn-quiet" onClick={() => setOpen(true)}><Plus size={13} /> Upload your first document</button>} />)}
    </div>
    <UploadModal open={open} onClose={() => setOpen(false)} vehicles={vehicleLoad.data.items} presetVehicleId={presetVehicleId} onSaved={reload} />
    <ConfirmDialog open={Boolean(removeItem)} onClose={() => setRemoveItem(null)} onConfirm={remove} busy={busy} title="Delete this document?" message={`Delete the stored file “${removeItem?.name ?? ''}” and its record? This removes the private file and cannot be undone.`} />
  </div>;
}

function UploadModal({ open, onClose, vehicles, presetVehicleId, onSaved }: { open: boolean; onClose: () => void; vehicles: Vehicle[]; presetVehicleId: string; onSaved: () => void }) {
  const [vehicleId, setVehicleId] = useState(presetVehicleId);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('Insurance');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null);
    if (!file) { setError('Choose a PDF or supported image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('The file must be under 5 MB.'); return; }
    setBusy(true);
    try { await uploadDocument(file, { vehicleId, name: name || file.name, kind, expiryDate }); onSaved(); onClose(); setFile(null); setName(''); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'The document could not be uploaded.'); }
    finally { setBusy(false); }
  }
  return <Modal open={open} onClose={onClose} title="Upload a vehicle document"><form onSubmit={submit}><div className="form-grid">
    <div className="field-row span-2"><label>Vehicle *</label><select className="form-select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required><option value="">Choose a vehicle</option>{vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.make} {vehicle.model} · {vehicle.registration}</option>)}</select></div>
    <div className="field-row"><label>Document type *</label><select className="form-select" value={kind} onChange={(e) => setKind(e.target.value)}>{['Insurance','PUCC','Registration','Service invoice','Other'].map((item) => <option key={item}>{item}</option>)}</select></div>
    <div className="field-row"><label>Expiry date</label><input className="form-control" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
    <div className="field-row span-2"><label>Display name</label><input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2026 insurance policy" maxLength={120} /></div>
    <div className="field-row span-2"><label>File *</label><div className="file-drop"><UploadCloud size={20} /><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required /><span>PDF, JPG, PNG, or WEBP · Maximum 5 MB</span></div></div>
  </div>{error && <div className="inline-error">{error}</div>}<div className="modal-actions"><button className="btn-quiet" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="btn-primary" type="submit" disabled={busy || !vehicles.length}>{busy ? 'Uploading securely…' : 'Upload document'}<UploadCloud size={14} /></button></div></form></Modal>;
}
