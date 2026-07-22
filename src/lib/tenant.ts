import { createHash } from 'crypto';
import { db } from '@/lib/db';

export interface EnsureTenantInput {
  orgId: string;
  userId: string;
  personalWorkspace?: boolean;
}

function workspaceSlug(orgId: string): string {
  const readable = orgId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const suffix = createHash('sha256').update(orgId).digest('hex').slice(0, 10);
  return `${readable || 'workspace'}-${suffix}`;
}

function placeholderEmail(userId: string): string {
  const localPart = userId.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 64) || 'user';
  return `${localPart}@identity.meridian.local`;
}

export async function ensureTenant(input: EnsureTenantInput): Promise<void> {
  const name = input.personalWorkspace
    ? 'Personal Meridian Workspace'
    : `Meridian Workspace ${input.orgId.slice(-8)}`;

  await db.$transaction(async (tx) => {
    await tx.organization.upsert({
      where: { id: input.orgId },
      create: {
        id: input.orgId,
        name,
        slug: workspaceSlug(input.orgId),
      },
      update: {},
    });

    await tx.user.upsert({
      where: { clerkUserId: input.userId },
      create: {
        orgId: input.orgId,
        clerkUserId: input.userId,
        email: placeholderEmail(input.userId),
      },
      update: {
        orgId: input.orgId,
      },
    });
  });
}
