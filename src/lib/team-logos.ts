/**
 * Team name → NCAA SEO slug mapping for logo URLs.
 * Logo URL: https://www.ncaa.com/sites/default/files/images/logos/schools/bgd/{slug}.svg
 *
 * This covers all 68 tournament teams. Slugs sourced from ncaa-api.henrygd.me
 */

const TEAM_SLUGS: Record<string, string> = {
  // East Region
  "Duke": "duke",
  "Siena": "siena",
  "Ohio St.": "ohio-st",
  "TCU": "tcu",
  "St. John's": "st-johns-ny",
  "Northern Iowa": "northern-iowa",
  "Kansas": "kansas",
  "Cal Baptist": "cal-baptist",
  "Louisville": "louisville",
  "South Florida": "south-fla",
  "Michigan St.": "michigan-st",
  "North Dakota St.": "north-dakota-st",
  "UCLA": "ucla",
  "UCF": "ucf",
  "UConn": "connecticut",
  "Furman": "furman",

  // West Region
  "Arizona": "arizona",
  "Long Island": "long-island",
  "Villanova": "villanova",
  "Utah St.": "utah-st",
  "Wisconsin": "wisconsin",
  "High Point": "high-point",
  "Arkansas": "arkansas",
  "Hawaii": "hawaii",
  "BYU": "byu",
  "Gonzaga": "gonzaga",
  "Kennesaw St.": "kennesaw-st",
  "Miami (FL)": "miami-fl",
  "Missouri": "missouri",
  "Purdue": "purdue",
  "Queens (N.C.)": "queens-nc",

  // South Region
  "Florida": "florida",
  "Clemson": "clemson",
  "Iowa": "iowa",
  "Vanderbilt": "vanderbilt",
  "McNeese": "mcneese",
  "Nebraska": "nebraska",
  "Troy": "troy",
  "North Carolina": "north-carolina",
  "VCU": "vcu",
  "Illinois": "illinois",
  "Penn": "penn",
  "Saint Mary's": "st-marys-ca",
  "Texas A&M": "texas-am",
  "Houston": "houston",
  "Idaho": "idaho",

  // Midwest Region
  "Michigan": "michigan",
  "Georgia": "georgia",
  "Saint Louis": "saint-louis",
  "Texas Tech": "texas-tech",
  "Akron": "akron",
  "Alabama": "alabama",
  "Hofstra": "hofstra",
  "Tennessee": "tennessee",
  "Virginia": "virginia",
  "Wright St.": "wright-st",
  "Kentucky": "kentucky",
  "Santa Clara": "santa-clara",
  "Iowa St.": "iowa-st",
  "Tennessee St.": "tennessee-st",

  // First Four teams
  "Lehigh": "lehigh",
  "Prairie View A&M": "prairie-view",
  "Howard": "howard",
  "UMBC": "umbc",
  "NC State": "nc-state",
  "Texas": "texas",
  "SMU": "smu",
  "Miami (Ohio)": "miami-oh",
};

const NCAA_LOGO_BASE = "https://www.ncaa.com/sites/default/files/images/logos/schools/bgd";

/**
 * Get the logo URL for a team name. Returns null if not found.
 */
export function getTeamLogoUrl(teamName: string | null): string | null {
  if (!teamName) return null;
  const slug = TEAM_SLUGS[teamName];
  if (!slug) return null;
  return `${NCAA_LOGO_BASE}/${slug}.svg`;
}

/**
 * Get the logo URL from an NCAA SEO slug directly.
 */
export function getLogoUrlFromSlug(seoSlug: string): string {
  return `${NCAA_LOGO_BASE}/${seoSlug}.svg`;
}
