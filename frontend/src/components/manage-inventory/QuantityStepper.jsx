import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onChange, onIncrement, onDecrement, label = 'Quantity', disabled = false, }) {
    const [inputValue, setInputValue] = useState(value.toString());

    useEffect(() => {
        setInputValue(value.toString());
    }, [value]);

    const handleInputChange = (event) => {
        const raw = event.target.value;
        const digits = raw.replace(/\D/g, ''); // prevent negative, decimal points, symbols, letters
        setInputValue(digits);

        if (digits !== '') {
            const parsed = parseInt(digits, 10);
            if (parsed >= 1) {
                onChange(parsed);
            } else {
                onChange(0); // If typed value is 0, update parent to 0 to trigger validation
            }
        } else {
            onChange(0); // If empty, update parent to 0 to disable submitting empty values
        }
    };

    const handleBlur = () => {
        const parsed = parseInt(inputValue, 10);
        if (isNaN(parsed) || parsed < 1) {
            setInputValue('1');
            onChange(1);
        } else {
            setInputValue(parsed.toString());
            onChange(parsed);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            onIncrement();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (value > 1) {
                onDecrement();
            }
        } else if (event.key === 'Enter') {
            event.target.blur();
        }
    };

    return (<div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <div className="flex h-12 items-center rounded-lg border border-slate-200 bg-white hover:border-slate-300 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200 transition-all">
        <button type="button" onClick={onDecrement} disabled={disabled || value <= 1} className="flex h-full w-12 items-center justify-center rounded-l-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300" aria-label="Decrease quantity">
          <Minus className="h-4 w-4"/>
        </button>
        <input type="text" inputMode="numeric" pattern="[0-9]*" value={inputValue} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} disabled={disabled} className="flex-1 w-full h-full text-center text-lg font-semibold text-slate-800 bg-transparent outline-none focus:outline-none focus:ring-0 border-none px-2" aria-label="Quantity input"/>
        <button type="button" onClick={onIncrement} disabled={disabled} className="flex h-full w-12 items-center justify-center rounded-r-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300" aria-label="Increase quantity">
          <Plus className="h-4 w-4"/>
        </button>
      </div>
    </div>);
}
