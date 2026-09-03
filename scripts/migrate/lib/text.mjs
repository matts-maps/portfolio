// scripts/migrate/lib/text.mjs
//
// Small, dependency-free string/array helpers used throughout the migration.
// No behaviour here is specific to this site's data - kept generic on purpose.

/** Trim to a string, collapsing null/undefined to "". */
export function cleanStr(v) {
  return (v ?? "").toString().trim();
}

/**
 * Normalise a field that's sometimes a bare value and sometimes an array
 * (the exact inconsistency flagged in the Aug 2026 review) into a clean array.
 * Drops empty strings / null / undefined entries.
 */
export function toArray(v) {
  if (v === undefined || v === null || v === "") return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr
    .map((x) => (typeof x === "string" ? x.trim() : x))
    .filter((x) => x !== "" && x !== null && x !== undefined);
}

/** URL/ID-safe slug: lowercase, strip diacritics, collapse non-alphanumerics to hyphens. */
export function slugify(s) {
  return cleanStr(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/['’]/g, "") // drop apostrophes rather than turning them into hyphens
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Make `slug` unique against `usedSlugs` by appending -2, -3, ... as needed.
 * Mutates `usedSlugs` by adding the returned slug.
 */
export function uniqueSlug(slug, usedSlugs) {
  let candidate = slug || "item";
  let n = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${slug || "item"}-${n}`;
    n += 1;
  }
  usedSlugs.add(candidate);
  return candidate;
}

/** Parse a year that might arrive as a number, a numeric string, or junk. */
export function parseYear(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(cleanStr(v), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Deep-ish equality for the "does this project row belong to the same
 * logical project as that one" check. Order-sensitive for arrays (the
 * source data is copy-pasted per row, so array order is stable within a
 * duplicated group in practice) but that's fine for our purposes - a
 * false "different group" split just means two projects instead of one
 * merge, which is safe and gets caught in the report.
 */
export function stableKey(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}
