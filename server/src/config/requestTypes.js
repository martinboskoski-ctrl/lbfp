/**
 * Declarative approval chain definitions.
 * Each step has: role ('manager' | 'department'), department (string or '__requester_dept__'), label.
 * '__requester_dept__' resolves to the requester's department at runtime.
 */

export const REQUEST_TYPES = {
  day_off: {
    label: 'Day Off',
    steps: [
      { role: 'manager', department: '__requester_dept__', label: 'Department Manager' },
      { role: 'department', department: 'hr', label: 'HR' },
    ],
  },
  overtime: {
    label: 'Overtime',
    steps: [
      { role: 'manager', department: '__requester_dept__', label: 'Department Manager' },
    ],
  },
  equipment: {
    label: 'Equipment / Supply',
    steps: [
      { role: 'manager', department: '__requester_dept__', label: 'Department Manager' },
      { role: 'department', department: 'administration', label: 'Administration' },
    ],
  },
  travel: {
    label: 'Travel',
    steps: [
      { role: 'manager', department: '__requester_dept__', label: 'Department Manager' },
      { role: 'department', department: 'finance', label: 'Finance' },
    ],
  },
  complaint: {
    label: 'Complaint / Suggestion',
    steps: [
      { role: 'manager', department: '__requester_dept__', label: 'Department Manager' },
      { role: 'department', department: 'hr', label: 'HR' },
      { role: 'department', department: 'top_management', label: 'Top Management' },
    ],
  },
};

export const REQUEST_TYPE_KEYS = Object.keys(REQUEST_TYPES);
