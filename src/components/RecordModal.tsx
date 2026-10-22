import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { ApiError, send } from '../api';
import type { RecordItem, Vehicle } from '../types';
import { Modal } from './Modal';

type Kind = 'vehicle' | 'service' | 'expense' | 'reminder';
type Props = { open: boolean; kind: Kind; onClose: () => void; onSaved: () => void; vehicles?: Vehicle[]; initial?: RecordItem | null; presetVehicleId?: string };
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const kinds = {
  vehicle: { title: 'Add a vehicle', endpoint: 'vehicles' },
  service: { title: 'Add service record', endpoint: 'services' },
  expense: { title: 'Record an expense', endpoint: 'expenses' },
  reminder: { title: 'Set a reminder', endpoint: 'reminders' },
} as const;

export function RecordModal({ open, kind, onClose, onSaved, vehicles = [], initial = null, presetVehicleId = '' }: Props) {
  const vehicleOptions = useMemo(() => vehicles, [vehicles]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(initial?.id);
  useEffect(() => {
    if (!open) return;
    const record: Record<string, any> = initial ?? {};
    const recordVehicleId = typeof record.vehicleId === 'object' && record.vehicleId
      ? String(record.vehicleId._id ?? record.vehicleId.id ?? '')
      : String(record.vehicleId ?? '');
    setValues({
      make: String(record.make ?? ''), model: String(record.model ?? ''), year: String(record.year ?? new Date().getFullYear()),
      registration: String(record.registration ?? ''), fuelType: String(record.fuelType ?? 'Petrol'), odometer: String(record.odometer ?? ''),
      purchaseDate: String(record.purchaseDate ?? ''), registrationDate: String(record.registrationDate ?? ''), insuranceExpiry: String(record.insuranceExpiry ?? ''), puccExpiry: String(record.puccExpiry ?? ''), status: String(record.status ?? 'Active'), notes: String(record.notes ?? ''),
      vehicleId: recordVehicleId || presetVehicleId || '', date: String(record.date ?? today()), serviceType: String(record.serviceType ?? ''), cost: String(record.cost ?? ''), workshop: String(record.workshop ?? ''),
      category: String(record.category ?? 'Service'), description: String(record.description ?? ''), amount: String(record.amount ?? ''),
      kind: String(record.kind ?? 'Service'), title: String(record.title ?? ''), dueDate: String(record.dueDate ?? today()),
    });
    setError(null);
  }, [open, initial, presetVehicleId, kind]);

  function update(key: string, value: string) { setValues((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    let payload: Record<string, unknown>;
    if (kind === 'vehicle') payload = {
      make: values.make, model: values.model, year: Number(values.year), registration: values.registration, fuelType: values.fuelType,
      odometer: Number(values.odometer), purchaseDate: values.purchaseDate, registrationDate: values.registrationDate,
      insuranceExpiry: values.insuranceExpiry, puccExpiry: values.puccExpiry, status: values.status, notes: values.notes,
    };
    else if (kind === 'service') payload = {
      vehicleId: values.vehicleId, date: values.date, serviceType: values.serviceType, odometer: Number(values.odometer), cost: Number(values.cost), workshop: values.workshop, notes: values.notes,
    };
    else if (kind === 'expense') payload = {
      vehicleId: values.vehicleId, date: values.date, category: values.category, description: values.description, amount: Number(values.amount),
    };
    else payload = { vehicleId: values.vehicleId, kind: values.kind, title: values.title, dueDate: values.dueDate, notes: values.notes, dismissed: false };
    try {
      const endpoint = `/${kinds[kind].endpoint}${editing ? `/${initial!.id}` : ''}`;
      await send(endpoint, payload, editing ? 'PATCH' : 'POST');
      onSaved(); onClose();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Could not save this record.'); }
    finally { setBusy(false); }
  }

  const title = editing ? `Edit ${kind === 'vehicle' ? 'vehicle' : kind === 'service' ? 'service record' : kind}` : kinds[kind].title;
  return <Modal open={open} onClose={onClose} title={title} wide={kind === 'vehicle'}><form onSubmit={submit}>
    {error && <div className="inline-error">{error}</div>}
    {kind === 'vehicle' && <div className="form-grid">
      <Field label="Make" required><input className="form-control" value={values.make ?? ''} onChange={(e) => update('make', e.target.value)} maxLength={60} required /></Field>
      <Field label="Model" required><input className="form-control" value={values.model ?? ''} onChange={(e) => update('model', e.target.value)} maxLength={80} required /></Field>
      <Field label="Year" required><input className="form-control" type="number" min="1950" max={new Date().getFullYear() + 1} value={values.year ?? ''} onChange={(e) => update('year', e.target.value)} required /></Field>
      <Field label="Registration number" required><input className="form-control" value={values.registration ?? ''} onChange={(e) => update('registration', e.target.value.toUpperCase())} maxLength={30} required /></Field>
      <Field label="Fuel type" required><select className="form-select" value={values.fuelType} onChange={(e) => update('fuelType', e.target.value)}>{['Petrol','Diesel','Electric','Hybrid','CNG','Other'].map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Current odometer (km)" required><input className="form-control" type="number" min="0" value={values.odometer ?? ''} onChange={(e) => update('odometer', e.target.value)} required /></Field>
      <Field label="Purchase date"><input className="form-control" type="date" value={values.purchaseDate ?? ''} onChange={(e) => update('purchaseDate', e.target.value)} /></Field>
      <Field label="Registration date"><input className="form-control" type="date" value={values.registrationDate ?? ''} onChange={(e) => update('registrationDate', e.target.value)} /></Field>
      <Field label="Insurance expiry"><input className="form-control" type="date" value={values.insuranceExpiry ?? ''} onChange={(e) => update('insuranceExpiry', e.target.value)} /></Field>
      <Field label="PUCC expiry"><input className="form-control" type="date" value={values.puccExpiry ?? ''} onChange={(e) => update('puccExpiry', e.target.value)} /></Field>
      <Field label="Status"><select className="form-select" value={values.status} onChange={(e) => update('status', e.target.value)}><option>Active</option><option>Inactive</option></select></Field>
      <Field label="Notes" wide><textarea className="form-control" rows={2} value={values.notes ?? ''} onChange={(e) => update('notes', e.target.value)} maxLength={1000} /></Field>
    </div>}
    {kind === 'service' && <div className="form-grid">
      <Field label="Vehicle" required><VehicleSelect vehicles={vehicleOptions} value={values.vehicleId ?? ''} onChange={(value) => update('vehicleId', value)} /></Field>
      <Field label="Service date" required><input className="form-control" type="date" value={values.date ?? today()} onChange={(e) => update('date', e.target.value)} required /></Field>
      <Field label="Service / work" required><input className="form-control" value={values.serviceType ?? ''} onChange={(e) => update('serviceType', e.target.value)} placeholder="e.g. Oil & filter change" maxLength={80} required /></Field>
      <Field label="Odometer (km)" required><input className="form-control" type="number" min="0" value={values.odometer ?? ''} onChange={(e) => update('odometer', e.target.value)} required /></Field>
      <div className="span-2 field-hint">For one vehicle, dated service readings must not move backwards.</div>
      <Field label="Cost (₹)" required><input className="form-control" type="number" min="0" step="0.01" value={values.cost ?? ''} onChange={(e) => update('cost', e.target.value)} required /></Field>
      <Field label="Workshop"><input className="form-control" value={values.workshop ?? ''} onChange={(e) => update('workshop', e.target.value)} maxLength={120} /></Field>
      <Field label="Notes" wide><textarea className="form-control" rows={2} value={values.notes ?? ''} onChange={(e) => update('notes', e.target.value)} maxLength={1000} /></Field>
    </div>}
    {kind === 'expense' && <div className="form-grid">
      <Field label="Vehicle"><VehicleSelect vehicles={vehicleOptions} value={values.vehicleId ?? ''} onChange={(value) => update('vehicleId', value)} optional /></Field>
      <Field label="Date" required><input className="form-control" type="date" value={values.date ?? today()} onChange={(e) => update('date', e.target.value)} required /></Field>
      <Field label="Category" required><select className="form-select" value={values.category} onChange={(e) => update('category', e.target.value)}>{['Service','Fuel','Repair','Insurance','Parts','Other'].map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Amount (₹)" required><input className="form-control" type="number" min="0" step="0.01" value={values.amount ?? ''} onChange={(e) => update('amount', e.target.value)} required /></Field>
      <Field label="Description" wide required><input className="form-control" value={values.description ?? ''} onChange={(e) => update('description', e.target.value)} maxLength={160} required /></Field>
    </div>}
    {kind === 'reminder' && <div className="form-grid">
      <Field label="Vehicle"><VehicleSelect vehicles={vehicleOptions} value={values.vehicleId ?? ''} onChange={(value) => update('vehicleId', value)} optional /></Field>
      <Field label="Reminder type" required><select className="form-select" value={values.kind} onChange={(e) => update('kind', e.target.value)}>{['Service','Insurance renewal','PUCC renewal','Other'].map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Reminder title" wide required><input className="form-control" value={values.title ?? ''} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Annual service" maxLength={120} required /></Field>
      <Field label="Due date" required><input className="form-control" type="date" value={values.dueDate ?? today()} onChange={(e) => update('dueDate', e.target.value)} required /></Field>
      <Field label="Notes"><input className="form-control" value={values.notes ?? ''} onChange={(e) => update('notes', e.target.value)} maxLength={500} /></Field>
    </div>}
    {vehicles.length === 0 && kind !== 'vehicle' && <div className="setup-inline">Add a vehicle first so this record can be linked to it.</div>}
    <div className="modal-actions"><button className="btn-quiet" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="btn-primary" type="submit" disabled={busy || (kind !== 'vehicle' && !vehicles.length)}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Save record'}<ArrowRight size={15} /></button></div>
  </form></Modal>;
}

function Field({ label, children, wide = false, required = false }: { label: string; children: React.ReactNode; wide?: boolean; required?: boolean }) {
  return <div className={`field-row ${wide ? 'span-2' : ''}`}><label>{label}{required ? ' *' : ''}</label>{children}</div>;
}

function VehicleSelect({ vehicles, value, onChange, optional = false }: { vehicles: Vehicle[]; value: string; onChange: (value: string) => void; optional?: boolean }) {
  return <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)} required={!optional}><option value="">{optional ? 'Not linked' : 'Choose a vehicle'}</option>{vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.make} {vehicle.model} · {vehicle.registration}</option>)}</select>;
}
