/**
 * Field definitions per request type for dynamic form rendering.
 * Each field: { name, type, label (i18n key), required, ...extras }
 */
export const REQUEST_FORM_FIELDS = {
  day_off: [
    { name: 'startDate', type: 'date', label: 'startDate', required: true },
    { name: 'endDate', type: 'date', label: 'endDate', required: true },
    { name: 'reason', type: 'textarea', label: 'reason', required: false },
  ],
  overtime: [
    { name: 'date', type: 'date', label: 'date', required: true },
    { name: 'hours', type: 'number', label: 'hours', required: true, min: 1, max: 24 },
    { name: 'reason', type: 'textarea', label: 'reason', required: true },
  ],
  equipment: [
    { name: 'itemName', type: 'text', label: 'itemName', required: true },
    { name: 'quantity', type: 'number', label: 'quantity', required: true, min: 1 },
    { name: 'reason', type: 'textarea', label: 'reason', required: true },
    { name: 'estimatedCost', type: 'number', label: 'estimatedCost', required: false, min: 0 },
  ],
  travel: [
    { name: 'destination', type: 'text', label: 'destination', required: true },
    { name: 'startDate', type: 'date', label: 'startDate', required: true },
    { name: 'endDate', type: 'date', label: 'endDate', required: true },
    { name: 'purpose', type: 'textarea', label: 'purpose', required: true },
    { name: 'estimatedCost', type: 'number', label: 'estimatedCost', required: false, min: 0 },
  ],
  complaint: [
    { name: 'subject', type: 'text', label: 'subject', required: true },
    { name: 'description', type: 'textarea', label: 'description', required: true },
    { name: 'anonymous', type: 'checkbox', label: 'anonymous', required: false },
  ],
};

export const REQUEST_TYPE_OPTIONS = [
  { value: 'day_off', label: 'dayOff' },
  { value: 'overtime', label: 'overtime' },
  { value: 'equipment', label: 'equipment' },
  { value: 'travel', label: 'travel' },
  { value: 'complaint', label: 'complaint' },
];
