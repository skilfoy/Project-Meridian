'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { clsx } from 'clsx';
import {
  Globe, LayoutDashboard, Eye, BarChart2, Users,
  Rss, Bug, Bookmark, Settings, Shield,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/globe',     icon: Globe,           label: 'Globe' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/watchlist', icon: Eye,             label: 'Watchlist' },
  { href: '/compare',  icon: BarChart2,        label: 'Compare' },
  { href: '/actors',   icon: Users,            label: 'Actors' },
  { href: '/feeds',    icon: Rss,              label: 'API Feeds' },
  { href: '/debug',    icon: Bug,              label: 'Debug' },
  { href: '/saved',    icon: Bookmark,         label: 'Saved' },
  { href: '/settings', icon: Settings,         label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full bg-[#0a0e1a] text-slate-200">
      {/* Sidebar */}
      <aside className="flex flex-col w-16 shrink-0 border-r border-white/[0.06] bg-[#0f1629]">
        {/* Logo */}
        <div className="flex items-center justify-center h-14 border-b border-white/[0.06]">
          <Shield className="w-6 h-6 text-cyan-400" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col items-center gap-1 py-3 flex-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={clsx(
                  'group flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all',
                  active
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                )}
              >
                <Icon className="w-4.5 h-4.5" strokeWidth={1.5} />
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="flex items-center justify-center pb-4">
          <UserButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  );
}
