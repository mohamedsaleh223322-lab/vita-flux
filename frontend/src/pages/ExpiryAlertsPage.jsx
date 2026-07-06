import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, Droplets, Trash2, Loader2, Info } from 'lucide-react';
import { apiFetch } from '../api/apiFetch.js';
import '../styles/expiry-alerts.css';

const Modal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4 text-red-600">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <p className="text-slate-600 mb-6 font-medium leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Dispose'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ExpiryAlertsPage() {
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [expired, setExpired] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dispose State
  const [disposeModal, setDisposeModal] = useState({ isOpen: false, batchId: null });
  const [disposeLoading, setDisposeLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [expiringRes, expiredRes, lowStockRes] = await Promise.all([
        apiFetch('/api/expiry/expiring-soon'),
        apiFetch('/api/expiry/expired'),
        apiFetch('/api/expiry/low-stock')
      ]);
      
      setExpiringSoon(expiringRes || []);
      setExpired(expiredRes || []);
      setLowStock(lowStockRes || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch expiry data:', err);
      setError('Unable to load inventory alerts. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDispose = async () => {
    const { batchId } = disposeModal;
    if (!batchId) return;

    setDisposeLoading(true);
    try {
      await apiFetch(`/api/expiry/dispose/${batchId}`, { method: 'PATCH' });
      // Instant UI update
      setExpired(prev => prev.filter(b => b.batch_id !== batchId));
      setDisposeModal({ isOpen: false, batchId: null });
    } catch (err) {
      alert('Failed to dispose batch: ' + err.message);
    } finally {
      setDisposeLoading(false);
    }
  };

  if (loading && !expiringSoon.length && !expired.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest">Analyzing Inventory...</p>
      </div>
    );
  }

  return (
    <div className="-m-8 min-h-full bg-[#F8FAFC] p-6 font-sans sm:p-8">
      <div className="w-full space-y-8">
        <header>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">EXPIRY & ALERTS</h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-wider text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Real-time Inventory Monitoring
          </p>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 text-red-700 font-bold shadow-sm">
            <Info className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Section 1: Expiring Soon */}
        <section className="expiry-section theme-warning">
          <div className="section-header">
            <Clock className="icon" />
            <h2>Expiring Soon (Next 7 Days)</h2>
          </div>
          {expiringSoon.length > 0 ? (
            <div className="expiry-grid">
              {expiringSoon.map((batch) => (
                <div key={batch.batch_id} className="batch-card">
                  <div className="card-top">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="blood-type-badge">{batch.blood_type}</span>
                    </div>
                    <span className="days-badge days-warning">{batch.days_left} Days Left</span>
                  </div>
                  <div className="card-details">
                    <div className="detail-row">
                      <span className="detail-label">Blood ID</span>
                      <span className="detail-value text-[10px] font-mono">{batch.batch_code || 'Pending'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Expiry Date</span>
                      <span className="detail-value">{new Date(batch.expiry_date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Quantity</span>
                      <span className="detail-value">1 Bag</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message="No expiring blood bags" />}
        </section>

      {/* Section 2: Expired Batches */}
      <section className="expiry-section theme-danger">
        <div className="section-header">
          <AlertTriangle className="icon" />
          <h2>Expired Batches (Action Required)</h2>
        </div>
        {expired.length > 0 ? (
          <div className="expiry-grid">
            {expired.map((batch) => (
              <div key={batch.batch_id} className="batch-card">
                <div className="card-top">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="blood-type-badge bg-red-50 text-red-600 border border-red-100">{batch.blood_type}</span>
                  </div>
                  <span className="days-badge days-danger">Expired {batch.expired_days_ago} days ago</span>
                </div>
                <div className="card-details">
                  <div className="detail-row">
                    <span className="detail-label">Blood ID</span>
                    <span className="detail-value text-[10px] font-mono">{batch.batch_code || 'Pending'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Expiry Date</span>
                    <span className="detail-value">{new Date(batch.expiry_date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className="detail-value text-red-600 uppercase">Awaiting Disposal</span>
                  </div>
                </div>
                <button 
                  onClick={() => setDisposeModal({ isOpen: true, batchId: batch.batch_id })}
                  className="dispose-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  Dispose Bag
                </button>
              </div>
            ))}
          </div>
        ) : <EmptyState message="No expired blood bags" />}
      </section>

      {/* Section 3: Low Stock Alerts */}
      <section className="expiry-section theme-critical">
        <div className="section-header">
          <Droplets className="icon" />
          <h2>Low Stock Alerts (Aggregated)</h2>
        </div>
        {lowStock.length > 0 ? (
          <div className="expiry-grid">
            {lowStock.map((alert) => (
              <div key={alert.blood_type} className="low-stock-card">
                <div className="low-stock-info">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <Droplets className="w-5 h-5 fill-red-600" />
                    </div>
                    <h3>{alert.blood_type}</h3>
                  </div>
                  <p>Critical: {alert.remaining_bags} bags left</p>
                </div>
                <div className="warning-indicator">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState message="No low stock alerts" />}
      </section>

      {/* Confirmation Modal */}
      <Modal
        isOpen={disposeModal.isOpen}
        onClose={() => setDisposeModal({ isOpen: false, batchId: null })}
        onConfirm={handleDispose}
        loading={disposeLoading}
        title="Confirm Disposal"
        message="Are you sure you want to dispose this blood bag? This action is permanent and will be logged in the system records."
      />
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <div className="flex flex-col items-center gap-2">
        <Info className="w-8 h-8 opacity-20" />
        {message}
      </div>
    </div>
  );
}
