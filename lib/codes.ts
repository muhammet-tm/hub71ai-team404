// ISO 3166-1 alpha-3 codes for the header of the pass. Unknown countries fall back to their first three letters.
const ISO3: Record<string, string> = {
  turkmenistan: "TKM", uzbekistan: "UZB", kazakhstan: "KAZ", kyrgyzstan: "KGZ", tajikistan: "TJK", azerbaijan: "AZE",
  russia: "RUS", ukraine: "UKR", pakistan: "PAK", india: "IND", bangladesh: "BGD", "sri lanka": "LKA", nepal: "NPL",
  egypt: "EGY", jordan: "JOR", syria: "SYR", lebanon: "LBN", iraq: "IRQ", iran: "IRN", palestine: "PSE", yemen: "YEM",
  sudan: "SDN", morocco: "MAR", algeria: "DZA", tunisia: "TUN", libya: "LBY", nigeria: "NGA", kenya: "KEN",
  ethiopia: "ETH", china: "CHN", philippines: "PHL", indonesia: "IDN", malaysia: "MYS", turkey: "TUR", "türkiye": "TUR",
  "saudi arabia": "SAU", oman: "OMN", kuwait: "KWT", bahrain: "BHR", qatar: "QAT", "united states": "USA",
  "united kingdom": "GBR", france: "FRA", germany: "DEU", canada: "CAN", japan: "JPN", "south korea": "KOR",
  brazil: "BRA", colombia: "COL", mexico: "MEX", argentina: "ARG", chile: "CHL", peru: "PER", vietnam: "VNM",
  thailand: "THA",
};

export function countryCode(country: string): string {
  const key = country.trim().toLowerCase();
  if (!key) return "---";
  return ISO3[key] || key.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "-");
}
