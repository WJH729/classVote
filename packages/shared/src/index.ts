export type PollStatus = 'draft' | 'published' | 'closed';

export type PollType = 'single' | 'multiple';

export interface PollListItemDto {
  id: string;
  title: string;
  status: PollStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface PollOptionDto {
  id: string;
  text: string;
}

export interface PollDetailDto {
  id: string;
  title: string;
  description: string | null;
  status: PollStatus;
  type: PollType;
  maxSelections: number;
  options: PollOptionDto[];
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface VoteRequestDto {
  optionIds: string[];
}

export interface PollResultOptionDto {
  optionId: string;
  text: string;
  votes: number;
}

export interface PollResultsDto {
  pollId: string;
  totalVotes: number;
  options: PollResultOptionDto[];
  generatedAt: string;
}

