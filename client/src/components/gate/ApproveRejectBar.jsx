import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useApproveGate, useRejectGate } from '../../hooks/useProjects.js';

const ApproveRejectBar = ({ projectId, gateNumber }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');

  const approve = useApproveGate(projectId);
  const reject = useRejectGate(projectId);

  const handleApprove = () => approve.mutate(gateNumber);

  const handleReject = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await reject.mutateAsync({ gateNumber, reason: reason.trim() });
    setShowRejectForm(false);
    setReason('');
  };

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      {!showRejectForm ? (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={approve.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            {approve.isPending ? 'Одобрување…' : 'Одобри'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            className="btn-danger flex items-center gap-2"
          >
            <XCircle size={16} />
            Одбиј
          </button>
        </div>
      ) : (
        <form onSubmit={handleReject} className="space-y-3">
          <div>
            <label className="label text-red-600">Причина за одбивање</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Опишете што треба да се промени…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={!reason.trim() || reject.isPending} className="btn-danger">
              {reject.isPending ? 'Одбивање…' : 'Потврди одбивање'}
            </button>
            <button
              type="button"
              onClick={() => { setShowRejectForm(false); setReason(''); }}
              className="btn-secondary"
            >
              Откажи
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ApproveRejectBar;
