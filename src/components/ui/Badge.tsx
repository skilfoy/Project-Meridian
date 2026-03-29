type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'cyber' | 'conflict' | 'news' | 'maritime' | 'government' | 'environmental' | 'aviation' | 'free' | 'key' | 'paid' | 'default';

const VARIANTS: Record<BadgeVariant, string> = {
  critical:     'bg-red-900/60 text-red-300 border-red-700/50',
  high:         'bg-orange-900/60 text-orange-300 border-orange-700/50',
  medium:       'bg-yellow-900/60 text-yellow-300 border-yellow-700/50',
  low:          'bg-blue-900/60 text-blue-300 border-blue-700/50',
  info:         'bg-slate-800 text-slate-300 border-slate-700',
  cyber:        'bg-purple-900/60 text-purple-300 border-purple-700/50',
  conflict:     'bg-red-900/60 text-red-300 border-red-700/50',
  news:         'bg-sky-900/60 text-sky-300 border-sky-700/50',
  maritime:     'bg-cyan-900/60 text-cyan-300 border-cyan-700/50',
  government:   'bg-amber-900/60 text-amber-300 border-amber-700/50',
  environmental:'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
  aviation:     'bg-blue-900/60 text-blue-300 border-blue-700/50',
  free:         'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
  key:          'bg-yellow-900/60 text-yellow-300 border-yellow-700/50',
  paid:         'bg-rose-900/60 text-rose-300 border-rose-700/50',
  default:      'bg-slate-800 text-slate-300 border-slate-700',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}

function clsx(...args: (string | undefined | false | null)[]): string {
  return args.filter(Boolean).join(' ');
}
