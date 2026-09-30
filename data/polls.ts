export type PollOption = {
  id: string;
  date: string;    // YYYY-MM-DD
  time?: string;   // HH:mm
  location?: string;
  votes: number;
};

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: string;
  addedToCalendar?: string; // option id that was added
};

export const polls: Poll[] = [];
