import { useState, useEffect, useRef } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: string;
}

/** Animates a number from 0 to `target` over `duration` ms. */
function useCountUp(target: number, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const prevTarget = useRef<number>(target);

  useEffect(() => {
    // Only re-run when target actually changes
    if (prevTarget.current === target && display !== 0) return;
    prevTarget.current = target;

    if (target === 0) { setDisplay(0); return; }

    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
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

  // Parse value: support "123", 123, "85%", "GH₵ 1,200.00" etc.
  const rawStr = String(value);
  // Extract leading digits / decimal for animation; preserve suffix/prefix
  const numMatch = rawStr.match(/^([^\d]*)(\d[\d,.]*)(.*)$/);
  const numericPart = numMatch ? parseFloat(numMatch[2].replace(/,/g, '')) : NaN;
  const isAnimatable = !isNaN(numericPart);
  const prefix = numMatch ? numMatch[1] : '';
  const suffix = numMatch ? numMatch[3] : '';

  const animated = useCountUp(isAnimatable ? numericPart : 0);

  // Formatted animated number (add commas for large ints)
  const displayValue = isAnimatable
    ? `${prefix}${Number.isInteger(numericPart) ? animated.toLocaleString() : animated.toFixed(1)}${suffix}`
    : rawStr;

  return (
    <div className={`relative group rounded-2xl border ${style.border} bg-card/60 backdrop-blur-sm p-5 shadow-lg ${style.shadow} hover:scale-[1.02] transition-all duration-200 overflow-hidden`}>
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${style.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />
      {/* Background glow */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 ${style.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-bold text-foreground leading-none tabular-nums">{displayValue}</p>
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
