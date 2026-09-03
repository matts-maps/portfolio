// scripts/migrate/lib/countries.mjs
//
// Country-name canonicalisation, built from what's *actually* in the data
// (see the migration report's "country aliases merged" section for how
// this was derived - run `node scripts/migrate/migrate.mjs --profile` to
// re-derive it if new variants show up later).
//
// Anything not listed here is passed through unchanged.

const ALIASES = {
  "republic of congo": "Republic of the Congo",
  "st vincent and the grenadines": "Saint Vincent and the Grenadines",
};

/** Canonicalise a country name string. Case/whitespace-insensitive matching. */
export function canonicalizeCountry(name) {
  const trimmed = (name ?? "").toString().trim();
  const key = trimmed.toLowerCase();
  return ALIASES[key] ?? trimmed;
}

// Values that show up in a `country` field but are not actually a single
// real country - continent/region labels or explicit placeholders that
// leaked into the country field. These get pulled OUT of the country list
// and the record falls back to region/global classification instead.
const NON_COUNTRY_VALUES = new Set(
  ["multiple", "asia-pacific", "global", "worldwide", "n/a", "various"].map((s) =>
    s.toLowerCase()
  )
);

export function isRealCountry(name) {
  const key = (name ?? "").toString().trim().toLowerCase();
  if (!key) return false;
  return !NON_COUNTRY_VALUES.has(key);
}
