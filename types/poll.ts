export type PollOption = {
  id: string;
  date: string;
  time: string | null;
  location: string | null;
  votes: number;
  voters: string[];
};

export type Poll = {
  id: string;
  question: string;
  createdAt: string;
  myVotes: string[];
  notVoted: string[];
  options: PollOption[];
};