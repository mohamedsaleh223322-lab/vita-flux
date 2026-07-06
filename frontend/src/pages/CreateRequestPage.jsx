import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { createRequest, getGovernorates, getHospitals } from '../api/requestsClient.js';
import RequestsPageHeader from '../components/requests/RequestsPageHeader.jsx';
import RequestsSelect, { RequestsDateField } from '../components/requests/RequestsFormControls.jsx';
import RequestsQuantityStepper from '../components/requests/RequestsQuantityStepper.jsx';
import ToastMessage from '../components/manage-inventory/ToastMessage.jsx';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const initialForm = {
  governorate: '',
  hospital: '',
  bloodType: '',
  quantity: 0,
  expiryDate: '',
};

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [governorates, setGovernorates] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loadingGovs, setLoadingGovs] = useState(true);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingGovs(true);
      try {
        const data = await getGovernorates();
        if (!cancelled) setGovernorates(data);
      } catch {
        if (!cancelled) setToast({ variant: 'error', message: 'Could not load governorates.' });
      } finally {
        if (!cancelled) setLoadingGovs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.governorate) {
      setHospitals([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoadingHospitals(true);
      try {
        const data = await getHospitals(form.governorate);
        if (!cancelled) setHospitals(data);
      } catch {
        if (!cancelled) setHospitals([]);
      } finally {
        if (!cancelled) setLoadingHospitals(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.governorate]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const hospitalDisabled = useMemo(
    () => !form.governorate || loadingHospitals,
    [form.governorate, loadingHospitals],
  );

  function validate() {
    const err = {};
    if (!form.governorate) err.governorate = 'Select a governorate.';
    if (!form.hospital) err.hospital = 'Select a hospital.';
    if (!form.bloodType) err.bloodType = 'Select a blood type.';
    if (!form.quantity || form.quantity < 1) err.quantity = 'Quantity must be at least 1.';
    if (!form.expiryDate) {
      err.expiryDate = 'Expiry date is required.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(form.expiryDate);
      if (selected < today) {
        err.expiryDate = 'Expiry date must be today or in the future.';
      }
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      setToast({ variant: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }
    setSubmitting(true);
    setToast(null);
    try {
      await createRequest({
        governorateId: Number(form.governorate),
        providerHospitalId: form.hospital,
        bloodType: form.bloodType,
        quantity: form.quantity,
        expiryDate: form.expiryDate,
      });
      navigate('/requests/success');
    } catch (error) {
      setToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Request failed.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {toast ? <ToastMessage variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}

      <RequestsPageHeader
        title="New Request"
        subtitle=""
        backTo="/requests"
        backLabel="Back"
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:p-8"
      >
        <div className="space-y-6">
          <div>
            <RequestsSelect
              label="Governorate"
              value={form.governorate}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  governorate: v,
                  hospital: '',
                }))
              }
              options={governorates}
              placeholder={loadingGovs ? 'Loading…' : 'Select Governorate'}
              disabled={loadingGovs || submitting}
              getValue={(o) => String(o.id)}
            />
            {fieldErrors.governorate ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.governorate}</p>
            ) : null}
          </div>

          <div>
            <RequestsSelect
              label="Hospital"
              value={form.hospital}
              onChange={(v) => setForm((f) => ({ ...f, hospital: v }))}
              options={hospitals}
              placeholder="Select Hospital"
              disabled={hospitalDisabled || submitting}
              getValue={(o) => String(o.id)}
              getLabel={(o) => o.name}
            />
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Hospitals will be shown based on the selected governorate
            </p>
            {fieldErrors.hospital ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.hospital}</p>
            ) : null}
          </div>

          <div>
            <RequestsSelect
              label="Blood Type"
              value={form.bloodType}
              onChange={(v) => setForm((f) => ({ ...f, bloodType: v }))}
              options={BLOOD_TYPES.map((b) => ({ value: b, label: b }))}
              placeholder="Select Blood Type"
              disabled={submitting}
              getValue={(o) => o.value}
              getLabel={(o) => o.label}
            />
            {fieldErrors.bloodType ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.bloodType}</p>
            ) : null}
          </div>

          <div>
            <RequestsDateField
              label="Expiry Date"
              value={form.expiryDate}
              onChange={(v) => setForm((f) => ({ ...f, expiryDate: v }))}
              disabled={submitting}
            />
            {fieldErrors.expiryDate ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.expiryDate}</p>
            ) : null}
          </div>

          <div>
            <RequestsQuantityStepper
              value={form.quantity}
              onChange={(q) => setForm((f) => ({ ...f, quantity: q }))}
              disabled={submitting}
              min={0}
            />
            {fieldErrors.quantity ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.quantity}</p>
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-8 w-full rounded-lg bg-red-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
