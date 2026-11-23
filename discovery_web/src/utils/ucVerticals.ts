export const UC_VERTICALS = [
  "AC & Appliance Repair",
  "Cleaning & Pest Control",
  "Salon & Spa (Women & Men)",
  "Electricians, Plumbers & Carpenters",
  "Painting & Waterproofing",
  "Native Smart Products",
  "Platform & General",
  "Insta Help (Out of Scope)",
] as const;

export type UcVertical = (typeof UC_VERTICALS)[number];

export function mapToUcVertical(record: {
  service_category?: string;
  text?: string;
  summary?: string;
}): UcVertical {
  const text = (record.text || "").toLowerCase();
  const summary = (record.summary || "").toLowerCase();
  const combined = `${text} ${summary}`;
  const category = (record.service_category || "").toLowerCase();

  // 1. "Insta Help (Out of Scope)" -> if text/summary mentions "insta help", "instahelp", or "house help"
  if (
    combined.includes("insta help") ||
    combined.includes("instahelp") ||
    combined.includes("house help") ||
    category.includes("insta help") ||
    category.includes("instahelp") ||
    category.includes("house help")
  ) {
    return "Insta Help (Out of Scope)";
  }

  // 2. "Native Smart Products" -> if text/summary mentions "native" (water purifier / smart lock)
  if (/\bnative\b/i.test(combined)) {
    return "Native Smart Products";
  }

  // 3. "Painting & Waterproofing" -> if text/summary mentions painting, waterproofing, wall panel
  if (
    combined.includes("painting") ||
    combined.includes("waterproofing") ||
    combined.includes("wall panel") ||
    category.includes("painting") ||
    category.includes("renovation")
  ) {
    return "Painting & Waterproofing";
  }

  // 4. "AC & Appliance Repair" -> if service_category matches AC/Appliance or text/summary mentions ac, air conditioner, ro, purifier, fridge, refrigerator, washing machine, geyser, chimney, microwave, stove
  const applianceKeywords = [
    "air conditioner",
    "purifier",
    "fridge",
    "refrigerator",
    "washing machine",
    "geyser",
    "chimney",
    "microwave",
    "stove",
  ];
  if (
    category.includes("ac") ||
    category.includes("appliance") ||
    /\b(ac|ro)\b/i.test(combined) ||
    applianceKeywords.some((kw) => combined.includes(kw))
  ) {
    return "AC & Appliance Repair";
  }

  // 5. "Cleaning & Pest Control" -> if service_category matches Cleaning/Pest or text/summary mentions cleaning, bathroom, kitchen, sofa, carpet, pest, termite, cockroach
  const cleaningKeywords = [
    "cleaning",
    "bathroom",
    "kitchen",
    "sofa",
    "carpet",
    "pest",
    "termite",
    "cockroach",
  ];
  if (
    category.includes("cleaning") ||
    category.includes("pest") ||
    cleaningKeywords.some((kw) => combined.includes(kw))
  ) {
    return "Cleaning & Pest Control";
  }

  // 6. "Salon & Spa (Women & Men)" -> if service_category matches Salon/Spa or text/summary mentions salon, spa, massage, waxing, facial, haircut, beauty, grooming
  const salonKeywords = [
    "salon",
    "spa",
    "massage",
    "waxing",
    "facial",
    "haircut",
    "beauty",
    "grooming",
  ];
  if (
    category.includes("salon") ||
    category.includes("spa") ||
    salonKeywords.some((kw) => combined.includes(kw))
  ) {
    return "Salon & Spa (Women & Men)";
  }

  // 7. "Electricians, Plumbers & Carpenters" -> if service_category matches Plumbing/Electrician/Carpentry or text/summary mentions plumber, electrician, carpenter, furniture, wiring, tap, leak
  const epcKeywords = [
    "plumber",
    "electrician",
    "carpenter",
    "furniture",
    "wiring",
    "tap",
    "leak",
    "plumbing",
    "carpentry",
    "electrical",
  ];
  if (
    category.includes("plumb") ||
    category.includes("electric") ||
    category.includes("carpent") ||
    epcKeywords.some((kw) => combined.includes(kw))
  ) {
    return "Electricians, Plumbers & Carpenters";
  }

  // 8. "Platform & General" -> fallback for general app-wide or uncategorized home-service records
  return "Platform & General";
}
