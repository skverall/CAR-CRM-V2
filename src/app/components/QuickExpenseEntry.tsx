'use client';

import { useState, useRef } from 'react';
import { AllocationPreview } from '@/types/api';

interface QuickExpenseEntryProps {
  orgId: string;
  onSuccess?: () => void;
}

interface Car {
  id: string;
  vin: string;
  make: string;
  model: string;
}

export default function QuickExpenseEntry({ orgId, onSuccess }: QuickExpenseEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocationPreview, setAllocationPreview] = useState<AllocationPreview | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    occurred_at: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'AED',
    rate_to_aed: '1',
    scope: 'car' as 'car' | 'overhead' | 'personal',
    category: 'other',
    description: '',
    car_id: ''
  });

  // Load cars when component opens
  const loadCars = async () => {
    try {
      const response = await fetch(`/api/cars?org_id=${orgId}&per_page=100`);
      const data = await response.json();
      if (data.success) {
        setCars(data.data.cars.filter((car: any) => car.status !== 'sold' && car.status !== 'archived'));
      }
    } catch (error) {
      console.error('Failed to load cars:', error);
    }
  };

  // Preview overhead allocation
  const previewAllocation = async () => {
    if (formData.scope === 'car' || !formData.amount) return;

    try {
      const response = await fetch('/api/expenses/preview-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          expense_amount_aed: parseFloat(formData.amount) * parseFloat(formData.rate_to_aed),
          expense_date: formData.occurred_at
        })
      });

      const data = await response.json();
      if (data.success) {
        setAllocationPreview(data.data);
      }
    } catch (error) {
      console.error('Failed to preview allocation:', error);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadCars();
  };

  const handleClose = () => {
    setIsOpen(false);
    setAllocationPreview(null);
    setSelectedFile(null);
    setFormData({
      occurred_at: new Date().toISOString().split('T')[0],
      amount: '',
      currency: 'AED',
      rate_to_aed: '1',
      scope: 'car',
      category: 'other',
      description: '',
      car_id: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-preview allocation for overhead/personal expenses
    if ((field === 'scope' && (value === 'overhead' || value === 'personal')) ||
        (field === 'amount' && formData.scope !== 'car')) {
      setTimeout(previewAllocation, 500);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      submitData.append('org_id', orgId);
      
      if (selectedFile) {
        submitData.append('attachment', selectedFile);
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();
      
      if (data.success) {
        handleClose();
        onSuccess?.();
      } else {
        alert('Xatolik: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to submit expense:', error);
      alert('Xarajat qo\'shishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'transport', label: 'Transport' },
    { value: 'repair', label: 'Ta\'mirlash' },
    { value: 'detailing', label: 'Detailing' },
    { value: 'ads', label: 'Reklama' },
    { value: 'fees', label: 'To\'lovlar' },
    { value: 'fuel', label: 'Yoqilg\'i' },
    { value: 'parking', label: 'Parking' },
    { value: 'rent', label: 'Ijara' },
    { value: 'salary', label: 'Maosh' },
    { value: 'other', label: 'Boshqa' }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        aria-label="Xarajat qo'shish"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:w-96 sm:rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Tez xarajat qo'shish</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Date and Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sana</label>
                  <input
                    type="date"
                    value={formData.occurred_at}
                    onChange={(e) => handleInputChange('occurred_at', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miqdor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Currency and Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valyuta</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AED kursi</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate_to_aed}
                    onChange={(e) => handleInputChange('rate_to_aed', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tur</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'car', label: 'Avtomobil' },
                    { value: 'overhead', label: 'Umumiy' },
                    { value: 'personal', label: 'Shaxsiy' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('scope', option.value)}
                      className={`px-3 py-2 text-sm rounded-md border ${
                        formData.scope === option.value
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Car Selection (if scope is car) */}
              {formData.scope === 'car' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avtomobil</label>
                  <select
                    value={formData.car_id}
                    onChange={(e) => handleInputChange('car_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Avtomobilni tanlang</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.vin} - {car.make} {car.model}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Qisqacha izoh..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hujjat/Rasm</label>
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    {selectedFile ? selectedFile.name : 'Fayl tanlash'}
                  </button>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Allocation Preview */}
              {allocationPreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="text-sm font-medium text-blue-800 mb-2">
                    Taqsimot ko'rinishi ({allocationPreview.method})
                  </div>
                  <div className="space-y-1">
                    {allocationPreview.allocations.slice(0, 3).map((allocation, index) => (
                      <div key={index} className="text-xs text-blue-700 flex justify-between">
                        <span>{allocation.car_vin}</span>
                        <span>{allocation.allocated_amount_aed.toFixed(2)} AED</span>
                      </div>
                    ))}
                    {allocationPreview.allocations.length > 3 && (
                      <div className="text-xs text-blue-600">
                        +{allocationPreview.allocations.length - 3} ta boshqa avtomobil
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saqlanmoqda...' : 'Xarajatni saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
