import type { PollStatus, PollType } from '@prisma/client';

export type CreatePollRequest = {
  title: string;
  description?: string | null;
  type: PollType;
  maxSelections?: number;
  isAnonymous?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  options: { text: string }[];
};

export type UpdatePollRequest = Partial<Omit<CreatePollRequest, 'options'>> & {
  options?: { id?: string; text: string; sortOrder?: number }[];
};

export type PollListItem = {
  id: string;
  title: string;
  status: PollStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export type PollDetail = {
  id: string;
  title: string;
  description: string | null;
  status: PollStatus;
  type: PollType;
  maxSelections: number;
  isAnonymous: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  options: { id: string; text: string }[];
};

export type VoteRequest = { optionIds: string[] };

