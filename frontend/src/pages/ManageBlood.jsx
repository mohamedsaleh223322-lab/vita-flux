import { useEffect, useMemo, useState } from 'react';
import { Droplets, Trash2 } from 'lucide-react';
import { apiFetch } from '../api/apiFetch.js';
import ActionButton from '../components/manage-inventory/ActionButton.jsx';
import BloodTypeSelect from '../components/manage-inventory/BloodTypeSelect.jsx';
import ExpiryDatePicker from '../components/manage-inventory/ExpiryDatePicker.jsx';
import InventoryActionCard from '../components/manage-inventory/InventoryActionCard.jsx';
import PageHeader from '../components/manage-inventory/PageHeader.jsx';
import QuantityStepper from '../components/manage-inventory/QuantityStepper.jsx';
import ToastMessage from '../components/manage-inventory/ToastMessage.jsx';
export default function ManageBloodInventoryPage() {
    const [addBloodType, setAddBloodType] = useState('');
    const [addQuantity, setAddQuantity] = useState(1);
    const [expiryDate, setExpiryDate] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [removeBloodType, setRemoveBloodType] = useState('');
    const [removeQuantity, setRemoveQuantity] = useState(1);
    const [removeLoading, setRemoveLoading] = useState(false);
    const [toast, setToast] = useState(null);
    useEffect(() => {
        if (!toast)
            return;
        const timerId = window.setTimeout(() => {
            setToast(null);
        }, 3500);
        return () => window.clearTimeout(timerId);
    }, [toast]);
    const isAddInvalid = useMemo(() => !addBloodType || addQuantity <= 0 || !expiryDate || addLoading, [addBloodType, addLoading, addQuantity, expiryDate]);
    const isRemoveInvalid = useMemo(() => !removeBloodType || removeQuantity <= 0 || removeLoading, [removeBloodType, removeLoading, removeQuantity]);
    async function handleAddBlood() {
        if (!addBloodType) {
            setToast({ variant: 'error', message: 'Please select a blood type before adding bags.' });
            return;
        }
        if (addQuantity <= 0) {
            setToast({ variant: 'error', message: 'Quantity must be greater than zero.' });
            return;
        }
        if (!expiryDate) {
            setToast({ variant: 'error', message: 'Please choose an expiry date.' });
            return;
        }
        setAddLoading(true);
        try {
            const data = await apiFetch('/api/inventory/add', {
                method: 'POST',
                body: JSON.stringify({
                    bloodType: addBloodType,
                    quantity: addQuantity,
                    expiryDate,
                }),
            });
            setToast({ variant: 'success', message: data.message || 'Blood bags added successfully' });
            setAddBloodType('');
            setAddQuantity(1);
            setExpiryDate('');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to add blood bags.';
            setToast({ variant: 'error', message });
        }
        finally {
            setAddLoading(false);
        }
    }
    async function handleRemoveBlood() {
        if (!removeBloodType) {
            setToast({ variant: 'error', message: 'Please select a blood type before removing bags.' });
            return;
        }
        if (removeQuantity <= 0) {
            setToast({ variant: 'error', message: 'Quantity must be greater than zero.' });
            return;
        }
        setRemoveLoading(true);
        try {
            const data = await apiFetch('/api/inventory/remove', {
                method: 'POST',
                body: JSON.stringify({
                    bloodType: removeBloodType,
                    quantity: removeQuantity,
                }),
            });
            setToast({ variant: 'success', message: data.message || 'Blood bags removed successfully' });
            setRemoveBloodType('');
            setRemoveQuantity(1);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove blood bags.';
            setToast({ variant: 'error', message });
        }
        finally {
            setRemoveLoading(false);
        }
    }
    return (<div className="w-full space-y-8">
      {toast ? (<ToastMessage variant={toast.variant} message={toast.message} onClose={() => setToast(null)}/>) : null}

      <PageHeader title="Manage Blood Inventory" subtitle="Add new units or remove used/expired bags from the stock."/>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InventoryActionCard type="remove" title="Use Blood Bags" icon={Trash2}>
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <BloodTypeSelect value={removeBloodType} onChange={setRemoveBloodType} disabled={removeLoading} label="Blood Type"/>
              <QuantityStepper value={removeQuantity} onChange={setRemoveQuantity} onIncrement={() => setRemoveQuantity((prev) => prev + 1)} onDecrement={() => setRemoveQuantity((prev) => Math.max(1, prev - 1))} disabled={removeLoading} label="Quantity To Use"/>
            </div>
            <div className="pt-4">
              <ActionButton variant="danger" onClick={handleRemoveBlood} disabled={isRemoveInvalid} loading={removeLoading}>
                Use Bags
              </ActionButton>
            </div>
          </div>
        </InventoryActionCard>

        <InventoryActionCard type="add" title="Add Blood Bags" icon={Droplets}>
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <BloodTypeSelect value={addBloodType} onChange={setAddBloodType} disabled={addLoading} label="Blood Type"/>
              <QuantityStepper value={addQuantity} onChange={setAddQuantity} onIncrement={() => setAddQuantity((prev) => prev + 1)} onDecrement={() => setAddQuantity((prev) => Math.max(1, prev - 1))} disabled={addLoading} label="Batch Quantity"/>
              <ExpiryDatePicker value={expiryDate} onChange={setExpiryDate} disabled={addLoading} label="Expiry Date"/>
            </div>
            <div className="pt-4">
              <ActionButton variant="primary" onClick={handleAddBlood} disabled={isAddInvalid} loading={addLoading}>
                Add Bags
              </ActionButton>
            </div>
          </div>
        </InventoryActionCard>
      </div>
    </div>);
}
