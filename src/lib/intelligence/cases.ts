import { SignalCaseStatus, SignalDisposition } from '@prisma/client';
import { db } from '@/lib/db';

export interface UpsertSignalCaseInput {
  orgId: string;
  userId: string;
  signalKey: string;
  theaterId?: string;
  family: string;
  title: string;
  firstSeenAt: string;
  lastSeenAt: string;
  latestRunId?: string;
  latestSignalId?: string;
}

export interface UpdateSignalCaseInput {
  orgId: string;
  userId: string;
  caseId: string;
  status?: SignalCaseStatus;
  disposition?: SignalDisposition | null;
  assignedTo?: string | null;
  watched?: boolean;
}

export interface AddSignalCaseNoteInput {
  orgId: string;
  userId: string;
  caseId: string;
  body: string;
}

export async function upsertSignalCase(input: UpsertSignalCaseInput) {
  return db.signalCase.upsert({
    where: { orgId_signalKey: { orgId: input.orgId, signalKey: input.signalKey } },
    create: {
      orgId: input.orgId,
      signalKey: input.signalKey,
      theaterId: input.theaterId,
      family: input.family,
      title: input.title,
      firstSeenAt: new Date(input.firstSeenAt),
      lastSeenAt: new Date(input.lastSeenAt),
      latestRunId: input.latestRunId,
      latestSignalId: input.latestSignalId,
    },
    update: {
      theaterId: input.theaterId,
      family: input.family,
      title: input.title,
      lastSeenAt: new Date(input.lastSeenAt),
      latestRunId: input.latestRunId,
      latestSignalId: input.latestSignalId,
    },
    include: { notes: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function updateSignalCase(input: UpdateSignalCaseInput) {
  const existing = await db.signalCase.findFirst({ where: { id: input.caseId, orgId: input.orgId } });
  if (!existing) return null;

  const acknowledgement = input.status === SignalCaseStatus.ACKNOWLEDGED && !existing.acknowledgedAt
    ? { acknowledgedAt: new Date(), acknowledgedBy: input.userId }
    : {};

  return db.signalCase.update({
    where: { id: input.caseId },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.disposition !== undefined ? { disposition: input.disposition } : {}),
      ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {}),
      ...(input.watched !== undefined ? { watched: input.watched } : {}),
      ...acknowledgement,
    },
    include: { notes: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function addSignalCaseNote(input: AddSignalCaseNoteInput) {
  const existing = await db.signalCase.findFirst({ where: { id: input.caseId, orgId: input.orgId } });
  if (!existing) return null;

  await db.signalCaseNote.create({
    data: {
      orgId: input.orgId,
      caseId: input.caseId,
      authorId: input.userId,
      body: input.body,
    },
  });

  return db.signalCase.findUnique({
    where: { id: input.caseId },
    include: { notes: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function listSignalCases(orgId: string, theaterId?: string) {
  return db.signalCase.findMany({
    where: { orgId, ...(theaterId ? { theaterId } : {}) },
    orderBy: [{ watched: 'desc' }, { updatedAt: 'desc' }],
    include: { notes: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });
}
