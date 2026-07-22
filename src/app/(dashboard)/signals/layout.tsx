import type { ReactNode } from 'react';
import { SignalCaseWorkbench } from '@/components/meridian/SignalCaseWorkbench';

export default function SignalCenterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full min-h-0">
      {children}
      <SignalCaseWorkbench />
    </div>
  );
}
