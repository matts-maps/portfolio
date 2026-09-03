// scripts/migrate/lib/locations.mjs
//
// Builds the embedded location entries described in
// claude/data-model-redesign-2026-09.md (updated 3 September 2026): there
// is no shared Location catalog any more - every Project/MapItem carries
// its own `locations` array of {settlement, state, country, region,
// continent, lat, lng, precision} objects directly, rather than a
// locationIds[] pointing at a separate locations.json. Each place is
// resolved fresh for the record it belongs to; nothing is deduplicated or
// referenced across records.
//
// Classification rules (matching the design doc):
//   - a named `location` + exactly one real country  -> settlement set,      precision "exact"
//   - no `location`, exactly one real country          -> country set,        precision "capital"
//   - no `location`, more than one real country         -> one entry PER country
//   - no real country, but a continent/region label     -> region or continent set, precision "region-centroid"
//   - nothing usable at all                              -> everything null,  precision "global-centroid"
//
// `state` (a province/sub-national admin unit) has no source field in the
// legacy data at all - it's new, editor-entered-only metadata, so migration
// never sets it.
//
// A record's own lat/lng is trusted as that record's location's coordinate
// (per Matt's rule: it's either the actual project/map site, or the
// country's capital used as a stand-in). When the *same* place is seen
// again within the SAME project's rows with materially different
// coordinates, that's flagged in the report rather than silently
// overwritten - see `coordinateConflicts`. (There's no cross-project
// conflict tracking any more, since locations aren't shared across
// projects - each project owns its own copy.)

import { cleanStr } from "./text.mjs";
import { canonicalizeCountry, isRealCountry } from "./countries.mjs";
import { COUNTRY_TO_REGION, REGION_TO_CONTINENT, REF_CONTINENT_NAMES } from "./geo.mjs";

const COORD_CONFLICT_THRESHOLD_DEGREES = 0.5;

/** Country name -> its UN-geoscheme region, or null if unknown/no-data. */
function regionForCountry(country) {
  return COUNTRY_TO_REGION[country] || null;
}

/** Country name -> its continent, via the region mapping above. */
function continentForCountry(country) {
  const region = regionForCountry(country);
  return region ? REGION_TO_CONTINENT[region] || null : null;
}

/**
 * A raw `continent` field value from the legacy data might actually be one
 * of the 7 continent names, or one of the 25 finer UN-geoscheme region
 * names - the legacy schema never distinguished the two. Resolve it to
 * whichever it actually matches so the new schema's separate `region`/
 * `continent` fields get the right one, rather than always dumping it into
 * `continent` regardless of granularity.
 */
function resolveContinentLabel(raw) {
  if (!raw) return { region: null, continent: null };
  if (REF_CONTINENT_NAMES.has(raw)) return { region: null, continent: raw };
  if (REGION_TO_CONTINENT[raw]) return { region: raw, continent: REGION_TO_CONTINENT[raw] };
  // Doesn't match either reference list exactly - keep it as a freeform
  // continent value rather than silently dropping it; worth a manual look.
  return { region: null, continent: raw };
}

export class LocationBuilder {
  constructor() {
    this.coordinateConflicts = [];
    this.nonCountryValuesStripped = [];
  }

  /**
   * Resolve one source record (a project row, a map, a webmap) to the list
   * of embedded location entries it belongs to, deduplicated against
   * `existingEntries` (this record's own group so far - e.g. the other
   * rows of the same multi-country project). Never returns an empty array
   * for the record's own contribution - falls back to a "global" entry as
   * a last resort so nothing is left unpinned, but that fallback is rare
   * and always worth a manual look (see the report's `noUsableLocation`
   * list).
   */
  resolve(record, { sourceLabel, flags, existingEntries = [] }) {
    const location = cleanStr(record.location);
    const rawContinent = cleanStr(record.continent);
    const lat = typeof record.lat === "number" ? record.lat : parseFloat(record.lat);
    const lng = typeof record.lng === "number" ? record.lng : parseFloat(record.lng);

    const rawCountries = Array.isArray(record.country)
      ? record.country
      : record.country
      ? [record.country]
      : [];

    const realCountries = [];
    for (const raw of rawCountries) {
      if (!isRealCountry(raw)) {
        this.nonCountryValuesStripped.push({ value: raw, fromRecord: sourceLabel });
        continue;
      }
      realCountries.push(canonicalizeCountry(raw));
    }

    // Case: a named site, exactly one real country.
    if (location && realCountries.length === 1) {
      const country = realCountries[0];
      const entry = this._build(existingEntries, {
        key: `site::${country.toLowerCase()}::${location.toLowerCase()}`,
        settlement: location,
        state: null,
        country,
        region: regionForCountry(country),
        continent: continentForCountry(country) || resolveContinentLabel(rawContinent).continent || null,
        lat,
        lng,
        precision: "exact",
        sourceLabel,
      });
      return [entry];
    }

    // Case: a named site but zero or multiple countries - ambiguous, flag it.
    if (location && realCountries.length !== 1) {
      flags.push({
        type: "ambiguous_site_country",
        message: `"${location}" has ${realCountries.length} countries attached`,
        fromRecord: sourceLabel,
      });
    }

    // Case: one or more real countries, no specific site named -> one
    // entry per country. Each source row's own lat/lng is used for every
    // country it lists; when a project's rows were split one-per-country
    // upstream (the GIMAC pattern) this is exactly right because each row
    // already carried that country's own coordinate.
    if (realCountries.length >= 1) {
      return realCountries.map((country) =>
        this._build(existingEntries, {
          key: `country::${country.toLowerCase()}`,
          settlement: null,
          state: null,
          country,
          region: regionForCountry(country),
          continent: continentForCountry(country) || resolveContinentLabel(rawContinent).continent || null,
          lat,
          lng,
          precision: "capital",
          sourceLabel,
        })
      );
    }

    // Case: no usable country, but a continent/region label survives.
    if (rawContinent) {
      const { region, continent } = resolveContinentLabel(rawContinent);
      const entry = this._build(existingEntries, {
        key: `region::${rawContinent.toLowerCase()}`,
        settlement: null,
        state: null,
        country: null,
        region,
        continent,
        lat,
        lng,
        precision: "region-centroid",
        sourceLabel,
      });
      return [entry];
    }

    // Last resort: nothing to go on at all.
    flags.push({
      type: "no_usable_location",
      message: "no location/country/continent on this record",
      fromRecord: sourceLabel,
    });
    const entry = this._build(existingEntries, {
      key: "global::default",
      settlement: null,
      state: null,
      country: null,
      region: null,
      continent: null,
      lat: Number.isFinite(lat) ? lat : 0,
      lng: Number.isFinite(lng) ? lng : 0,
      precision: "global-centroid",
      sourceLabel,
    });
    return [entry];
  }

  /**
   * Returns an existing entry from `existingEntries` matching `key`
   * (reusing its coordinates, flagging a conflict if this occurrence
   * disagrees materially), or builds and returns a brand-new entry object.
   * `existingEntries` is scoped to one record-group (e.g. one project's
   * rows) by the caller - entries are never deduplicated across different
   * projects/maps any more, since each embeds its own copy.
   */
  _build(existingEntries, { key, settlement, state, country, region, continent, lat, lng, precision, sourceLabel }) {
    const existing = existingEntries.find((e) => e._key === key);
    if (existing) {
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        (Math.abs(existing.lat - lat) > COORD_CONFLICT_THRESHOLD_DEGREES ||
          Math.abs(existing.lng - lng) > COORD_CONFLICT_THRESHOLD_DEGREES)
      ) {
        this.coordinateConflicts.push({
          location: settlement || country || region || continent || "global",
          existing: { lat: existing.lat, lng: existing.lng },
          conflicting: { lat, lng },
          fromRecord: sourceLabel,
        });
      }
      return existing;
    }
    const entry = {
      _key: key,
      settlement: settlement || null,
      state: state || null,
      country: country || null,
      region: region || null,
      continent: continent || null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      precision,
    };
    existingEntries.push(entry);
    return entry;
  }
}

/** Strips the internal `_key` bookkeeping field before writing to JSON. */
export function stripLocationKey(entry) {
  const { _key, ...rest } = entry;
  return rest;
}

/** Two entries are "the same place" for the map<->project auto-link heuristic
 * if they share a non-empty settlement, country, region, or continent. */
export function locationsShareAPlace(entriesA, entriesB) {
  const keyOf = (e) => [e.settlement, e.state, e.country, e.region, e.continent].filter(Boolean).map((s) => s.toLowerCase());
  const keysA = new Set(entriesA.flatMap(keyOf));
  return entriesB.some((e) => keyOf(e).some((k) => keysA.has(k)));
}
