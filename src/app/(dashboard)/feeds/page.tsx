import { redirect } from 'next/navigation';

export default function FeedsRoute() {
  redirect('/settings?tab=sources');
}
