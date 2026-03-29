import { NextResponse } from 'next/server';
import { db }           from '@/lib/db';

// Clerk webhook — syncs users/orgs to Prisma on signup
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as {
    type?: string;
    data?: { id?: string; email_addresses?: Array<{ email_address?: string }>; first_name?: string; last_name?: string };
  };

  if (body.type === 'user.created' && body.data?.id) {
    const email = body.data.email_addresses?.[0]?.email_address ?? '';
    const slug  = `org-${body.data.id.slice(-8)}`;

    // Create a default org and user for new Clerk users
    try {
      const org = await db.organization.upsert({
        where:  { slug },
        create: { name: `${body.data.first_name ?? 'User'}'s Org`, slug },
        update: {},
      });

      await db.user.upsert({
        where:  { clerkUserId: body.data.id },
        create: { clerkUserId: body.data.id, orgId: org.id, email, role: 'OWNER' },
        update: { email },
      });
    } catch (err) {
      console.error('Clerk webhook sync error', err);
    }
  }

  return NextResponse.json({ received: true });
}
