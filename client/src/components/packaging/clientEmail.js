// Builds the English email Sales sends to the client for one round. Only remarks
// the responsible sector CONFIRMED are included; disputed ones are dropped and
// pending ones are left out until answered.
const GROUPS = [
  { severity: 'critical', heading: 'Must be corrected before printing:' },
  { severity: 'warning', heading: 'Please correct or confirm:' },
  { severity: 'info', heading: 'Suggestions:' },
];

export const buildClientEmail = ({ check, round, senderName }) => {
  const confirmed = round.remarks.filter((r) => r.status === 'confirmed');
  const approved = round.outcome?.decision === 'approved';
  const markets = check.markets ? ` (target markets: ${check.markets})` : '';
  const subject = `Artwork review – ${check.product} (round ${round.number})${approved ? ' – approved' : ''}`;

  const lines = [
    `Subject: ${subject}`,
    '',
    `Dear ${check.client} team,`,
    '',
    `Thank you for sending the packaging artwork for ${check.product}${markets}. We have reviewed it (round ${round.number}) against the product recipe and the applicable EU labelling and packaging requirements.`,
    '',
  ];

  if (approved && !confirmed.length) {
    lines.push('We are pleased to confirm that the artwork is approved for printing.');
  } else if (confirmed.length) {
    lines.push(approved
      ? 'The artwork is approved for printing, subject to the following points:'
      : 'Please find below the points that need to be addressed before the artwork can be approved.');
    let n = 0;
    for (const group of GROUPS) {
      const items = confirmed.filter((r) => r.severity === group.severity);
      if (!items.length) continue;
      lines.push('', group.heading);
      for (const r of items) lines.push(`${++n}. ${r.text}`);
    }
    if (!approved) {
      lines.push('', 'Once the artwork has been updated, please send us the revised version and we will review it again.');
    }
  } else {
    lines.push('We have no corrections to request at this stage.');
  }

  if (round.outcome?.summary) lines.push('', round.outcome.summary);

  lines.push('', 'Kind regards,', senderName, 'LBFP DOO Bitola');
  return lines.join('\n');
};
