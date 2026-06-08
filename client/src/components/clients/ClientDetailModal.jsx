import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Plus, Trash2, Package, Mail, Phone, User as UserIcon,
  Send, MessageSquare,
} from 'lucide-react';
import {
  useClients, useAddOrder, useUpdateOrder, useDeleteOrder, useAddClientActivity,
} from '../../hooks/useClients.js';
import { fmtDate, fmtDateTime } from '../../utils/formatDate.js';

const ORDER_STATUSES = ['forecast', 'confirmed', 'delivered', 'cancelled'];

const STATUS_BADGE = {
  active:   'bg-green-100 text-green-700',
  prospect: 'bg-blue-100 text-blue-700',
  inactive: 'bg-gray-100 text-gray-600',
};

const ORDER_STATUS_BADGE = {
  forecast:  'bg-blue-50 text-blue-700',
  confirmed: 'bg-amber-50 text-amber-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
};

const eur = (v) => `${Number(v || 0).toLocaleString('mk-MK')} EUR`;

const EMPTY_ORDER = { description: '', forecastEUR: '', itemCount: '', status: 'forecast', orderDate: '' };

export default function ClientDetailModal({ client: initialClient, onClose }) {
  const { t } = useTranslation('clients');
  const { t: tc } = useTranslation('common');

  // Stay in sync with the cache so the modal updates after a mutation.
  const { data: clients = [] } = useClients();
  const client = useMemo(
    () => clients.find((c) => c._id === initialClient._id) || initialClient,
    [clients, initialClient]
  );

  const addOrder    = useAddOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const addActivity = useAddClientActivity();

  const [orderForm, setOrderForm] = useState(EMPTY_ORDER);
  const [note, setNote]           = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const orders = client.orders || [];
  const totals = useMemo(() => {
    const live = (client.orders || []).filter((o) => o.status !== 'cancelled');
    return {
      forecast: live.reduce((s, o) => s + (o.forecastEUR || 0), 0),
      items:    live.reduce((s, o) => s + (o.itemCount || 0), 0),
    };
  }, [client]);

  const submitOrder = (e) => {
    e.preventDefault();
    addOrder.mutate(
      {
        id: client._id,
        data: {
          description: orderForm.description.trim(),
          forecastEUR: Number(orderForm.forecastEUR) || 0,
          itemCount:   Number(orderForm.itemCount) || 0,
          status:      orderForm.status,
          orderDate:   orderForm.orderDate || undefined,
        },
      },
      { onSuccess: () => setOrderForm(EMPTY_ORDER) }
    );
  };

  const submitNote = (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    addActivity.mutate(
      { id: client._id, data: { type: 'note', text: note.trim() } },
      { onSuccess: () => setNote('') }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-900 truncate">{client.companyName}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[client.status]}`}>
                {t(`status.${client.status}`)}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
              {client.contactName && <span className="inline-flex items-center gap-1"><UserIcon size={11} />{client.contactName}</span>}
              {client.email && <span className="inline-flex items-center gap-1"><Mail size={11} />{client.email}</span>}
              {client.phone && <span className="inline-flex items-center gap-1"><Phone size={11} />{client.phone}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Orders */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Package size={15} className="text-gray-400" /> {t('orders.title')}
              </h3>
              <div className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{eur(totals.forecast)}</span>
                {' · '}
                {totals.items} {t('orders.items').toLowerCase()}
              </div>
            </div>

            {/* Order list */}
            {orders.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">{t('orders.none')}</p>
            ) : (
              <div className="space-y-2 mb-3">
                {orders.map((o) => (
                  <div key={o._id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 truncate">{o.description || '—'}</p>
                      <p className="text-xs text-gray-500">
                        {eur(o.forecastEUR)} · {o.itemCount} {t('orders.items').toLowerCase()} · {fmtDate(o.orderDate)}
                      </p>
                    </div>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrder.mutate({ id: client._id, orderId: o._id, data: { status: e.target.value } })}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${ORDER_STATUS_BADGE[o.status]}`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{t(`orderStatus.${s}`)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteOrder.mutate({ id: client._id, orderId: o._id })}
                      className="text-gray-300 hover:text-red-500 flex-shrink-0"
                      title={tc('delete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add order */}
            <form onSubmit={submitOrder} className="rounded-lg border border-dashed border-gray-200 p-3 space-y-2">
              <input
                className="input text-sm"
                placeholder={t('orders.descriptionPlaceholder')}
                value={orderForm.description}
                onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="number" min={0} className="input text-sm"
                  placeholder={t('orders.forecast')}
                  value={orderForm.forecastEUR}
                  onChange={(e) => setOrderForm({ ...orderForm, forecastEUR: e.target.value })}
                />
                <input
                  type="number" min={0} className="input text-sm"
                  placeholder={t('orders.items')}
                  value={orderForm.itemCount}
                  onChange={(e) => setOrderForm({ ...orderForm, itemCount: e.target.value })}
                />
                <select
                  className="input text-sm"
                  value={orderForm.status}
                  onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{t(`orderStatus.${s}`)}</option>
                  ))}
                </select>
                <input
                  type="date" className="input text-sm"
                  value={orderForm.orderDate}
                  onChange={(e) => setOrderForm({ ...orderForm, orderDate: e.target.value })}
                />
              </div>
              <button type="submit" disabled={addOrder.isPending} className="btn-primary flex items-center gap-1.5 text-sm py-1.5">
                <Plus size={14} /> {t('orders.add')}
              </button>
            </form>
          </section>

          {/* Activity / notes */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <MessageSquare size={15} className="text-gray-400" /> {t('activity.title')}
            </h3>

            <form onSubmit={submitNote} className="flex gap-2 mb-3">
              <input
                className="input text-sm flex-1"
                placeholder={t('activity.placeholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button type="submit" disabled={!note.trim() || addActivity.isPending} className="btn-primary flex items-center gap-1.5 text-sm">
                <Send size={13} /> {t('activity.add')}
              </button>
            </form>

            {(client.activities || []).length === 0 ? (
              <p className="text-xs text-gray-400">{t('activity.none')}</p>
            ) : (
              <ul className="space-y-2">
                {[...client.activities].reverse().map((a) => (
                  <li key={a._id} className="text-sm">
                    <span className="text-gray-800">{a.text}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {a.createdBy?.name} · {fmtDateTime(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
