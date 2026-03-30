'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendChartProps {
  data?: Array<{ date: string; incidents: number }>;
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[140px] flex items-center justify-center text-[12px] text-slate-600">
        No trend data yet
      </div>
    );
  }
  const chartData = data;

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#06b6d4' }}
        />
        <Area
          type="monotone"
          dataKey="incidents"
          stroke="#06b6d4"
          strokeWidth={2}
          fill="url(#trendGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#06b6d4' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
