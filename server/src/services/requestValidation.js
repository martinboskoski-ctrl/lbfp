const validators = {
  day_off: (data) => {
    if (!data.startDate || !data.endDate) return 'Start date and end date are required';
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(start) || isNaN(end)) return 'Invalid dates';
    if (end < start) return 'End date must be after start date';
    return null;
  },

  overtime: (data) => {
    if (!data.date) return 'Date is required';
    if (!data.hours || data.hours < 1 || data.hours > 24) return 'Hours must be between 1 and 24';
    if (!data.reason?.trim()) return 'Reason is required';
    return null;
  },

  equipment: (data) => {
    if (!data.itemName?.trim()) return 'Item name is required';
    if (!data.quantity || data.quantity < 1) return 'Quantity must be at least 1';
    if (!data.reason?.trim()) return 'Reason is required';
    return null;
  },

  travel: (data) => {
    if (!data.destination?.trim()) return 'Destination is required';
    if (!data.startDate || !data.endDate) return 'Start date and end date are required';
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(start) || isNaN(end)) return 'Invalid dates';
    if (end < start) return 'End date must be after start date';
    if (!data.purpose?.trim()) return 'Purpose is required';
    return null;
  },

  complaint: (data) => {
    if (!data.subject?.trim()) return 'Subject is required';
    if (!data.description?.trim()) return 'Description is required';
    return null;
  },
};

export const validateRequestData = (type, data) => {
  const validator = validators[type];
  if (!validator) return `Unknown request type: ${type}`;
  return validator(data);
};
