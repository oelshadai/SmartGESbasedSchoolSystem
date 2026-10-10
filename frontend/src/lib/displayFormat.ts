const titleCaseWord = (word: string) => {
  const parts = word.split(/([-'])/);
  return parts.map(part => {
    if (part === '-' || part === "'") return part;
    if (!part) return part;
    return part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase();
  }).join('');
};

export const formatDisplayName = (value?: string | null) =>
  (value ?? '').trim().split(/\s+/).filter(Boolean).map(titleCaseWord).join(' ');

export const formatClassName = (value?: string | null) => {
  const normalized = (value ?? '')
    .trim()
    .replace(/_/g, ' ')
    .replace(/\bkg\s*(\d*)\b/gi, (_match, grade: string) => `KG${grade ? ` ${grade}` : ''}`);
  return normalized.split(/\s+/).filter(Boolean).map(word =>
    ['KG', 'BS', 'JHS', 'SHS'].includes(word.toUpperCase()) ? word.toUpperCase() : titleCaseWord(word)
  ).join(' ');
};
