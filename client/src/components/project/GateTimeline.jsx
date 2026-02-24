import { CheckCircle2, Circle, XCircle, Clock } from 'lucide-react';

const GATE_LABELS = ['Порта 0', 'Порта 1', 'Порта 2', 'Порта 3', 'Порта 4'];
const GATE_DESCRIPTIONS = [
  'Поставување на проект',
  'Внатрешен преглед',
  'Регулаторен преглед',
  'Дизајн на пакување',
  'Одобрување од клиент',
];

const GateIcon = ({ status }) => {
  if (status === 'approved') return <CheckCircle2 size={20} className="text-green-500" />;
  if (status === 'rejected') return <XCircle size={20} className="text-red-500" />;
  if (status === 'in_progress') return <Clock size={20} className="text-blue-500 animate-pulse" />;
  return <Circle size={20} className="text-gray-300" />;
};

const GateTimeline = ({ gates, currentGate }) => {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Напредок на работниот тек</h2>
      <div className="relative">
        <div className="absolute left-[9px] top-5 bottom-5 w-0.5 bg-gray-200" />
        <div className="space-y-4">
          {(gates || []).map((gate, i) => (
            <div key={i} className="relative flex items-start gap-4">
              <div className="relative z-10 flex-shrink-0">
                <GateIcon status={gate.status} />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      gate.status === 'in_progress' ? 'text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {GATE_LABELS[i]}
                  </span>
                  {gate.status === 'in_progress' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      Активна
                    </span>
                  )}
                  {gate.status === 'rejected' && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      Одбиена
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{GATE_DESCRIPTIONS[i]}</p>
                {gate.rejectionReason && (
                  <p className="text-xs text-red-500 mt-0.5 italic">„{gate.rejectionReason}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GateTimeline;
