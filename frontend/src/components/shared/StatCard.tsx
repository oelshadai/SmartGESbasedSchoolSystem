interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: string;
}

const COLOR_MAP: Record<string, { border: string; bg: string; shadow: string; bar: string }> = {
  'text-primary':     { border: 'border-blue-500/20',    bg: 'bg-blue-500/10',    shadow: 'shadow-blue-500/10',    bar: 'from-blue-500 to-cyan-400' },
  'text-secondary':   { border: 'border-purple-500/20',  bg: 'bg-purple-500/10',  shadow: 'shadow-purple-500/10',  bar: 'from-purple-500 to-violet-400' },
  'text-info':        { border: 'border-cyan-500/20',    bg: 'bg-cyan-500/10',    shadow: 'shadow-cyan-500/10',    bar: 'from-cyan-500 to-sky-400' },
  'text-success':     { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', shadow: 'shadow-emerald-500/10', bar: 'from-emerald-500 to-green-400' },
  'text-accent':      { border: 'border-orange-500/20',  bg: 'bg-orange-500/10',  shadow: 'shadow-orange-500/10',  bar: 'from-orange-500 to-amber-400' },
  'text-green-600':   { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', shadow: 'shadow-emerald-500/10', bar: 'from-emerald-500 to-green-400' },
  'text-red-600':     { border: 'border-red-500/20',     bg: 'bg-red-500/10',     shadow: 'shadow-red-500/10',     bar: 'from-red-500 to-rose-400' },
  'text-blue-600':    { border: 'border-blue-500/20',    bg: 'bg-blue-500/10',    shadow: 'shadow-blue-500/10',    bar: 'from-blue-500 to-cyan-400' },
  'text-orange-600':  { border: 'border-orange-500/20',  bg: 'bg-orange-500/10',  shadow: 'shadow-orange-500/10',  bar: 'from-orange-500 to-amber-400' },
};

const DEFAULT_STYLE = { border: 'border-slate-700/40', bg: 'bg-slate-500/10', shadow: 'shadow-slate-500/5', bar: 'from-slate-500 to-slate-400' };

const StatCard = ({ label, value, icon, color = 'text-primary', trend }: StatCardProps) => {
  const style = COLOR_MAP[color] ?? DEFAULT_STYLE;
  return (
    <div className={`relative group rounded-2xl border ${style.border} bg-card/60 backdrop-blur-sm p-5 shadow-lg ${style.shadow} hover:scale-[1.02] transition-all duration-200 overflow-hidden`}>
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${style.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />
      {/* Background glow */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 ${style.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-bold text-foreground leading-none">{value}</p>
          {trend && <p className="text-xs text-emerald-500 mt-2 font-medium">{trend}</p>}
        </div>
        <div className={`flex-shrink-0 p-2.5 rounded-xl ${style.bg} border ${style.border} ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
