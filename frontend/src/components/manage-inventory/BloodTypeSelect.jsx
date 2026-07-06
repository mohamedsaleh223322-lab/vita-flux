import { BLOOD_TYPES } from '../../constants';
export default function BloodTypeSelect({ value, onChange, label = 'Blood Type', disabled = false, }) {
    return (<div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50">
        <option value="">Select Blood Type</option>
        {BLOOD_TYPES.map((type) => (<option key={type} value={type}>
            {type}
          </option>))}
      </select>
    </div>);
}
