// src/pages/Home.jsx — KARIBU landing page
import React from 'react';
import {
  ArrowRight,
  BellRing,
  Building2,
  Clock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
import './Home.css';

const FEATURES = [
  {
    icon: Zap,
    tone: 'amber',
    title: 'Zero-Friction Joining',
    text: 'No app, no account. Pick a business, choose a service, and your live ticket is in your hands in seconds.',
  },
  {
    icon: Clock,
    tone: 'emerald',
    title: 'Live Countdown Tickets',
    text: 'Watch your estimated wait shrink in real time. The engine recalculates the moment anything changes.',
  },
  {
    icon: BellRing,
    tone: 'blue',
    title: 'Auto-Promotion Engine',
    text: 'When your slot arrives, the queue promotes you automatically. Staff never touch a "next" button.',
  },
  {
    icon: Smartphone,
    tone: 'purple',
    title: 'Wait Anywhere',
    text: 'Skip the crowded waiting room. Grab a coffee, keep an eye on your phone, and walk in when it matters.',
  },
  {
    icon: ShieldCheck,
    tone: 'emerald',
    title: 'Multi-Tenant Security',
    text: 'Every queue, service, and staff record is strictly partitioned per business — verified at the database layer.',
  },
  {
    icon: Building2,
    tone: 'amber',
    title: 'Built for Any Business',
    text: 'Salons, clinics, banks, government offices — if people queue, KARIBU makes the wait disappear.',
  },
];

const STEPS = [
  {
    title: 'Find your business',
    text: 'Search participating businesses nearby and browse their live menus of services with durations.',
  },
  {
    title: 'Grab your ticket',
    text: 'Enter just your name — no signup — and receive a real-time digital ticket like K001 with a countdown.',
  },
  {
    title: 'Walk in right on time',
    text: 'Track your live position and ETA from anywhere. Arrive exactly when the queue is ready for you.',
  },
];

const STATS = [
  { value: '0', suffix: ' forms', label: 'Customers never register to queue' },
  { value: '5', suffix: 's', label: 'Queue engine heartbeat — always in sync' },
  { value: '100', suffix: '%', label: 'Real-time updates via Socket.IO' },
];

export default function Home({ onGetStarted }) {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <div className="khome">
      {/* ================= Hero ================= */}
      <section className="khome-hero">
        <div className="container khome-hero-inner">
          <div>
            
             { /*<span className="khome-eyebrow-dot" />
              <Sparkles size={15} />
              <span>Next-Generation Smart Queue Platform</span> */}
            

            <h1 className="khome-title">
              Skip the line.{' '}
              <span className="khome-grad">Before you even arrive.</span>
            </h1>

            <p className="khome-sub">
              KARIBU turns physical waiting rooms into live digital tickets.
              Pick your place, watch the countdown from anywhere, and walk in
              right when it's your turn — no app, no account, no queue anxiety.
            </p>

            <div className="khome-cta-row">
              <button className="khome-cta khome-cta-primary" onClick={onGetStarted}>
                Join a Queue Now
                <ArrowRight size={18} />
              </button>
              <a className="khome-cta khome-cta-ghost" href="#how-it-works">
                See How It Works
              </a>
            </div>

            <div className="khome-trust">
              <span className="khome-trust-dot" />
              <span>
                <strong>Live now</strong> · Kibali Executive Salon &amp; Barber is serving customers today
              </span>
            </div>
          </div>

          {/* ---- Hero visual: live ticket mock ---- */}
          <div className="khome-visual" aria-hidden="true">
            <div className="khome-ticket">
              <div className="khome-ticket-head">
                <div className="khome-ticket-biz">
                  <span className="khome-ticket-biz-icon">
                    <Building2 size={17} />
                  </span>
                  Kibali Salon &amp; Barber
                </div>
                <span className="khome-live"><i />LIVE</span>
              </div>

              <div className="khome-ticket-label">Your Ticket</div>
              <div className="khome-ticket-no">K003</div>

              <div className="khome-ticket-row">
                <span className="khome-muted">Service</span>
                <span className="khome-val">Executive Haircut</span>
              </div>
              <div className="khome-ticket-row">
                <span className="khome-muted">Estimated wait</span>
                <span className="khome-val">~18 min</span>
              </div>

              <div className="khome-progress">
                <div className="khome-progress-bar">
                  <div className="khome-progress-fill" />
                </div>
                <div className="khome-progress-meta">
                  <span>2 customers ahead of you</span>
                  <span className="khome-eta">NOW SERVING K002</span>
                </div>
              </div>
            </div>

            <div className="khome-chip khome-chip-1">
              <BellRing size={15} />
              Auto-called at your turn
            </div>
            <div className="khome-chip khome-chip-2">
              <Clock size={15} />
              Staff-adjustable timing
            </div>
          </div>
        </div>
      </section>

      {/* ================= Stats band ================= */}
      <section className="container">
        <div className="khome-stats">
          {STATS.map((s) => (
            <div key={s.label} className="khome-stat">
              <div className="khome-stat-value">
                {s.value}
                <span>{s.suffix}</span>
              </div>
              <div className="khome-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= Features ================= */}
      <section className="khome-section container">
        <div className="khome-section-head">
          <span className="khome-section-kicker">Why KARIBU</span>
          <h2 className="khome-section-title">Waiting, reinvented</h2>
          <p className="khome-section-sub">
            An automatic queue engine that works for customers and staff alike —
            no manual button-pressing, no lost tickets, no guesswork.
          </p>
        </div>

        <div className="khome-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="khome-feature" onMouseMove={handleMouseMove}>
              <div className={`khome-feature-icon ${f.tone}`}>
                <f.icon size={22} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= How it works ================= */}
      <section id="how-it-works" className="khome-section container">
        <div className="khome-section-head">
          <span className="khome-section-kicker">How it works</span>
          <h2 className="khome-section-title">Three steps to a painless wait</h2>
          <p className="khome-section-sub">
            From discovery to walking through the door — the whole flow takes
            less than a minute on any phone.
          </p>
        </div>

        <div className="khome-steps">
          {STEPS.map((s) => (
            <div key={s.title} className="khome-step">
              <div className="khome-step-no" />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= Final CTA ================= */}
      <section className="container" style={{ paddingBottom: '4rem' }}>
        <div className="khome-final">
          <h2>Ready to stop waiting around?</h2>
          <p>
            Join a live queue in seconds, or bring KARIBU to your business and
            give your customers their time back. New businesses start with a
            1-month free trial.
          </p>
          <button className="khome-cta khome-cta-primary" onClick={onGetStarted}>
            Get Started Free
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
