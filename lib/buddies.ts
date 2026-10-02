import type { Buddy } from "./types";

// All fictional. Shown with the label "Sample data".
export const BUDDIES: Buddy[] = [
  {
    name: "Aylar",
    country: "Turkmenistan",
    languages: ["Turkmen", "Russian", "English"],
    university: "Abu Dhabi University",
    program: "BSc Information Technology, year 3",
    note: "Arrived two years ago. Can walk you through your first week on campus.",
  },
  {
    name: "Timur",
    country: "Uzbekistan",
    languages: ["Uzbek", "Russian", "English"],
    university: "Abu Dhabi University",
    program: "BBA Finance, year 2",
    note: "Knows the bus routes and where students buy their first SIM.",
  },
  {
    name: "Dana",
    country: "Kazakhstan",
    languages: ["Kazakh", "Russian", "English"],
    university: "Abu Dhabi University",
    program: "BSc Civil Engineering, year 4",
    note: "Member of a student club for students from Central Asia.",
  },
];

export function matchBuddy(country: string): Buddy {
  const c = country.trim().toLowerCase();
  return BUDDIES.find((b) => b.country.toLowerCase() === c) || BUDDIES[0];
}
