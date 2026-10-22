import { createElement } from 'react';
import type { ReactNode } from 'react';

type MarkdownProps = { text: string; className?: string };

type ListMatch = { ordered: boolean; indent: number; text: string };

const UNORDERED_ITEM = /^(\s*)[-*+]\s+(.*)$/;
const ORDERED_ITEM = /^(\s*)\d+[.)]\s+(.*)$/;
const FENCE = /^\s*(`{3,}|~{3,})\s*([A-Za-z0-9_+-]*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*)$/;

function listMatch(line: string): ListMatch | null {
  const unordered = UNORDERED_ITEM.exec(line);
  if (unordered) {
    return {
      ordered: false,
      indent: unordered[1].length,
      text: unordered[2],
    };
  }
  const ordered = ORDERED_ITEM.exec(line);
  if (ordered) {
    return { ordered: true, indent: ordered[1].length, text: ordered[2] };
  }
  return null;
}

function splitRow(line: string): string[] {
  let value = line.trim();
  if (value.startsWith('|')) value = value.slice(1);
  if (value.endsWith('|')) value = value.slice(0, -1);
  return value
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, '|').trim());
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function isTableStart(lines: string[], index: number): boolean {
  return (
    lines[index].includes('|') &&
    index + 1 < lines.length &&
    isTableSeparator(lines[index + 1])
  );
}

function startsBlock(lines: string[], index: number): boolean {
  const line = lines[index];
  return (
    FENCE.test(line) ||
    HEADING.test(line) ||
    /^\s*>/.test(line) ||
    /^\s*(?:[-*+]|\d+[.)])\s+/.test(line) ||
    /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
    isTableStart(lines, index)
  );
}

function renderInline(text: string, prefix = 'i'): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let plain = '';
  let nextKey = 0;

  const flushPlain = () => {
    if (plain) {
      nodes.push(plain);
      plain = '';
    }
  };
  const pushNode = (node: ReactNode) => {
    flushPlain();
    nodes.push(node);
    nextKey += 1;
  };
  const key = (kind: string) => `${prefix}-${kind}-${nextKey}`;

  while (cursor < text.length) {
    const remaining = text.slice(cursor);

    // Backslash escapes keep literal markdown characters visible.
    if (remaining[0] === '\\' && cursor + 1 < text.length) {
      plain += text[cursor + 1];
      cursor += 2;
      continue;
    }

    // `inline code`
    if (remaining[0] === '`') {
      const end = text.indexOf('`', cursor + 1);
      if (end > cursor + 1) {
        const code = text.slice(cursor + 1, end);
        pushNode(
          <code key={key('code')}>{code}</code>,
        );
        cursor = end + 1;
        continue;
      }
    }

    // **bold** and __bold__
    if (remaining.startsWith('**') || remaining.startsWith('__')) {
      const marker = remaining.slice(0, 2);
      const end = text.indexOf(marker, cursor + 2);
      if (end > cursor + 2) {
        const inner = text.slice(cursor + 2, end);
        pushNode(
          <strong key={key('strong')}>
            {renderInline(inner, `${prefix}-b${nextKey}`)}
          </strong>,
        );
        cursor = end + 2;
        continue;
      }
    }

    // ~~struck through~~
    if (remaining.startsWith('~~')) {
      const end = text.indexOf('~~', cursor + 2);
      if (end > cursor + 2) {
        const inner = text.slice(cursor + 2, end);
        pushNode(
          <del key={key('del')}>
            {renderInline(inner, `${prefix}-s${nextKey}`)}
          </del>,
        );
        cursor = end + 2;
        continue;
      }
    }

    // *italic* and _italic_ (but not underscores inside snake_case words).
    if (remaining[0] === '*' || remaining[0] === '_') {
      const marker = remaining[0];
      const before = cursor === 0 ? ' ' : text[cursor - 1];
      if (!/[\p{L}\p{N}_]/u.test(before)) {
        let end = text.indexOf(marker, cursor + 1);
        while (end !== -1) {
          const after = text[end + 1] ?? ' ';
          if (!/[\p{L}\p{N}_]/u.test(after)) break;
          end = text.indexOf(marker, end + 1);
        }
        if (end > cursor + 1) {
          const inner = text.slice(cursor + 1, end);
          pushNode(
            <em key={key('em')}>
              {renderInline(inner, `${prefix}-e${nextKey}`)}
            </em>,
          );
          cursor = end + 1;
          continue;
        }
      }
    }

    // [label](https://example.com)
    if (remaining[0] === '[') {
      const labelEnd = text.indexOf('](', cursor + 1);
      const urlEnd = labelEnd === -1 ? -1 : text.indexOf(')', labelEnd + 2);
      if (labelEnd !== -1 && urlEnd !== -1) {
        const label = text.slice(cursor + 1, labelEnd);
        const url = text.slice(labelEnd + 2, urlEnd).trim();
        if (/^https?:\/\//i.test(url)) {
          pushNode(
            <a key={key('link')} href={url} target="_blank" rel="noreferrer noopener">
              {renderInline(label, `${prefix}-l${nextKey}`)}
            </a>,
          );
          cursor = urlEnd + 1;
          continue;
        }
      }
    }

    // Bare URLs become links too.
    if (remaining.startsWith('http://') || remaining.startsWith('https://')) {
      const match = /^https?:\/\/[^\s<>()]+/.exec(remaining);
      if (match) {
        const url = match[0].replace(/[.,;:!?]+$/, '');
        pushNode(
          <a key={key('autolink')} href={url} target="_blank" rel="noreferrer noopener">
            {url}
          </a>,
        );
        cursor += url.length;
        continue;
      }
    }

    plain += remaining[0];
    cursor += 1;
  }

  flushPlain();
  return nodes;
}

function renderHeading(level: number, content: string, key: string) {
  const tag = (`h${Math.min(Math.max(level, 1), 6)}` as
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6');
  return createElement(tag, { key }, renderInline(content, `${key}-h`));
}

function renderTable(
  lines: string[],
  index: number,
  key: string,
): { node: ReactNode; next: number } {
  const headers = splitRow(lines[index]);
  const separators = splitRow(lines[index + 1]);
  const alignments = headers.map((_, cellIndex) => {
    const marker = separators[cellIndex] ?? '';
    if (marker.startsWith(':') && marker.endsWith(':')) return 'center';
    if (marker.endsWith(':')) return 'right';
    return 'left';
  });
  const rows: string[][] = [];
  let cursor = index + 2;
  while (
    cursor < lines.length &&
    lines[cursor].trim() &&
    lines[cursor].includes('|')
  ) {
    rows.push(splitRow(lines[cursor]));
    cursor += 1;
  }
  const node = (
    <div className="md-table-wrap" key={key}>
      <table>
        <thead>
          <tr>
            {headers.map((header, cellIndex) => (
              <th
                key={`${key}-th-${cellIndex}`}
                style={{ textAlign: alignments[cellIndex] }}
              >
                {renderInline(header, `${key}-th-${cellIndex}`)}
              </th>
            ))}
          </tr>
        </thead>
        {rows.length > 0 && (
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${key}-tr-${rowIndex}`}>
                {headers.map((_, cellIndex) => (
                  <td
                    key={`${key}-td-${rowIndex}-${cellIndex}`}
                    style={{ textAlign: alignments[cellIndex] }}
                  >
                    {renderInline(
                      row[cellIndex] ?? '',
                      `${key}-td-${rowIndex}-${cellIndex}`,
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
  return { node, next: cursor };
}

function parseList(
  lines: string[],
  index: number,
  key: string,
): { node: ReactNode; next: number } {
  const first = listMatch(lines[index]);
  if (!first) return { node: null, next: index + 1 };
  const baseIndent = first.indent;
  const ordered = first.ordered;
  const items: string[][] = [];
  let cursor = index;

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (!line.trim()) {
      let next = cursor + 1;
      while (next < lines.length && !lines[next].trim()) next += 1;
      const nextMatch = next < lines.length ? listMatch(lines[next]) : null;
      if (nextMatch && nextMatch.indent >= baseIndent) {
        cursor = next;
        continue;
      }
      break;
    }
    const match = listMatch(line);
    const indent = line.length - line.trimStart().length;
    if (match && match.indent === baseIndent && match.ordered === ordered) {
      items.push([match.text]);
      cursor += 1;
      continue;
    }
    // Deeper lines (continuations and nested lists) belong to the current item.
    if (items.length > 0 && indent > baseIndent) {
      items[items.length - 1].push(line);
      cursor += 1;
      continue;
    }
    break;
  }

  const listNode = createElement(
    ordered ? 'ol' : 'ul',
    { key },
    items.map((parts, itemIndex) => {
      const [firstLine = '', ...rest] = parts;
      const nestedAt = rest.findIndex((line) => {
        const nested = listMatch(line);
        return !!nested && nested.indent > baseIndent;
      });
      const continuationAt = nestedAt === -1 ? rest.length : nestedAt;
      const continuation = rest
        .slice(0, continuationAt)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ');
      const nestedLines = nestedAt === -1 ? [] : rest.slice(nestedAt);
      const itemKey = `${key}-li-${itemIndex}`;
      return (
        <li key={itemKey}>
          {renderInline(
            [firstLine, continuation].filter(Boolean).join(' '),
            itemKey,
          )}
          {nestedLines.length > 0
            ? parseBlocks(nestedLines, `${itemKey}-nested`)
            : null}
        </li>
      );
    }),
  );

  return { node: listNode, next: cursor };
}

function parseBlocks(textLines: string[], prefix = 'md'): ReactNode[] {
  const lines = textLines;
  const nodes: ReactNode[] = [];
  let index = 0;
  let keyIndex = 0;
  const nextKey = (kind: string) => `${prefix}-${kind}-${keyIndex++}`;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const marker = fence[1][0];
      const minimum = fence[1].length;
      const language = fence[2];
      const code: string[] = [];
      index += 1;
      while (index < lines.length) {
        const closing = /^\s*(`{3,}|~{3,})\s*$/.exec(lines[index]);
        if (
          closing &&
          closing[1][0] === marker &&
          closing[1].length >= minimum
        ) {
          index += 1;
          break;
        }
        code.push(lines[index]);
        index += 1;
      }
      nodes.push(
        <pre key={nextKey('pre')}>
          <code className={language ? `language-${language}` : undefined}>
            {code.join('\n')}
          </code>
        </pre>,
      );
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      nodes.push(
        renderHeading(
          heading[1].length,
          heading[2],
          nextKey('heading'),
        ),
      );
      index += 1;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      nodes.push(<hr key={nextKey('hr')} />);
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const table = renderTable(lines, index, nextKey('table'));
      nodes.push(table.node);
      index = table.next;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      nodes.push(
        <blockquote key={nextKey('quote')}>
          {parseBlocks(quote, `${prefix}-quote-${keyIndex}`)}
        </blockquote>,
      );
      continue;
    }

    if (listMatch(line)) {
      const list = parseList(lines, index, nextKey('list'));
      if (list.node) nodes.push(list.node);
      index = list.next;
      continue;
    }

    // Paragraph: gather until a blank line or the start of another block.
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !startsBlock(lines, index)
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    if (paragraph.length === 0) {
      paragraph.push(line.trim());
      index += 1;
    }
    nodes.push(
      <p key={nextKey('p')}>{renderInline(paragraph.join(' '), nextKey('ip'))}</p>,
    );
  }

  return nodes;
}

// A deliberately small, dependency-free Markdown renderer. It covers the
// headings, paragraphs, lists, tables, quotes, code, emphasis, and links that
// Gemini uses for study summaries; everything is escaped by React.
export default function Markdown({ text, className }: MarkdownProps) {
  return (
    <div className={`summary-prose${className ? ` ${className}` : ''}`}>
      {parseBlocks(text.replace(/\r\n?/g, '\n').split('\n'))}
    </div>
  );
}
