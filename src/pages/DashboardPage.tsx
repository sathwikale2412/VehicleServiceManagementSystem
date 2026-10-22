import { useState } from 'react';
import { ArrowRight, BellRing, CarFront, CircleAlert, ClipboardList, Sparkles, Wrench } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { get, send, ApiError } from '../api';
import { useAuth } from '../auth-context';
import type { DashboardData, Reminder } from '../types';
import { EmptyState, formatDate, formatINR, LiveClock, LoadState, useLoad, daysUntil } from '../ui';

const empty: DashboardData = { vehicleCount: 0, reminderCount: 0, currentMonthTotal: 0, yearTotal: 0, reminders: [], recentServices: [], vehicles: [] };

export function DashboardPage() {
  const { user, status, refreshStatus } = useAuth();
  const { data, loading, error, reload } = useLoad<DashboardData>('/dashboard', empty);
  const [insight, setInsight] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const navigate = useNavigate();
  async function askAi() {
    setAiBusy(true); setAiError(null); setInsight(null);
    try { const result = await send<{ insight: string }>('/ai/insights', {}); setInsight(result.insight); }
    catch (cause) { setAiError(cause instanceof ApiError ? cause.message : 'AI insights are temporarily unavailable.'); void refreshStatus(); }
    finally { setAiBusy(false); }
  }
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return <div>
    {!status?.databaseConfigured && <div className="setup-inline">The application is running, but MongoDB and session secrets still need to be configured before account data can load.</div>}
    <div className="dashboard-greeting"><div><div className="eyebrow">YOUR VEHICLE WORKSPACE</div><h1>{greeting}, {user?.name.split(' ')[0]}.</h1><p>Here’s what’s happening across your vehicles.</p></div><LiveClock /></div>
    <LoadState loading={loading} error={error} onRetry={reload} />
    {!loading && !error && <div className="dashboard-layout">
      <div className="dashboard-main">
        <div className="metric-row">
          <Metric icon={<CarFront size={15} />} label="ACTIVE VEHICLES" value={String(data.vehicleCount).padStart(2, '0')} foot={data.vehicleCount === 1 ? '1 vehicle on file' : `${data.vehicleCount} vehicles on file`} />
          <Metric icon={<BellRing size={15} />} label="UPCOMING REMINDERS" value={String(data.reminderCount).padStart(2, '0')} foot={data.reminderCount ? 'Next due date is visible below' : 'No upcoming dates recorded'} warning={data.reminderCount > 0} />
          <Metric icon={<ClipboardList size={15} />} label="THIS MONTH" value={formatINR(data.currentMonthTotal)} foot="Expenses recorded this month" />
          <Metric icon={<Wrench size={15} />} label="THIS YEAR" value={formatINR(data.yearTotal)} foot="Service & vehicle spending" />
        </div>
        <section className="panel" style={{ marginTop: 14 }}><div className="panel-head"><div><h2>Coming up</h2><p>Services and documents to keep on your radar</p></div><Link to="/app/reminders">All reminders <ArrowRight size={13} /></Link></div>
          {data.reminders.length ? <div className="due-list">{data.reminders.slice(0, 4).map((reminder) => <DueItem key={reminder.id} reminder={reminder} />)}</div> : <EmptyState title="Nothing due just yet" detail="Add a service or renewal reminder and it will show here." action={<button className="btn-quiet" onClick={() => navigate('/app/reminders')}>Set a reminder <ArrowRight size={13} /></button>} />}
        </section>
        <section className="panel" style={{ marginTop: 14 }}><div className="panel-head"><div><h2>Recent service history</h2><p>Your latest maintenance entries</p></div><Link to="/app/services">View service history <ArrowRight size={13} /></Link></div>
          {data.recentServices.length ? <div className="recent-list">{data.recentServices.slice(0, 4).map((record: any) => <div className="recent-item" key={record.id}><span className="recent-icon"><Wrench size={14} /></span><span className="recent-copy"><strong>{record.serviceType}</strong><span>{record.vehicle} · {formatDate(record.date)}</span></span><span className="recent-amount">{formatINR(Number(record.cost))}</span></div>)}</div> : <EmptyState title="Your logbook is ready" detail="Add your first service entry to start building a useful vehicle history." action={<Link to="/app/services" className="btn-quiet">Add service record <ArrowRight size={13} /></Link>} />}
        </section>
        <section className="section-label"><h2>Your garage</h2><Link to="/app/vehicles">View all <ArrowRight size={13} /></Link></section>
        {data.vehicles.length ? <div className="vehicle-grid">{data.vehicles.map((vehicle) => <Link className="vehicle-card" to={`/app/vehicles/${vehicle.id}`} key={vehicle.id}><div className="vehicle-card-top"><span className="vehicle-avatar"><CarFront size={20} /></span><span className="status-chip">{vehicle.status}</span></div><h3>{vehicle.make} {vehicle.model}</h3><span className="vehicle-registration">{vehicle.registration}</span><div className="vehicle-meta"><span>{vehicle.year} · {vehicle.fuelType}</span><span>{Number(vehicle.odometer).toLocaleString('en-IN')} km</span></div><span className="vehicle-card-link">Open vehicle <ArrowRight size={13} /></span></Link>)}</div> : <div className="panel"><EmptyState title="No vehicles yet" detail="Create your first vehicle record to see its history and upcoming renewals here." action={<Link to="/app/vehicles" className="btn-quiet">Add a vehicle <ArrowRight size={13} /></Link>} /></div>}
      </div>
      <aside className="dashboard-side">
        <div className="assistant-card"><div className="assistant-card-head"><span className="assistant-orb"><Sparkles size={16} /></span><div><strong>AI Assistant</strong><span>Insights from your records</span></div></div><p>Look for useful patterns in service history, expenses, and upcoming dates.</p>{insight ? <div className="assistant-insight">{insight}</div> : aiError ? <div className="assistant-insight">{aiError}</div> : <div className="assistant-insight">Your insights will be based on the vehicles and entries in this account—not generic predictions.</div>}<button className="btn-quiet" onClick={askAi} disabled={aiBusy}>{aiBusy ? 'Reviewing records…' : 'Get maintenance insights'} <ArrowRight size={13} /></button><span className="assistant-disclaimer">Generated suggestions are informational, not a substitute for professional mechanical advice.</span></div>
        <div className="health-card"><div className="health-ring">{data.vehicleCount ? 'OK' : '—'}</div><div><strong>Records at a glance</strong><span>{data.vehicleCount ? `${data.vehicleCount} active · ${data.reminderCount} dates ahead` : 'Your logbook is ready for its first entry'}</span></div></div>
        {!status?.aiConfigured && <div className="setup-inline">AI insights become available after the Vercel AI Gateway is configured.</div>}
        {!status?.blobConfigured && <div className="setup-inline">Private document storage needs its Vercel Blob store before uploads are available.</div>}
        {data.yearTotal > 0 && <div className="panel"><div className="panel-head"><div><h2>Spending this year</h2><p>Across recorded expenses</p></div></div><div style={{ padding: '0 18px 17px' }}><strong className="mono" style={{ fontSize: 20, color: '#415b50' }}>{formatINR(data.yearTotal)}</strong><div className="tiny-bars" style={{ marginTop: 10 }}><i /><i /><i /><i /><i /><i /><i /></div></div></div>}
      </aside>
    </div>}
  </div>;
}

function Metric({ icon, label, value, foot, warning = false }: { icon: React.ReactNode; label: string; value: string; foot: string; warning?: boolean }) {
  return <div className="metric-card"><div className="metric-head"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong className="metric-value">{value}</strong><span className={`metric-foot ${warning ? 'warning' : ''}`}>{foot}</span></div>;
}

function DueItem({ reminder }: { reminder: Reminder }) {
  const days = daysUntil(reminder.dueDate);
  return <div className="due-item"><span className={`due-icon ${days > 7 ? 'green' : ''}`}>{days <= 7 ? <CircleAlert size={15} /> : <BellRing size={15} />}</span><span className="due-copy"><strong>{reminder.title}</strong><span>{reminder.vehicle ?? reminder.kind} · {formatDate(reminder.dueDate)}</span></span><span className="due-date">{days === 0 ? 'Today' : `${days} days`}</span></div>;
}
