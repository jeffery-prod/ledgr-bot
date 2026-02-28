import { escapeMarkdown } from './formatDate';

interface BuildMessageOptions {
  header: string;
  headerEmoji: string;
  title?: string;
  rows: string[];
  notes: string | null;
  loggedAt?: string;
}

export function buildMessage({ header, headerEmoji, title, rows, notes, loggedAt }: BuildMessageOptions): string {
  const headerLine = title
    ? `${headerEmoji} *${header}* — ${escapeMarkdown(title)}`
    : `${headerEmoji} *${header}*`;

  return [
    headerLine,
    '',
    ...rows,
    ...(notes ? [`📝 ${escapeMarkdown(notes)}`] : []),
    ...(loggedAt ? [`🕐 ${loggedAt}`] : []),
  ].join('\n');
}
