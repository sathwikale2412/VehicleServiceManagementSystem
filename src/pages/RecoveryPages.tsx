import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Wrench } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, send } from '../api';
import { useAuth } from '../auth-context';

export function ForgotPasswordPage() {
  const { status } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(null); setMessage(null);
    try {
      const result = await send<{ message: string }>('/auth/forgot-password', { email });
      setMessage(result.message);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="recovery-page"><Link to="/" className="brand-lockup"><span className="brand-mark"><Wrench size={18} /></span><span>vehicle<span className="brand-light">desk</span></span></Link><div className="recovery-card"><Link to="/login" className="back-link"><ArrowLeft size={15} /> Back to sign in</Link><div className="eyebrow">ACCOUNT RECOVERY</div><h1>Find your way back in.</h1><p>Enter the email linked to your Vehicle Desk account. If an account matches, we'll send a one-time reset link.</p>{!status?.emailConfigured && <div className="setup-notice"><strong>Password-reset email is not configured</strong><span>An administrator must add the email delivery settings before reset links can be sent.</span></div>}{error && <div className="inline-error">{error}</div>}{message && <div className="success-notice"><CheckCircle2 size={17} />{message}</div>}<form onSubmit={submit} className="auth-form"><label>Email address<input className="form-control" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required /></label><button className="btn-primary auth-submit" disabled={busy || !status?.emailConfigured}>{busy ? 'Sending…' : 'Send reset instructions'}<ArrowRight size={17} /></button></form><p className="auth-privacy"><ShieldCheck size={15} /> Reset links expire after 30 minutes.</p></div><div className="auth-bottom">Vehicle Desk <span>·</span> Service records, in order</div></div>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null); setSuccess(null);
    if (password !== confirmation) { setError('The passwords do not match.'); return; }
    setBusy(true);
    try {
      const result = await send<{ message: string }>('/auth/reset-password', { token, password });
      setSuccess(result.message);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'This link may have expired. Request a new one.'); }
    finally { setBusy(false); }
  }
  return <div className="recovery-page"><Link to="/" className="brand-lockup"><span className="brand-mark"><Wrench size={18} /></span><span>vehicle<span className="brand-light">desk</span></span></Link><div className="recovery-card"><Link to="/login" className="back-link"><ArrowLeft size={15} /> Back to sign in</Link><div className="eyebrow">CHOOSE A NEW PASSWORD</div><h1>Secure your account.</h1><p>Choose a new password with at least 12 characters.</p>{!token && <div className="inline-error">This reset link is incomplete. Request a new one.</div>}{error && <div className="inline-error">{error}</div>}{success && <div className="success-notice"><CheckCircle2 size={17} />{success}</div>}<form onSubmit={submit} className="auth-form"><label>New password<input className="form-control" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required /></label><label>Confirm new password<input className="form-control" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required /></label><button className="btn-primary auth-submit" disabled={busy || !token || Boolean(success)}>{busy ? 'Updating…' : 'Update password'}<ArrowRight size={17} /></button></form></div><div className="auth-bottom">Vehicle Desk <span>·</span> Service records, in order</div></div>;
}
