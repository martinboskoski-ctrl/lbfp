import { Link } from 'react-router-dom';

// Minimal, safe markdown for assistant answers: paragraphs, bullet / numbered lists,
// tables, **bold** and links. Only in-app links ("/…") become links — anything else is
// shown as plain text, so the model cannot send users off-site.
const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

const Inline = ({ text }) =>
  text.split(INLINE).filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      return href.startsWith('/') && !href.startsWith('//')
        ? <Link key={i} to={href} className="text-blue-600 hover:underline font-medium">{label}</Link>
        : <span key={i}>{label}</span>;
    }
    return <span key={i}>{part}</span>;
  });

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const cells = (l) => l.trim().slice(1, -1).split('|').map((c) => c.trim());

const AssistantMarkdown = ({ text }) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (isTableRow(line)) {
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) { rows.push(lines[i]); i++; }
      const [head, ...rest] = rows;
      const body = rest.filter((r) => !/^\s*\|[\s:|-]+\|\s*$/.test(r));
      blocks.push(
        <div key={blocks.length} className="overflow-x-auto">
          <table className="text-xs border-collapse my-1">
            <thead><tr>{cells(head).map((c, j) => <th key={j} className="text-left font-semibold px-2 py-1 border-b border-slate-200"><Inline text={c} /></th>)}</tr></thead>
            <tbody>{body.map((r, k) => <tr key={k}>{cells(r).map((c, j) => <td key={j} className="px-2 py-1 border-b border-slate-100"><Inline text={c} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    const bullet = /^\s*[-*•]\s+/;
    const numbered = /^\s*\d+[.)]\s+/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const re = ordered ? numbered : bullet;
      const items = [];
      while (i < lines.length && re.test(lines[i])) { items.push(lines[i].replace(re, '')); i++; }
      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag key={blocks.length} className={`${ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-0.5`}>
          {items.map((it, k) => <li key={k}><Inline text={it} /></li>)}
        </ListTag>
      );
      continue;
    }

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(
      heading
        ? <p key={blocks.length} className="font-semibold text-slate-900"><Inline text={heading[1]} /></p>
        : <p key={blocks.length}><Inline text={line} /></p>
    );
    i++;
  }
  return <div className="space-y-2 text-sm leading-relaxed">{blocks}</div>;
};

export default AssistantMarkdown;
