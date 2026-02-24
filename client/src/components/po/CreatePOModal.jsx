import { useState } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { useCreatePO } from '../../hooks/usePO.js';
import { useNavigate } from 'react-router-dom';

const ASCII_RE = /^[\x20-\x7E]*$/;
const isEnglish = (s) => !s || ASCII_RE.test(s);

const emptyProduct = () => ({ productType: '', weight: '', description: '' });

const CreatePOModal = ({ onClose }) => {
  const navigate    = useNavigate();
  const createPO    = useCreatePO();

  const [form, setForm] = useState({
    clientName: '', dateExpected: '', moq: '', description: '',
  });
  const [products, setProducts] = useState([emptyProduct()]);
  const [errors, setErrors]     = useState({});

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setProduct = (i, key, val) =>
    setProducts((ps) => ps.map((p, idx) => idx === i ? { ...p, [key]: val } : p));

  const addProduct    = () => setProducts((ps) => [...ps, emptyProduct()]);
  const removeProduct = (i) => setProducts((ps) => ps.filter((_, idx) => idx !== i));

  const validate = () => {
    const e = {};
    if (!form.clientName.trim())  e.clientName   = 'Required';
    if (!isEnglish(form.clientName))  e.clientName = 'English only (ASCII)';
    if (!form.dateExpected)       e.dateExpected  = 'Required';
    if (!form.moq || isNaN(form.moq)) e.moq       = 'Required (number)';
    if (!isEnglish(form.description)) e.description = 'English only (ASCII)';

    products.forEach((p, i) => {
      if (!p.productType.trim()) e[`pt_${i}`] = 'Required';
      if (!isEnglish(p.productType)) e[`pt_${i}`] = 'English only';
      if (!p.weight.trim())      e[`pw_${i}`] = 'Required';
      if (!isEnglish(p.weight))  e[`pw_${i}`] = 'English only';
      if (!isEnglish(p.description)) e[`pd_${i}`] = 'English only';
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await createPO.mutateAsync({
      clientName:   form.clientName.trim(),
      dateExpected: form.dateExpected,
      moq:          Number(form.moq),
      description:  form.description.trim(),
      products,
    });
    onClose();
    navigate(`/po/${result.data.po._id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">New Purchase Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Client + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Client Name *</label>
              <input
                className={`input ${errors.clientName ? 'border-red-400' : ''}`}
                placeholder="Acme Corp"
                value={form.clientName}
                onChange={(e) => setField('clientName', e.target.value)}
              />
              {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>}
            </div>
            <div>
              <label className="label">Date Expected *</label>
              <input
                type="date"
                className={`input ${errors.dateExpected ? 'border-red-400' : ''}`}
                value={form.dateExpected}
                onChange={(e) => setField('dateExpected', e.target.value)}
              />
              {errors.dateExpected && <p className="text-red-500 text-xs mt-1">{errors.dateExpected}</p>}
            </div>
          </div>

          {/* MOQ + Description row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">MOQ *</label>
              <input
                type="number"
                className={`input ${errors.moq ? 'border-red-400' : ''}`}
                placeholder="1000"
                value={form.moq}
                onChange={(e) => setField('moq', e.target.value)}
              />
              {errors.moq && <p className="text-red-500 text-xs mt-1">{errors.moq}</p>}
            </div>
            <div>
              <label className="label">Description</label>
              <input
                className={`input ${errors.description ? 'border-red-400' : ''}`}
                placeholder="Optional notes..."
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Products</label>
              <button type="button" onClick={addProduct} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Plus size={12} /> Add product
              </button>
            </div>

            <div className="space-y-3">
              {products.map((p, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">Product {i + 1}</span>
                    {products.length > 1 && (
                      <button type="button" onClick={() => removeProduct(i)} className="text-gray-300 hover:text-red-500">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        className={`input text-sm ${errors[`pt_${i}`] ? 'border-red-400' : ''}`}
                        placeholder="Type *"
                        value={p.productType}
                        onChange={(e) => setProduct(i, 'productType', e.target.value)}
                      />
                      {errors[`pt_${i}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`pt_${i}`]}</p>}
                    </div>
                    <div>
                      <input
                        className={`input text-sm ${errors[`pw_${i}`] ? 'border-red-400' : ''}`}
                        placeholder="Weight *"
                        value={p.weight}
                        onChange={(e) => setProduct(i, 'weight', e.target.value)}
                      />
                      {errors[`pw_${i}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`pw_${i}`]}</p>}
                    </div>
                  </div>
                  <div>
                    <input
                      className={`input text-sm ${errors[`pd_${i}`] ? 'border-red-400' : ''}`}
                      placeholder="Description (optional)"
                      value={p.description}
                      onChange={(e) => setProduct(i, 'description', e.target.value)}
                    />
                    {errors[`pd_${i}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`pd_${i}`]}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createPO.isPending} className="btn-primary flex items-center gap-2">
              {createPO.isPending && <Loader2 size={14} className="animate-spin" />}
              Create PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePOModal;
