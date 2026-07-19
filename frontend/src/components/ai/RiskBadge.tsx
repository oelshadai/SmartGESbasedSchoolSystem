import { Badge } from '@/components/ui/badge';

const config = {
  HIGH:      { label: 'High Risk',  className: 'bg-red-100 text-red-800 border-red-200' },
  MEDIUM:    { label: 'Medium Risk',className: 'bg-amber-100 text-amber-800 border-amber-200' },
  LOW:       { label: 'Low Risk',   className: 'bg-green-100 text-green-700 border-green-200' },
  EXCELLING: { label: 'Excelling',  className: 'bg-blue-100 text-blue-800 border-blue-200' },
} as const;

type Level = keyof typeof config;

export default function RiskBadge({ level }: { level: string }) {
  const c = config[level as Level] ?? { label: level, className: 'bg-gray-100 text-gray-700' };
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}
