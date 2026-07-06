import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api/apiFetch.js';
import { getToken } from '../lib/authStorage.js';
import placeholderIcon from '../assets/icon 3.png';
import { useSidebar } from '../App.jsx';
import { compressImage } from '../utils/imageProcessor.js';

// Allowed image MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TIME_OPTIONS = [
  '12:00 AM','01:00 AM','02:00 AM','03:00 AM','04:00 AM','05:00 AM',
  '06:00 AM','07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM',
  '06:00 PM','07:00 PM','08:00 PM','09:00 PM','10:00 PM','11:00 PM',
];

const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function HospitalProfilePage() {
  const fileInputRef = useRef(null);
  const { sidebarOpen } = useSidebar();
  const sidebarWidth = sidebarOpen ? 260 : 64;

  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageError, setImageError] = useState(false);

  const [phone, setPhone]           = useState('');
  const [open24Hours, setOpen24Hours] = useState(false);
  const [openingTime, setOpeningTime] = useState('08:00 AM');
  const [closingTime, setClosingTime] = useState('08:00 PM');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [infoMsg, setInfoMsg]   = useState('');
  const [errMsg, setErrMsg]     = useState('');
  const [pwInfoMsg, setPwInfoMsg] = useState('');
  const [pwErrMsg, setPwErrMsg]   = useState('');

  useEffect(() => { fetchProfile(); }, []);
  useEffect(() => { setImageError(false); }, [previewImage]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const data = await apiFetch(`${BASE_URL}/api/hospitals/profile`);
      setProfile(data);
      setPhone(data.phone || '');
      setOpen24Hours(data.open24Hours || false);
      setOpeningTime(data.openingTime || '08:00 AM');
      setClosingTime(data.closingTime || '08:00 PM');
      if (data.imageUrl) setPreviewImage(data.imageUrl);
    } catch (e) {
      setErrMsg('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // ── 1. Format validation ──────────────────────────────────────────────
    if (!ALLOWED_TYPES.includes(file.type)) {
      showErr('Unsupported file type. Please upload JPG, PNG, or WebP.');
      e.target.value = '';
      return;
    }

    // ── 2. Size validation ────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showErr(`File exceeds ${MAX_FILE_SIZE_MB} MB limit.`);
      e.target.value = '';
      return;
    }

    // ── 3. Instant local preview ──────────────────────────────────────────
    const previousImage = previewImage;
    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);
    setImgUploading(true);

    try {
      // ── 4. Client-side compression ──────────────────────────────────────
      let uploadBlob;
      try {
        uploadBlob = await compressImage(file);
      } catch (compressErr) {
        // Fallback: use original file if compression fails
        console.warn('Compression failed, using raw file:', compressErr);
        uploadBlob = file;
      }

      // ── 5. Upload compressed image ──────────────────────────────────────
      const formData = new FormData();
      // Send as a named file so multer picks it up correctly
      formData.append('image', uploadBlob, 'hospital-image.jpg');

      const res = await fetch(`${BASE_URL}/api/hospitals/profile/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed.');

      // ── 6. Success: cache-busting URL ───────────────────────────────────
      const bustedUrl = `${data.imageUrl}?t=${Date.now()}`;
      setPreviewImage(bustedUrl);
      showInfo('Image updated successfully.');
    } catch (err) {
      // ── 7. Failure: revert to previous image ────────────────────────────
      showErr('Upload failed. Please try again.');
      setPreviewImage(previousImage);
    } finally {
      setImgUploading(false);
      e.target.value = '';
      // ── Memory cleanup: revoke the local object URL ─────────────────────
      URL.revokeObjectURL(localUrl);
    }
  }

  async function handleSave() {
    setSaving(true); setInfoMsg(''); setErrMsg('');
    try {
      await apiFetch(`${BASE_URL}/api/hospitals/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ phone, open24Hours, openingTime, closingTime }),
      });
      showInfo('Changes saved successfully.');
    } catch (e) {
      showErr(e.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!profile) return;
    setPhone(profile.phone || '');
    setOpen24Hours(profile.open24Hours || false);
    setOpeningTime(profile.openingTime || '08:00 AM');
    setClosingTime(profile.closingTime || '08:00 PM');
    setInfoMsg(''); setErrMsg('');
  }

  async function handlePasswordSave() {
    setPwInfoMsg(''); setPwErrMsg('');
    try {
      await apiFetch(`${BASE_URL}/api/hospitals/profile/password`, {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      setPwInfoMsg('Password updated successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (e) {
      setPwErrMsg(e.message || 'Failed to update password.');
    }
  }

  const showInfo = (msg) => { setInfoMsg(msg); setTimeout(() => setInfoMsg(''), 4000); };
  const showErr  = (msg) => { setErrMsg(msg);  setTimeout(() => setErrMsg(''), 5000);  };

  function resolveImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('blob:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const parsed = new URL(url);
        if (parsed.pathname.startsWith('/uploads/')) return `${BASE_URL}${parsed.pathname}${parsed.search}`;
        return url;
      } catch { return url; }
    }
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #f1f5f9', borderTopColor: '#E53935',
          borderRadius: '50%', animation: 'hp-spin 0.8s linear infinite', margin: '0 auto'
        }} />
        <p style={{ color: '#94a3b8', marginTop: 14, fontSize: 14 }}>Loading profile…</p>
      </div>
      <style>{`@keyframes hp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes hp-spin { to { transform: rotate(360deg); } }

        .hp-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06);
          transition: box-shadow .2s ease;
        }

        .hp-input {
          width: 100%; box-sizing: border-box;
          padding: 11px 14px;
          border: 1.5px solid #e8ecf0;
          border-radius: 10px;
          font-size: 14px; color: #1e293b; background: #fff;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          font-family: inherit;
        }
        .hp-input:focus {
          border-color: #E53935;
          box-shadow: 0 0 0 3px rgba(229,57,53,.10);
        }
        .hp-input::placeholder { color: #94a3b8; }

        .hp-select {
          width: 100%; box-sizing: border-box;
          padding: 11px 36px 11px 14px;
          border: 1.5px solid #e8ecf0;
          border-radius: 10px;
          font-size: 14px; color: #1e293b; background: #fff;
          outline: none; cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          transition: border-color .15s, box-shadow .15s;
          font-family: inherit;
        }
        .hp-select:focus { border-color: #E53935; box-shadow: 0 0 0 3px rgba(229,57,53,.10); }
        .hp-select:disabled { opacity: .45; cursor: not-allowed; pointer-events: none; }

        .hp-label {
          display: block; font-size: 12px; font-weight: 600;
          color: #64748b; margin-bottom: 7px; letter-spacing: .02em;
          text-transform: uppercase;
        }

        .hp-btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          padding: 11px 22px;
          background: linear-gradient(135deg, #E53935 0%, #c62828 100%);
          color: #fff; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
          box-shadow: 0 2px 8px rgba(229,57,53,.30);
          transition: transform .15s, box-shadow .15s, opacity .15s;
        }
        .hp-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(229,57,53,.38);
        }
        .hp-btn-primary:disabled { opacity: .6; cursor: not-allowed; }

        .hp-btn-ghost {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          padding: 11px 20px;
          background: transparent; color: #E53935;
          border: 1.5px solid #E53935; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: background .15s, transform .15s;
        }
        .hp-btn-ghost:hover { background: #fef2f2; transform: translateY(-1px); }

        .hp-btn-outline-sm {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px;
          background: #fff; color: #E53935;
          border: 1.5px solid #E53935; border-radius: 9px;
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: background .15s;
        }
        .hp-btn-outline-sm:hover { background: #fef2f2; }

        .hp-pw-wrap { position: relative; }
        .hp-pw-wrap .hp-input { padding-right: 44px; }
        .hp-pw-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px;
          display: flex; align-items: center;
        }
        .hp-pw-eye:hover { color: #64748b; }

        .hp-toast-ok {
          display: flex; align-items: center; gap: 8px;
          background: #f0fdf4; border: 1.5px solid #86efac; color: #166534;
          border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 600;
          margin-bottom: 16px;
        }
        .hp-toast-err {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1.5px solid #fca5a5; color: #dc2626;
          border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 600;
          margin-bottom: 16px;
        }

        .hp-section-title {
          font-size: 15px; font-weight: 700; color: #0f172a;
        }
        .hp-section-sub {
          font-size: 12.5px; color: #94a3b8; margin-top: 2px;
        }

        .hp-icon-bg {
          width: 38px; height: 38px; border-radius: 10px;
          background: #fef2f2;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .hp-camera-btn {
          position: absolute; bottom: 12px; right: 12px;
          width: 38px; height: 38px; border-radius: 50%;
          background: #fff; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 10px rgba(0,0,0,.18);
          transition: transform .15s;
        }
        .hp-camera-btn:hover { transform: scale(1.1); }

        .hp-badge-open {
          display: inline-flex; align-items: center;
          background: #ecfdf5; color: #16a34a;
          border-radius: 20px; padding: 2px 10px;
          font-size: 11px; font-weight: 700; letter-spacing: .02em;
        }

        .hp-bottom-bar {
          position: fixed; bottom: 0; right: 0;
          height: 60px; background: rgba(255,255,255,.95);
          backdrop-filter: blur(8px);
          border-top: 1px solid #f1f5f9;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          z-index: 100;
          box-shadow: 0 -4px 24px rgba(0,0,0,.06);
          transition: left .3s ease;
        }

        .hp-tips-box {
          background: #fdf8ff; border: 1.5px solid #ede9fe;
          border-radius: 10px; padding: 12px 14px;
          display: flex; align-items: flex-start; gap: 10px;
        }

        @media (max-width: 900px) {
          .hp-bottom-grid { grid-template-columns: 1fr !important; }
          .hp-hero-grid   { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .hp-pw-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── PAGE WRAPPER ── */}
      <div style={{ width: '100%', boxSizing: 'border-box', paddingBottom: 80 }}>

        {/* ── HERO CARD ── */}
        <div className="hp-card" style={{ padding: 28, marginBottom: 24 }}>
          <div
            className="hp-hero-grid"
            style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, alignItems: 'center' }}
          >
            {/* Image column */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '100%', height: 210, borderRadius: 16,
                overflow: 'hidden', background: '#f8fafc', position: 'relative',
              }}>
                {previewImage && !imageError ? (
                  <img
                    src={resolveImageUrl(previewImage)}
                    alt="Hospital"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <img src={placeholderIcon} alt="Upload" style={{ width: 64, opacity: .35 }} />
                    <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>No image yet</span>
                  </div>
                )}
                <button className="hp-camera-btn" onClick={() => fileInputRef.current?.click()} title="Change image">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
                {imgUploading && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(255,255,255,.75)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{
                      width: 32, height: 32, border: '3px solid #f1f5f9',
                      borderTopColor: '#E53935', borderRadius: '50%',
                      animation: 'hp-spin .8s linear infinite'
                    }} />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={handleImageChange}
              />
            </div>

            {/* Info column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div className="hp-icon-bg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
                    <path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4"/>
                    <path d="M10 10h4"/><path d="M12 8v4"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                    {profile?.name || 'Hospital Name'}
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Hospital profile image</div>
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f8fafc', border: '1.5px solid #e8ecf0',
                borderRadius: 10, padding: '10px 14px', marginBottom: 20
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  This image appears in the mobile app &bull;&nbsp;
                  <strong style={{ color: '#475569' }}>Recommended: 800×600px</strong>
                  &nbsp;&bull; JPG or PNG, max 2 MB
                </span>
              </div>

              <button className="hp-btn-outline-sm" onClick={() => fileInputRef.current?.click()}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                Change Image
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM TWO-COLUMN GRID ── */}
        <div
          className="hp-bottom-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}
        >

          {/* ── LEFT: HOSPITAL INFORMATION ── */}
          <div className="hp-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div className="hp-icon-bg">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
                  <path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4"/>
                  <path d="M10 10h4"/><path d="M12 8v4"/>
                </svg>
              </div>
              <div>
                <div className="hp-section-title">Hospital Information</div>
                <div className="hp-section-sub">Contact details and schedule</div>
              </div>
            </div>

            {infoMsg && <div className="hp-toast-ok">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {infoMsg}
            </div>}
            {errMsg && <div className="hp-toast-err">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errMsg}
            </div>}

            {/* Phone */}
            <div style={{ marginBottom: 22 }}>
              <label className="hp-label">Phone Number</label>
              <input
                className="hp-input" type="tel" value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 01012345678"
              />
            </div>

            {/* Separator */}
            <div style={{ height: 1, background: '#f1f5f9', marginBottom: 22 }} />

            {/* Working Hours */}
            <div>
              <label className="hp-label">Working Hours</label>

              {/* 24h toggle */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', marginBottom: 14,
                background: open24Hours ? '#f0fdf4' : '#f8fafc',
                border: `1.5px solid ${open24Hours ? '#86efac' : '#e8ecf0'}`,
                borderRadius: 10, padding: '11px 14px',
                transition: 'background .2s, border-color .2s',
              }}>
                <input
                  id="open24" type="checkbox" checked={open24Hours}
                  onChange={e => setOpen24Hours(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#E53935', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: open24Hours ? '#16a34a' : '#475569', flex: 1 }}>
                  Open 24 Hours
                </span>
                {open24Hours && <span className="hp-badge-open">Always open</span>}
              </label>

              <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginBottom: 16 }}>
                When enabled, the hospital appears as open around the clock in the mobile app.
              </p>

              {/* Time pickers */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 28px 1fr', gap: 10, alignItems: 'end',
                opacity: open24Hours ? .4 : 1,
                pointerEvents: open24Hours ? 'none' : 'auto',
                transition: 'opacity .2s',
              }}>
                <div>
                  <label className="hp-label">Opens</label>
                  <select className="hp-select" value={openingTime} onChange={e => setOpeningTime(e.target.value)} disabled={open24Hours}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 3, color: '#94a3b8', fontSize: 18, fontWeight: 300 }}>→</div>
                <div>
                  <label className="hp-label">Closes</label>
                  <select className="hp-select" value={closingTime} onChange={e => setClosingTime(e.target.value)} disabled={open24Hours}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: SECURITY ── */}
          <div className="hp-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div className="hp-icon-bg">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div className="hp-section-title">Security</div>
                <div className="hp-section-sub">Change your account password</div>
              </div>
            </div>

            {pwInfoMsg && <div className="hp-toast-ok">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {pwInfoMsg}
            </div>}
            {pwErrMsg && <div className="hp-toast-err">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {pwErrMsg}
            </div>}

            {/* Current Password */}
            <div style={{ marginBottom: 18 }}>
              <label className="hp-label">Current Password</label>
              <div className="hp-pw-wrap">
                <input
                  className="hp-input"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
                <button className="hp-pw-eye" type="button" onClick={() => setShowCurrent(!showCurrent)}>
                  <EyeIcon open={showCurrent} />
                </button>
              </div>
            </div>

            {/* New + Confirm */}
            <div className="hp-pw-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label className="hp-label">New Password</label>
                <div className="hp-pw-wrap">
                  <input
                    className="hp-input"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password"
                  />
                  <button className="hp-pw-eye" type="button" onClick={() => setShowNew(!showNew)}>
                    <EyeIcon open={showNew} />
                  </button>
                </div>
              </div>
              <div>
                <label className="hp-label">Confirm New</label>
                <div className="hp-pw-wrap">
                  <input
                    className="hp-input"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat password"
                  />
                  <button className="hp-pw-eye" type="button" onClick={() => setShowConfirm(!showConfirm)}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>
            </div>

            {/* Password tips */}
            <div className="hp-tips-box" style={{ marginBottom: 20 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', marginBottom: 3 }}>Password tips</div>
                <div style={{ fontSize: 12, color: '#8b5cf6', lineHeight: 1.6 }}>
                  Use 8+ characters &bull; Mix letters, numbers &amp; symbols &bull; Avoid reusing old passwords
                </div>
              </div>
            </div>

            <button className="hp-btn-primary" style={{ width: '100%' }} onClick={handlePasswordSave}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTION BAR ── */}
      <div
        className="hp-bottom-bar"
        style={{ left: sidebarWidth }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="hp-btn-primary" onClick={handleSave} disabled={saving}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button className="hp-btn-ghost" onClick={handleReset}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reset
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 11 11 13 15 9"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Your information is secure</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>All data is encrypted and stored safely</div>
          </div>
        </div>
      </div>
    </>
  );
}
