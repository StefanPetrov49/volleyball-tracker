export type Match = {
  id: string;
  date: string;
  time: string | null;
  opponent: string;
  location: string | null;
  home: boolean;
  scoreUs: number | null;
  scoreThem: number | null;
};