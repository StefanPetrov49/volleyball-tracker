/** Result linked to a scheduled match, from our team's point of view. */
export type MatchResultSummary = {
  id: number; // match_results.id → /results/<id>
  finished: boolean; // false while no sets are entered yet
  us: number; // sets won by Яките пичове
  them: number; // sets won by the opponent
  sets: { us: number; them: number }[];
};

export type Match = {
  id: string;
  date: string;
  time: string | null;
  opponent: string;
  location: string | null;
  home: boolean;
  result?: MatchResultSummary | null;
};
