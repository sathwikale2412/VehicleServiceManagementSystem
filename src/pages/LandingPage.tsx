import { ArrowRight, BellRing, BookOpenCheck, CarFront, ChartNoAxesCombined, ShieldCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

const capabilities = [
  { icon: CarFront, title: 'Every vehicle, one view', text: 'Keep registration details, documents, and history together instead of scattered across folders.' },
  { icon: BellRing, title: 'Renewals that stay visible', text: 'Track service dates, insurance renewals, and pollution certificates before they become urgent.' },
  { icon: ChartNoAxesCombined, title: 'Know where costs go', text: 'See maintenance spend by month and category, grounded in your own records.' },
];

export function LandingPage() {
  return <div className="landing-page">
    <header className="landing-nav wrap-width">
      <Link to="/" className="brand-lockup"><span className="brand-mark"><Wrench size={18} /></span><span>vehicle<span className="brand-light">desk</span></span></Link>
      <nav><Link to="/login">Sign in</Link><Link to="/register" className="btn-primary small">Create account <ArrowRight size={15} /></Link></nav>
    </header>
    <main>
      <section className="hero wrap-width">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> SERVICE RECORDS, IN ORDER</div>
          <h1>Keep the miles.<br /><em>Lose the paperwork.</em></h1>
          <p className="hero-lede">One clear place for every vehicle, every service, and every renewal coming up.</p>
          <div className="hero-actions"><Link to="/register" className="btn-primary">Create your workspace <ArrowRight size={17} /></Link><Link to="/login" className="quiet-link">I already have an account</Link></div>
          <div className="trust-line"><ShieldCheck size={16} /> Your records stay private to your account.</div>
        </div>
        <div className="hero-card" aria-label="Vehicle Desk dashboard preview">
          <div className="hero-card-top"><div><span className="eyebrow">MONDAY, 23 OCTOBER</span><h2>Good morning, Alex</h2></div><span className="tiny-status"><span /> All up to date</span></div>
          <div className="hero-stats"><div><span>MY VEHICLES</span><strong>02</strong><small>Both active</small></div><div><span>THIS MONTH</span><strong>₹4,850</strong><small>Across 3 entries</small></div></div>
          <div className="hero-reminder"><div className="reminder-icon"><BellRing size={16} /></div><div><strong>Insurance renewal</strong><small>Honda City · Due in 12 days</small></div><span className="reminder-arrow">↗</span></div>
          <div className="hero-service"><span className="service-marker" /><div><small>LAST SERVICE · 4 OCT</small><strong>Engine oil &amp; filter</strong><span>₹2,400 <i>·</i> Honda City</span></div><BookOpenCheck size={17} /> </div>
          <div className="hero-card-foot"><span className="tiny-bars"><i /><i /><i /><i /><i /><i /><i /></span><small>Maintenance history, at a glance</small></div>
        </div>
      </section>
      <section className="landing-strip"><div className="wrap-width landing-strip-inner"><span>BUILT FOR EVERYDAY OWNERSHIP</span><p>Less searching. Fewer missed dates. A better record of where your money goes.</p></div></section>
      <section className="capabilities wrap-width"><div className="section-intro"><div className="eyebrow">A CALMER WAY TO KEEP UP</div><h2>The small details add up.<br /><em>Keep them in one place.</em></h2></div><div className="capability-list">{capabilities.map(({ icon: Icon, title, text }, index) => <article className="capability" key={title}><span className="capability-index">0{index + 1}</span><span className="capability-icon"><Icon size={19} /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
      <section className="landing-bottom"><div className="wrap-width bottom-inner"><div><div className="eyebrow">START WITH WHAT YOU HAVE</div><h2>A clearer service history<br />starts with one record.</h2></div><Link to="/register" className="btn-primary">Set up your account <ArrowRight size={17} /></Link></div></section>
    </main>
    <footer className="landing-footer wrap-width"><Link to="/" className="brand-lockup"><span className="brand-mark"><Wrench size={16} /></span><span>vehicle<span className="brand-light">desk</span></span></Link><span>Service records, in order.</span><Link to="/support">Feedback &amp; support</Link></footer>
  </div>;
}
