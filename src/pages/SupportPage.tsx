import { useState, type FormEvent } from 'react';
import { CheckCircle2, LifeBuoy, Plus, Send } from 'lucide-react';
import { ApiError, send } from '../api';
import type { RecordItem } from '../types';
import { EmptyState, formatDate, LoadState, useLoad } from '../ui';

export function SupportPage() {
  const { data, loading, error, reload } = useLoad<{ items: RecordItem[] }>('/support', { items: [] });
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setFormError(null); setSent(false);
    try { await send('/support', { subject, message }); setSubject(''); setMessage(''); setSent(true); await reload(); }
    catch (cause) { setFormError(cause instanceof ApiError ? cause.message : 'Your message could not be sent.'); }
    finally { setBusy(false); }
  }
  return <div><div className="page-header"><div><div className="eyebrow">WE’RE LISTENING</div><h1>Feedback &amp; support</h1><p>Send a note about your account or share an idea to make the logbook better.</p></div></div>
    <div className="support-layout"><section className="panel profile-card"><div className="support-title"><span className="assistant-orb"><LifeBuoy size={17} /></span><div><h2>Send a message</h2><p>Messages are private to your account and the support team.</p></div></div>{formError && <div className="inline-error">{formError}</div>}{sent && <div className="success-notice"><CheckCircle2 size={15} />Your message is in the support queue.</div>}<form onSubmit={submit} className="support-form"><div className="field-row"><label>Subject</label><input className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} minLength={3} placeholder="What can we help with?" required /></div><div className="field-row"><label>Message</label><textarea className="form-control" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={3000} minLength={10} placeholder="Include the details that will help us understand…" required /><span className="field-hint">{message.length}/3000 characters</span></div><button className="btn-primary" disabled={busy}><Send size={14} />{busy ? 'Sending…' : 'Send to support'}</button></form></section>
      <section className="panel"><div className="panel-head"><div><h2>Your messages</h2><p>Only requests submitted from your account</p></div></div><LoadState loading={loading} error={error} onRetry={reload} />{!loading && !error && (data.items.length ? data.items.map((item) => <article className="support-ticket" key={item.id}><div><h3>{String(item.subject)}</h3><p>{String(item.message)}</p>{item.adminReply && <p className="admin-reply"><strong>Support reply:</strong> {String(item.adminReply)}</p>}<span className="field-hint">Sent {formatDate(String(item.createdAt ?? ''))}</span></div><span className={`status-chip ${item.status === 'Resolved' ? '' : 'warn'}`}>{String(item.status ?? 'Open')}</span></article>) : <EmptyState title="No messages yet" detail="If you contact support, the request and its status will appear here." />)}</section></div>
  </div>;
}
