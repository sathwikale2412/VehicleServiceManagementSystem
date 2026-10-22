import { useState } from 'react';
import { Check, Clock3, LifeBuoy, Users, CarFront, MessageSquareText } from 'lucide-react';
import { ApiError, send } from '../api';
import type { RecordItem } from '../types';
import { formatDate, LoadState, useLoad } from '../ui';

type AdminData = { userCount: number; vehicleCount: number; openSupport: number; recentSupport: RecordItem[] };
export function AdminPage() {
  const summary = useLoad<AdminData>('/admin/summary', { userCount: 0, vehicleCount: 0, openSupport: 0, recentSupport: [] });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});
  async function changeStatus(item: RecordItem, status: string) {
    setBusyId(item.id); setErrorMessage(null);
    try { await send(`/admin/support/${item.id}`, { status, adminReply: replies[item.id] ?? String(item.adminReply ?? '') }, 'PATCH'); await summary.reload(); }
    catch (cause) { setErrorMessage(cause instanceof ApiError ? cause.message : 'The support status could not be updated.'); }
    finally { setBusyId(null); }
  }
  return <div><div className="page-header"><div><div className="eyebrow">RESTRICTED WORKSPACE</div><h1>Admin dashboard</h1><p>Aggregate service health and support triage. Access is checked server-side.</p></div><span className="badge-admin">Administrator</span></div>
    {errorMessage && <div className="inline-error">{errorMessage}</div>}<LoadState loading={summary.loading} error={summary.error} onRetry={summary.reload} />{!summary.loading && !summary.error && <>
      <div className="metric-row" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))', marginBottom: 15 }}><div className="metric-inline"><span>ACTIVE ACCOUNTS</span><strong>{summary.data.userCount}</strong></div><div className="metric-inline"><span>ACTIVE VEHICLES</span><strong>{summary.data.vehicleCount}</strong></div><div className="metric-inline"><span>OPEN SUPPORT</span><strong>{summary.data.openSupport}</strong></div></div>
      <section className="panel"><div className="panel-head"><div><h2>Recent support requests</h2><p>Latest submitted tickets across accounts</p></div><LifeBuoy size={17} color="#779688" /></div>{summary.data.recentSupport.length ? summary.data.recentSupport.map((item) => <article className="admin-ticket" key={item.id}><div className="admin-ticket-heading"><div><h3>{String(item.subject)}</h3><span>{String(item.requester)} · {String(item.email)} · {formatDate(String(item.createdAt ?? ''))}</span></div><span className={`status-chip ${item.status === 'Resolved' ? '' : 'warn'}`}>{String(item.status ?? 'Open')}</span></div><p>{String(item.message)}</p><label className="admin-reply-editor">Reply to requester<textarea className="form-control" rows={2} value={replies[item.id] ?? String(item.adminReply ?? '')} onChange={(event) => setReplies((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={2000} placeholder="A short, helpful response…" /></label><div className="admin-ticket-actions"><select aria-label={`Change status for ${item.subject}`} className="form-select filter-select" defaultValue={String(item.status ?? 'Open')} id={`status-${item.id}`}><option>Open</option><option>In review</option><option>Resolved</option></select><button className="btn-quiet" onClick={() => { const value = (document.getElementById(`status-${item.id}`) as HTMLSelectElement)?.value; void changeStatus(item, value); }} disabled={busyId === item.id}>{busyId === item.id ? 'Saving…' : <><Check size={13} /> Save status &amp; reply</>}</button></div></article>) : <div className="empty-state"><span className="empty-icon"><MessageSquareText size={19} /></span><h3>No support requests</h3><p>New messages will appear here.</p></div>}</section>
      <p className="help-inline" style={{ marginTop: 12 }}>No passwords, document contents, or account secrets are exposed in this view. Do not use this dashboard to inspect private vehicle records.</p>
    </>}
  </div>;
}
