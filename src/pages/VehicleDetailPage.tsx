import { useState } from 'react';
import { ArrowLeft, BellRing, CarFront, FileText, Pencil, Plus, UploadCloud, Wallet, Wrench } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLoad, formatDate, formatINR, LoadState, EmptyState } from '../ui';
import type { Vehicle } from '../types';
import type { RecordItem } from '../types';
import { RecordModal } from '../components/RecordModal';

type Detail = { vehicle: Vehicle; services: RecordItem[]; expenses: RecordItem[]; documents: RecordItem[] };
export function VehicleDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad<Detail | null>(`/vehicles/${id}`, null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [vehicleEditOpen, setVehicleEditOpen] = useState(false);
  const vehicle = data?.vehicle;
  if (loading) return <LoadState loading error={null} />;
  if (error || !data || !vehicle) return <div><Link to="/app/vehicles" className="back-link"><ArrowLeft size={15} /> My vehicles</Link><div className="inline-error">{error ?? 'This vehicle could not be found.'}</div><button className="btn-quiet" onClick={() => void reload()}>Try again</button></div>;

  return <div>
    <Link to="/app/vehicles" className="back-link"><ArrowLeft size={15} /> My vehicles</Link>
    <div className="page-header" style={{ marginTop: 17 }}><div><div className="eyebrow">VEHICLE DETAILS</div><h1>{vehicle.make} {vehicle.model}</h1><p>One place for the vehicle’s service history, expenses, and renewals.</p></div><button className="btn-quiet" onClick={() => setVehicleEditOpen(true)}><Pencil size={14} /> Edit vehicle</button></div>
    <div className="detail-hero"><span className="vehicle-avatar"><CarFront size={25} /></span><div><h2>{vehicle.year} {vehicle.make} {vehicle.model}</h2><p>{vehicle.registration} <span>·</span> {vehicle.status}</p></div><span className="status-chip" style={{ marginLeft: 'auto' }}>{vehicle.fuelType}</span></div>
    <div className="detail-actions"><button className="btn-quiet" onClick={() => setServiceOpen(true)}><Wrench size={14} /> Add service record</button><button className="btn-quiet" onClick={() => setExpenseOpen(true)}><Wallet size={14} /> Add expense</button><button className="btn-quiet" onClick={() => navigate('/app/documents', { state: { vehicleId: vehicle.id } })}><UploadCloud size={14} /> Upload document</button><button className="btn-quiet" onClick={() => navigate('/app/reminders', { state: { vehicleId: vehicle.id } })}><BellRing size={14} /> Set reminder</button></div>
    <div className="detail-grid"><section className="panel"><div className="panel-head"><div><h2>Vehicle information</h2><p>Key details and renewal dates</p></div></div><div className="detail-info"><Info label="REGISTRATION" value={vehicle.registration} /><Info label="FUEL TYPE" value={vehicle.fuelType} /><Info label="MODEL YEAR" value={String(vehicle.year)} /><Info label="ODOMETER" value={`${Number(vehicle.odometer).toLocaleString('en-IN')} km`} /><Info label="PURCHASE DATE" value={formatDate(vehicle.purchaseDate)} /><Info label="REGISTRATION DATE" value={formatDate(vehicle.registrationDate)} /><Info label="INSURANCE EXPIRY" value={formatDate(vehicle.insuranceExpiry)} /><Info label="PUCC EXPIRY" value={formatDate(vehicle.puccExpiry)} /></div></section><section className="panel"><div className="panel-head"><div><h2>Record totals</h2><p>From the saved entries for this vehicle</p></div></div><div className="detail-info"><Info label="SERVICE RECORDS" value={String(data.services.length)} /><Info label="SERVICE COST" value={formatINR(data.services.reduce((sum, item) => sum + Number(item.cost || 0), 0))} /><Info label="EXPENSE ENTRIES" value={String(data.expenses.length)} /><Info label="EXPENSE TOTAL" value={formatINR(data.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0))} /></div></section></div>
    <div className="detail-grid"><section className="panel"><div className="panel-head"><div><h2>Service history</h2><p>Newest records first</p></div><button onClick={() => setServiceOpen(true)}><Plus size={13} /> Add</button></div>{data.services.length ? <div className="timeline">{data.services.slice(0, 8).map((item) => <div className="timeline-item" key={item.id}><span className="timeline-dot" /><span className="timeline-copy"><strong>{String(item.serviceType)}</strong><span>{formatDate(String(item.date))} · {Number(item.odometer).toLocaleString('en-IN')} km</span></span><span className="timeline-cost">{formatINR(Number(item.cost))}</span></div>)}</div> : <EmptyState title="No service entries yet" detail="Add the first record to begin this vehicle’s maintenance timeline." />}</section>
      <section className="panel"><div className="panel-head"><div><h2>Documents &amp; expenses</h2><p>Recent vehicle-linked items</p></div><Link to="/app/documents">All documents</Link></div>{data.expenses.length ? <div className="recent-list">{data.expenses.slice(0, 5).map((item) => <div className="recent-item" key={item.id}><span className="recent-icon"><Wallet size={14} /></span><span className="recent-copy"><strong>{String(item.description)}</strong><span>{String(item.category)} · {formatDate(String(item.date))}</span></span><span className="recent-amount">{formatINR(Number(item.amount))}</span></div>)}</div> : <EmptyState title="No expenses recorded" detail="Vehicle-specific costs will appear here." />}{data.documents.slice(0, 3).map((doc) => <div className="document-mini" key={doc.id}><FileText size={14} /><span>{String(doc.name)}</span><span>{String(doc.kind)}</span></div>)}</section></div>
    <RecordModal open={serviceOpen} kind="service" vehicles={[vehicle]} presetVehicleId={vehicle.id} onClose={() => setServiceOpen(false)} onSaved={reload} />
    <RecordModal open={expenseOpen} kind="expense" vehicles={[vehicle]} presetVehicleId={vehicle.id} onClose={() => setExpenseOpen(false)} onSaved={reload} />
    <RecordModal open={vehicleEditOpen} kind="vehicle" initial={vehicle as RecordItem} onClose={() => setVehicleEditOpen(false)} onSaved={reload} />
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="detail-info-item"><span>{label}</span><strong>{value || '—'}</strong></div>; }
