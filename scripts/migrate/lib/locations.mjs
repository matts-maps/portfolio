// scripts/migrate/lib/locations.mjs
//
// Builds the shared Location catalog described in
// claude/data-model-redesign-2026-09.md: every place defined once, with a
// stable id, referenced everywhere else by that id.
//
// Classification rules (matching the design doc):
//   - a named `location` + exactly one real country  -> type "site",      precision "exact"
//   - no `location`, exactly one real country          -> type "country",   precision "capital"
//   - no `location`, more than one real country         -> one "country" location PER country
//   - no real country, but a continent/region label     -> type "region",   precision "region-centroid"
//   - nothing usable at all                              -> type "global",   precision "global-centroid"
//
// A record's own lat/lng is trusted as that record's location's coordinate
// (per Matt's rule: it's either the actual project/map site, or the
// country's capital used as a stand-in). When the *same* place is seen
// again with materially different coordinates, that's flagged in the
// report rather than silently overwritten - see `coordinateConflicts`.

import { cleanStr, slugify, uniqueSlug } from "./text.mjs";
import { canonicalizeCountry, isRealCountry } from "./countries.mjs";

const COORD_CONFLICT_THRESHOLD_DEGREES = 0.5;

export class LocationCatalog {
  constructor() {
    this.byKey = new Map(); // dedupe key -> location record
    this.usedSlugs = new Set();
    this.coordinateConflicts = [];
    this.nonCountryValuesStripped = [];
  }

  _upsert({ key, id, name, type, country, continent, lat, lng, precision, sourceLabel }) {
    const existing = this.byKey.get(key);
    if (existing) {
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        (Math.abs(existing.lat - lat) > COORD_CONFLICT_THRESHOLD_DEGREES ||
          Math.abs(existing.lng - lng) > COORD_CONFLICT_THRESHOLD_DEGREES)
      ) {
        this.coordinateConflicts.push({
          locationId: existing.id,
          existing: { lat: existing.lat, lng: existing.lng },
          conflicting: { lat, lng },
          fromRecord: sourceLabel,
        });
      }
      return existing.id;
    }

    const baseSlug = slugify(id);
    const slug = uniqueSlug(baseSlug, this.usedSlugs);
    const record = {
      id: slug,
      name,
      type,
      country: country || null,
      continent: continent || null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      precision,
    };
    this.byKey.set(key, record);
    return record.id;
  }

  /**
   * Resolve one source record (a project row, a map, a webmap) to the list
   * of Location ids it belongs to. Never returns an empty array - falls
   * back to a "global" bucket as a last resort so nothing is left unpinned,
   * but that fallback is rare and always worth a manual look (see the
   * report's `noUsableLocation` list).
   */
  resolve(record, { sourceLabel, flags }) {
    const location = cleanStr(record.location);
    const continent = cleanStr(record.continent);
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
      const key = `site::${country.toLowerCase()}::${location.toLowerCase()}`;
      const id = this._upsert({
        key,
        id: `${country}-${location}`,
        name: location,
        type: "site",
        country,
        continent,
        lat,
        lng,
        precision: "exact",
        sourceLabel,
      });
      return [id];
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
    // "country" location per country. Each source row's own lat/lng is
    // used for every country it lists; when a project's rows were split
    // one-per-country upstream (the GIMAC pattern) this is exactly right
    // because each row already carried that country's own coordinate.
    if (realCountries.length >= 1) {
      return realCountries.map((country) => {
        const key = `country::${country.toLowerCase()}`;
        return this._upsert({
          key,
          id: country,
          name: country,
          type: "country",
          country,
          continent,
          lat,
          lng,
          precision: "capital",
          sourceLabel,
        });
      });
    }

    // Case: no usable country, but a continent/region label survives.
    if (continent) {
      const key = `region::${continent.toLowerCase()}`;
      const id = this._upsert({
        key,
        id: continent,
        name: continent,
        type: "region",
        country: null,
        continent,
        lat,
        lng,
        precision: "region-centroid",
        sourceLabel,
      });
      return [id];
    }

    // Last resort: nothing to go on at all.
    flags.push({
      type: "no_usable_location",
      message: "no location/country/continent on this record",
      fromRecord: sourceLabel,
    });
    const id = this._upsert({
      key: "global::default",
      id: "global",
      name: "Global",
      type: "global",
      country: null,
      continent: null,
      lat: Number.isFinite(lat) ? lat : 0,
      lng: Number.isFinite(lng) ? lng : 0,
      precision: "global-centroid",
      sourceLabel,
    });
    return [id];
  }

  toArray() {
    return [...this.byKey.values()].sort((a, b) => a.id.localeCompare(b.id));
  }
}
