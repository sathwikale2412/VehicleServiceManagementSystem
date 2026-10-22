import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, KeyRound, Save, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError, get, send } from '../api';
import type { User } from '../types';
import { useAuth } from '../auth-context';
import { LoadState, useLoad } from '../ui';

export function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const { data, loading, error, reload } = useLoad<{ user: User }>('/profile', { user: authUser! });
  const [name, setName] = useState(authUser?.name ?? '');
  const [phone, setPhone] = useState(authUser?.phone ?? '');
  const [address, setAddress] = useState(authUser?.address ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  useEffect(() => { if (data.user) { setName(data.user.name); setPhone(data.user.phone ?? ''); setAddress(data.user.address ?? ''); } }, [data.user]);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setFormError(null); setMessage(null);
    try { await send('/profile', { name, phone, address }, 'PATCH'); await refreshUser(); await reload(); setMessage('Profile details saved.'); }
    catch (cause) { setFormError(cause instanceof ApiError ? cause.message : 'Your profile could not be saved.'); }
    finally { setBusy(false); }
  }
  return <div>
    <div className="page-header"><div><div className="eyebrow">YOUR ACCOUNT</div><h1>Profile &amp; settings</h1><p>Manage the details attached to your Vehicle Desk account.</p></div></div>
    <div className="profile-layout"><nav className="panel profile-tabs" aria-label="Profile sections"><a className="profile-tab active" href="#profile"><UserRound size={15} /> Personal information</a><a className="profile-tab" href="#security"><ShieldCheck size={15} /> Security</a></nav><div className="profile-main"><section className="panel profile-card" id="profile"><h2>Personal information</h2><p>These details help keep your account records associated with you.</p><LoadState loading={loading} error={error} onRetry={reload} />{!loading && !error && <form onSubmit={save} className="form-grid"><div className="field-row"><label>Full name</label><input className="form-control" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} minLength={2} required /></div><div className="field-row"><label>Email address</label><input className="form-control" value={data.user.email} readOnly aria-describedby="email-note" /><span className="field-hint" id="email-note">Contact support if your sign-in email needs to change.</span></div><div className="field-row"><label>Phone</label><input className="form-control" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} /></div><div className="field-row"><label>Address</label><input className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={250} /></div><div className="field-row span-2">{formError && <div className="inline-error">{formError}</div>}{message && <div className="success-notice"><CheckCircle2 size={15} />{message}</div>}<button className="btn-primary" type="submit" disabled={busy}><Save size={14} />{busy ? 'Saving…' : 'Save changes'}</button></div></form>}</section>
      <section className="panel profile-card" id="security" style={{ marginTop: 13 }}><h2>Security &amp; account access</h2><p>Password changes happen through the expiring account-recovery link.</p><div className="security-row"><span className="security-icon"><KeyRound size={16} /></span><span><strong>Password reset</strong><small>A one-time link expires 30 minutes after it's requested.</small></span><Link className="btn-quiet" to="/forgot-password">Change password</Link></div><div className="security-row"><span className="security-icon"><ShieldCheck size={16} /></span><span><strong>Account role</strong><small>{authUser?.role === 'admin' ? 'Administrator access' : 'Vehicle owner access'}</small></span></div><p className="help-inline">Vehicle records and uploads are scoped to your account. Signing out ends this browser session.</p></section></div></div>
  </div>;
}
