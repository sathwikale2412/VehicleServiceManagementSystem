import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import { ApiError, get } from './api';

export function useLoad<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await get<T>(path)); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Could not load this information.'); }
    finally { setLoading(false); }
  }, [path]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, setData, loading, error, reload };
}

export function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function daysUntil(value: string) {
  const due = new Date(`${value.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>;
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Inbox size={20} /></div><h3>{title}</h3><p>{detail}</p>{action}</div>;
}

export function LoadState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry?: () => void }) {
  if (loading) return <div className="load-state"><LoaderCircle className="spin" size={20} /> Loading your records</div>;
  if (error) return <div className="inline-error"><AlertCircle size={16} /><span>{error}</span>{onRetry && <button className="text-button" onClick={onRetry}>Retry</button>}</div>;
  return null;
}

export function formatClock(now: Date) {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
}

export function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  return <div className="live-time"><span>{new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(now)}</span><strong>{formatClock(now)}</strong></div>;
}
