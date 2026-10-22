import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Wrench } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api';
import { useAuth } from '../auth-context';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const { signIn, register, status, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const needsSetup = !status?.databaseConfigured || !status?.sessionConfigured;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isRegister) await register(name, email, password);
      else await signIn(email, password);
      const target = (location.state as { from?: string } | null)?.from || '/app';
      navigate(target, { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  return <div className="auth-layout">
    <aside className="auth-aside"><Link to="/" className="brand-lockup"><span className="brand-mark"><Wrench size={18} /></span><span>vehicle<span className="brand-light">desk</span></span></Link><div className="auth-aside-copy"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR OWNERSHIP LOGBOOK</div><h1>Better records.<br /><em>Fewer surprises.</em></h1><p>Bring service history, expenses, and renewal dates into one calm, practical workspace.</p></div><div className="auth-aside-foot"><ShieldCheck size={17} /><span>Your vehicles. Your records. Private to you.</span></div></aside>
    <main className="auth-main"><Link to="/" className="back-link"><ArrowLeft size={15} /> Back to home</Link><div className="auth-form-wrap"><div className="eyebrow">{isRegister ? 'CREATE YOUR ACCOUNT' : 'YOUR WORKSPACE'}</div><h2>{isRegister ? 'Start with the basics.' : 'Pick up where you left off.'}</h2><p className="auth-intro">{isRegister ? 'A few details, then your vehicle records have a home.' : 'Sign in to review your vehicles and what is coming up.'}</p>
      {needsSetup && <div className="setup-notice"><strong>Account setup is incomplete</strong><span>MongoDB and secure session settings must be configured in Vercel before sign-up or sign-in can work.</span></div>}
      {authError && !needsSetup && <div className="inline-error auth-message">{authError}</div>}
      {error && <div className="inline-error auth-message">{error}</div>}
      <form onSubmit={submit} className="auth-form">
        {isRegister && <label>Full name<input className="form-control" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required /></label>}
        <label>Email address<input className="form-control" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required /></label>
        <label>Password<input className="form-control" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={isRegister ? 12 : 1} maxLength={128} required />{isRegister && <span className="field-note">Use at least 12 characters.</span>}</label>
        {!isRegister && <div className="auth-inline"><span>Use your account email and password.</span><Link to="/forgot-password">Forgot password?</Link></div>}
        <button className="btn-primary auth-submit" type="submit" disabled={busy || needsSetup}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}{!busy && <ArrowRight size={17} />}</button>
      </form>
      <div className="auth-switch">{isRegister ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New to Vehicle Desk? <Link to="/register">Create an account</Link></>}</div>
      <p className="auth-privacy"><ShieldCheck size={15} /> Passwords are protected; account access is private.</p>
    </div><div className="auth-bottom">Vehicle Desk <span>·</span> Service records, in order</div></main>
  </div>;
}
