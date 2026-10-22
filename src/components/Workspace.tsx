import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Bell, CarFront, ChevronRight, FileText, LayoutDashboard, LifeBuoy, LogOut, Menu, ShieldCheck, Sparkles, Wallet, Wrench, X } from 'lucide-react';
import { useAuth } from '../auth-context';
import { LiveClock } from '../ui';

const mainItems = [
  { to: '/app', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/app/vehicles', label: 'My vehicles', Icon: CarFront },
  { to: '/app/services', label: 'Service history', Icon: Wrench },
  { to: '/app/expenses', label: 'Expense tracker', Icon: Wallet },
  { to: '/app/documents', label: 'Documents', Icon: FileText },
  { to: '/app/reminders', label: 'Reminders', Icon: Bell },
  { to: '/app/reports', label: 'Reports', Icon: BarChart3 },
];

export function Workspace() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname.split('/').filter(Boolean).at(-1) ?? 'app';
  const pageName = page === 'app' ? 'Dashboard' : page === 'vehicles' ? 'My vehicles' : page === 'assistant' ? 'AI Assistant' : page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ');
  const initials = user?.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'VD';

  async function logout() {
    setSigningOut(true);
    try { await signOut(); } finally { setSigningOut(false); navigate('/login', { replace: true }); }
  }

  return <div className="workspace-frame">
    {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`side-nav ${menuOpen ? 'side-nav-open' : ''}`}>
      <NavLink to="/app" className="brand-lockup" onClick={() => setMenuOpen(false)}><span className="brand-mark"><Wrench size={17} /></span><span>vehicle<span className="brand-light">desk</span></span></NavLink>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="side-nav-links">{mainItems.map(({ to, label, Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{label === 'Reminders' && <span className="nav-dot" />}</NavLink>)}</nav>
      <div className="nav-caption nav-caption-spaced">PLANNING</div>
      <nav className="side-nav-links"><NavLink to="/app/assistant" className={({ isActive }) => `nav-link-item nav-ai ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><Sparkles size={17} strokeWidth={1.8} /><span>AI Assistant</span><ChevronRight className="nav-chevron" size={14} /></NavLink><NavLink to="/app/profile" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><Activity size={17} strokeWidth={1.8} /><span>Profile &amp; settings</span></NavLink>{user?.role === 'admin' && <NavLink to="/app/admin" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><ShieldCheck size={17} /><span>Admin dashboard</span></NavLink>}<NavLink to="/app/support" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><LifeBuoy size={17} /><span>Feedback &amp; support</span></NavLink></nav>
      <div className="nav-bottom-note"><div className="note-mark"><ShieldCheck size={16} /></div><div><strong>Built around your records</strong><span>Private to your account.</span></div></div>
      <div className="nav-profile"><div className="avatar avatar-small">{initials}</div><div className="nav-profile-info"><strong>{user?.name}</strong><span>{user?.role === 'admin' ? 'Administrator' : 'Vehicle owner'}</span></div><button className="icon-button logout-button" title="Sign out" onClick={logout} disabled={signingOut}><LogOut size={16} /></button></div>
    </aside>
    <section className="workspace-body">
      <header className="workspace-topbar"><button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><div className="topbar-context"><span>VEHICLE DESK <i>/</i> {pageName.toUpperCase()}</span><strong>{pageName}</strong></div><div className="topbar-right"><LiveClock /><NavLink to="/app/reminders" aria-label="View reminders" className="topbar-bell"><Bell size={18} /><span className="bell-indicator" /></NavLink><NavLink to="/app/profile" className="topbar-account"><span className="avatar">{initials}</span><span className="topbar-user-name">{user?.name.split(' ')[0]}</span></NavLink><button className="icon-button topbar-signout" title="Sign out" onClick={logout} disabled={signingOut}><LogOut size={17} /></button></div></header>
      <main className="workspace-content"><Outlet /></main>
    </section>
    <nav className="mobile-bottom-nav" aria-label="Primary navigation">{mainItems.slice(0, 5).map(({ to, label, Icon, end }) => <NavLink key={to} to={to} end={end}><Icon size={18} /><span>{label === 'Service history' ? 'Services' : label === 'My vehicles' ? 'Vehicles' : label}</span></NavLink>)}</nav>
  </div>;
}
