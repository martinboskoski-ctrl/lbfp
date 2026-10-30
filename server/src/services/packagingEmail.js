// Builds the English email Sales sends to the client for one round, from the
// department paragraphs. A paragraph with no remarks is left out. An empty
// opening / closing means "use the generated text".
const HEADINGS = {
  rnd:      'The remarks from our R&D department are:',
  graphics: 'The remarks from our Graphics department are:',
  quality:  'The remarks from our Quality department are:',
  general:  'General remarks (grammar, wording and technical):',
};

const remarkCount = (round) => round.email.sections.reduce((n, s) => n + s.items.length, 0);

export const defaultOpening = (check, round) => {
  const product = check.product || 'your product';
  const markets = check.markets ? ` (target markets: ${check.markets})` : '';
  const answer = round.ai?.answer?.trim();
  const lines = [check.client ? `Dear ${check.client} team,` : 'Hello,', ''];
  lines.push(round.attachments?.length
    ? `Thank you for sending the packaging artwork for ${product}${markets}. We have reviewed it against the product recipe and the applicable labelling and packaging requirements.`
    : `Thank you for your message regarding ${product}${markets}.`);
  if (answer) lines.push('', round.clientMessage ? 'Regarding your question:' : 'Our feedback:', answer);
  return lines.join('\n');
};

export const defaultClosing = (round) =>
  remarkCount(round)
    ? 'Once the artwork has been updated, please send us the revised version and we will review it again.'
    : 'We have no corrections to request — the artwork is approved for printing.';

export const buildEmailText = (check, round, senderName) => {
  const { email } = round;
  const parts = [email.opening.trim() || defaultOpening(check, round)];
  for (const s of email.sections) {
    if (s.items.length) parts.push([HEADINGS[s.key], ...s.items.map((i) => `- ${i}`)].join('\n'));
  }
  parts.push(email.closing.trim() || defaultClosing(round));
  parts.push(['Kind regards,', senderName, 'LBFP DOO Bitola'].filter(Boolean).join('\n'));

  const subject = `${round.attachments?.length ? 'Artwork review' : 'Re'}: ${check.product || 'your product'} (round ${round.number})`;
  return `Subject: ${subject}\n\n${parts.join('\n\n')}`;
};
