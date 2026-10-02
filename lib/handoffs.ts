import type { Handoff } from "./types";

// Links come only from pages named in the evidence files (docs/03, section 7.4).
export const HANDOFFS: Record<Exclude<Handoff, "none">, { label: string; url?: string; note?: string }> = {
  university_office: { label: "Your university's student support or international office" },
  icp: { label: "Federal Authority for Identity, Citizenship, Customs and Port Security (ICP)", url: "https://icp.gov.ae/en/" },
  tamm: {
    label: "TAMM, Abu Dhabi's official government services app",
    url: "https://apps.apple.com/us/app/tamm-abu-dhabi-government/id1435485576",
  },
  uae_pass: {
    label: "UAE Pass",
    url: "https://u.ae/en/about-the-uae/digital-uae/digital-transformation/platforms-and-apps/the-uae-pass-app",
    note: "Help desk 600 561 111",
  },
  mohre: {
    label: "Ministry of Human Resources and Emiratisation (MoHRE)",
    url: "https://u.ae/en/information-and-services/jobs/Sector-of-employment/employment-in-the-private-sector/work-permits",
  },
  mofa: { label: "UAE Ministry of Foreign Affairs, attestation service", url: "https://www.mofa.gov.ae/en/services/attestation" },
  adro: { label: "Abu Dhabi Residents Office (ADRO)", url: "https://adro.gov.ae/" },
  emergency_services: { label: "Contact local emergency services or your university office now" },
};

export const HANDOFF_VALUES = Object.keys(HANDOFFS);
