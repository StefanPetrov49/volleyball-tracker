export type Match = {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  opponent: string;
  location?: string;
  home: boolean;
};

export const matches: Match[] = [
  { id: "1", date: "2026-10-04", time: "19:00", opponent: "Цунами", location: "Васил Симов", home: true },
  { id: "2", date: "2026-10-18", time: "16:00", opponent: "Инкредибалс", location: "", home: true },
  { id: "3", date: "2026-11-29", time: "", opponent: "Владо Волей", location: "", home: true },
  { id: "4", date: "2026-11-25", time: "19:00", opponent: "Extreme Volley", location: "Левски", home: true },
];
