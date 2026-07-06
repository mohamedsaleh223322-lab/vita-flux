import { BarChart3, Layers, Bell, Shield } from 'lucide-react';
import authBg from '../../assets/auth-left-panel.png';
import icon0 from '../../assets/icon0.png';

const FEATURES = [
  {
    icon: <BarChart3 size={18} strokeWidth={2.2} />,
    title: 'Real-time inventory tracking',
    desc: 'Monitor blood stock in real-time',
  },
  {
    icon: <Layers size={18} strokeWidth={2.2} />,
    title: 'FIFO batch management',
    desc: 'Smart stock rotation & expiry control',
  },
  {
    icon: <Bell size={18} strokeWidth={2.2} />,
    title: 'Expiry alerts & analytics',
    desc: 'Get notified and make data-driven decisions',
  },
  {
    icon: <Shield size={18} strokeWidth={2.2} />,
    title: 'Secure & reliable',
    desc: 'Enterprise-grade security for your data',
  },
];

function EcgLine() {
  return (
    <svg
      className="lap-ecg"
      viewBox="0 0 120 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 10 L45 10 L52 3 L59 17 L66 3 L73 10 L120 10"
        stroke="#E53935"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LeftAuthPanel({ mode = 'login' }) {
  return (
    <aside
      className="lap-root"
      style={{
        backgroundImage: `url(${authBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      aria-label="Auth branding panel"
    >
      {/* Content */}
      <div className="lap-content">
        {/* Logo */}
        <img src={icon0} alt="Vita Flux logo" className="lap-logo" />

        {/* Brand Name */}
        <h2 className="lap-title">
          <span className="lap-title-white">VITA</span>{' '}
          <span className="lap-title-red">FLUX</span>
        </h2>

        {/* Tagline */}
        <p className="lap-tagline">Smart Blood. Better Care.</p>

        {/* ECG divider line */}
        <EcgLine />

        {/* Mode-specific Description Paragraph */}
        {mode === 'register' ? (
          <p className="lap-hero">
            Join the network.
            <br />
            Connect your hospital
            <br />
            and start managing your
            <br />
            blood inventory today.
          </p>
        ) : (
          <p className="lap-hero">
            Advanced Blood Bank Management.
            <br />
            Secure hospital operations in real time.
          </p>
        )}

        {/* Features */}
        <ul className="lap-features" role="list">
          {FEATURES.map((f) => (
            <li key={f.title} className="lap-feature">
              <span className="lap-feature-icon" aria-hidden="true">
                {f.icon}
              </span>
              <div className="lap-feature-body">
                <span className="lap-feature-title">{f.title}</span>
                <span className="lap-feature-desc">{f.desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
