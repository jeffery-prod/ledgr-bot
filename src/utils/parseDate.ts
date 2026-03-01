export function parseDate(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  const today = new Date();

  if (trimmed === 'today') {
    return formatDate(today);
  }

  if (trimmed === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return formatDate(yesterday);
  }

  const parts = trimmed.split('/');
  if (parts.length >= 2) {
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const year = parts[2]
      ? parts[2].length === 2
        ? 2000 + parseInt(parts[2])
        : parseInt(parts[2])
      : today.getFullYear();

    const date = new Date(year, month - 1, day);
    if (isValidDate(date, month, day, year)) {
      return formatDate(date);
    }
  }

  return null;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidDate(date: Date, month: number, day: number, year: number): boolean {
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
