import type { Buddy } from "./types";

// All fictional. Shown with the label "Sample data".
export const BUDDIES: Buddy[] = [
  {
    name: "Haruka",
    country: "Japan",
    languages: ["Japanese", "English"],
    university: "Abu Dhabi University",
    program: "BSc Information Technology, year 3",
    note: "Arrived two years ago. Can walk you through your first week on campus.",
  },
  {
    name: "Mateo",
    country: "Colombia",
    languages: ["Spanish", "English"],
    university: "Abu Dhabi University",
    program: "BBA Finance, year 2",
    note: "Knows the bus routes and where students buy their first SIM.",
  },
  {
    name: "Li Na",
    country: "China",
    languages: ["Chinese", "English"],
    university: "Abu Dhabi University",
    program: "BSc Civil Engineering, year 4",
    note: "Runs a student club that welcomes new international students.",
  },
];

export function matchBuddy(country: string): Buddy {
  const c = country.trim().toLowerCase();
  return BUDDIES.find((b) => b.country.toLowerCase() === c) || BUDDIES[0];
}
