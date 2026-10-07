import { ref, computed, type Ref } from "vue";
import type { AxiosInstance } from "axios";
import type {
  DirectusItem,
  GroupBucket,
  PriceTableProps,
  OccupancyConfig,
  GroupConfig,
  LegSnapshot,
  LookupCollections,
} from "../types";

/*
 * Whether a collection has a given "occupancy value" column — `fieldName`
 * defaults to the literal `"value"` (hotels/tours/cruises/excursions'
 * occupancy collections all have one), but is configurable via
 * `occupancyValueField` for a collection that stores it under a different
 * name instead, e.g. `vehicles_rental_periods.rental_period_min` (it has no
 * bare `value` column at all — see `resolveValueField` below). Determined up
 * front via schema introspection (`/fields/{collection}`) rather than by
 * guessing from field-name conventions or letting a real data-fetch fail and
 * learning from that — so the occupancy fetch never has to send a request it
 * already expects to fail.
 *
 * Cached per (collection, fieldName) pair (`Promise<boolean>` so concurrent
 * callers share one in-flight request instead of each firing their own), for
 * `SCHEMA_CACHE_TTL_MS` — long enough to dedupe the request storm from a grid
 * of many cells mounting at once, short enough that an admin editing this
 * collection's schema (e.g. renaming/removing the `value` field) is reflected
 * within a few minutes rather than staying stale for the rest of the browser
 * tab's lifetime. If the introspection call itself fails — most likely a role
 * that can read item data but not `/fields` schema metadata — this resolves
 * to `false` rather than throwing, so the caller just omits the optional
 * field; that's a strictly safer trade than either assuming it exists
 * (risking the exact failing request this exists to avoid) or leaving the
 * fetch to fail and discover it that way.
 */
const SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000;
const valueFieldChecks = new Map<string, { promise: Promise<boolean>; at: number }>();

export function hasValueField(
  api: AxiosInstance,
  collection: string | undefined,
  fieldName: string = "value",
): Promise<boolean> {
  if (!collection) return Promise.resolve(false);
  const cacheKey = `${collection}::${fieldName}`;
  const cached = valueFieldChecks.get(cacheKey);
  if (cached && Date.now() - cached.at < SCHEMA_CACHE_TTL_MS) return cached.promise;
  const promise = api
    .get(`/fields/${collection}`)
    .then((res) => {
      const fields: { field: string }[] = res.data?.data || [];
      return fields.some((f) => f.field === fieldName);
    })
    .catch(() => false);
  valueFieldChecks.set(cacheKey, { promise, at: Date.now() });
  return promise;
}

/*
 * The field name that carries an occupancy's numeric "value" (guest count
 * for hotels/tours/cruises/excursions, rental-period min-days for vehicles)
 * — `occupancyValueField` if the field instance configures one (every
 * existing field instance already sets this to `"value"`, matching today's
 * hardcoded behavior exactly), else the literal `"value"` default.
 */
export function resolveValueField(cfg: { occupancyValueField?: string }): string {
  return cfg.occupancyValueField || "value";
}

/*
 * Resolves what collection a relational field actually points at, via its
 * own schema metadata (`/fields/{collection}/{field}` →
 * `schema.foreign_key_table`) — used so `hasValueField` can be checked
 * against the REAL related collection (e.g. `cruise_occupancies`, the
 * target of `cruises_occupancies.occupancy`) instead of guessing. Resolves
 * to `null` (rather than throwing) if the field isn't a relation or the
 * lookup fails, so callers can treat "unknown" the same safe way
 * `hasValueField` treats an inaccessible schema. Cached per `collection.field`
 * pair for `SCHEMA_CACHE_TTL_MS` — see `hasValueField` above for why this
 * isn't cached indefinitely.
 */
const relatedCollectionChecks = new Map<string, { promise: Promise<string | null>; at: number }>();

export function resolveRelatedCollection(
  api: AxiosInstance,
  collection: string | undefined,
  field: string | undefined,
): Promise<string | null> {
  if (!collection || !field) return Promise.resolve(null);
  const key = `${collection}.${field}`;
  const cached = relatedCollectionChecks.get(key);
  if (cached && Date.now() - cached.at < SCHEMA_CACHE_TTL_MS) return cached.promise;
  const promise = api
    .get(`/fields/${collection}/${field}`)
    .then((res) => res.data?.data?.schema?.foreign_key_table ?? null)
    .catch(() => null);
  relatedCollectionChecks.set(key, { promise, at: Date.now() });
  return promise;
}

/*
 * Core engine behind the price table interface — pure helpers plus the
 * grid-shaping computeds. Supports both "junction" mode (per-language/market
 * pricing — hotels, cruises) and "direct" mode (a single flat price row with
 * no language concept — vehicles).
 *
 * This file centralizes the multidimensional grid logic (rows, columns,
 * groups, lookups) and the small pure utilities (value normalization, config
 * validation, occupancy normalization) so fixes and features only need to be
 * implemented once, regardless of which mode a field is configured to use.
 *
 * It is consumed by both the component (`interface.vue`, for the grid
 * computeds and label helpers) and the `usePriceTableData` composable (for
 * the pure utilities). Mode-specific data behavior — resolving language
 * contexts, writing to the translations table vs. directly to the price row —
 * lives in `usePriceTableData`, not here.
 */

// ── Pure utilities ───────────────────────────────────────────────────────

// Reads a possibly dotted path (`"a.b.c"`) out of a nested object, returning
// `undefined` at the first missing segment instead of throwing. Used to
// resolve configurable relation paths (e.g. `occupancyIdField`).
export function getNestedValue(obj: DirectusItem | null | undefined, path?: string): any {
  if (!obj || !path) return undefined;
  return path
    .split(".")
    .reduce((acc: any, key: string) => (acc == null ? acc : acc[key]), obj as any);
}

// Normalizes any value into a stable Map key: `null`/`undefined` collapse to
// the empty string, everything else to its String form. Keeps relational IDs
// (numbers, UUIDs, strings) comparable regardless of how Directus returns them.
export function lookupKey(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

/*
 * Ranks price rows that claim the same (group, row, column) combination so
 * the most complete one wins instead of whichever happened to load last.
 * Preference order: has a non-zero buy price > has a non-null sell price >
 * more recently updated > lower id (stable tiebreak).
 *
 * Without this, two database rows for the same category/date/occupancy —
 * a real, recurring data conflict from non-idempotent upstream writes, not
 * a hypothetical one — collapse to a single grid cell, and whichever row
 * lost just has its buy or sell price silently vanish from the table even
 * though it's still in the database.
 */
export function pickBestPriceRow(
  candidates: DirectusItem[],
  buyPriceField: string,
  sellPriceField: string,
  onConflict?: (winnerId: string | number, ignoredIds: (string | number)[]) => void,
): DirectusItem {
  if (candidates.length <= 1) return candidates[0];
  const sorted = [...candidates].sort((a, b) => {
    const hasBuyA = a[buyPriceField] != null && Number(a[buyPriceField]) !== 0;
    const hasBuyB = b[buyPriceField] != null && Number(b[buyPriceField]) !== 0;
    if (hasBuyA !== hasBuyB) return hasBuyA ? -1 : 1;

    const hasSellA = a[sellPriceField] != null;
    const hasSellB = b[sellPriceField] != null;
    if (hasSellA !== hasSellB) return hasSellA ? -1 : 1;

    const updatedA = a.date_updated ?? "";
    const updatedB = b.date_updated ?? "";
    if (updatedA !== updatedB) return updatedA < updatedB ? 1 : -1;

    return String(a.id).localeCompare(String(b.id));
  });
  const ignoredIds = sorted.slice(1).map((c) => c.id);
  // eslint-disable-next-line no-console
  console.warn(
    "[PriceTable] multiple price rows for the same category/date/occupancy — " +
      `picked ${sorted[0].id}, ignored [${ignoredIds.join(", ")}]. ` +
      "This is a data conflict, not a resolved one — needs manual review.",
  );
  onConflict?.(sorted[0].id, ignoredIds);
  return sorted[0];
}

/*
 * Whether a buy price counts as "not provided" for the sole purpose of
 * deciding if a brand-new database record should be created for a
 * generated combination. `0`, `null`, `undefined`, and an empty string are
 * all treated as "no buy price yet" here.
 *
 * Scope of this rule is deliberately narrow: it governs ONLY the decision
 * to create a first-time record for a combination that has none yet. It
 * must never be consulted when deciding whether an already-existing
 * record's value is acceptable — once a record exists, `0` and `null` are
 * ordinary, valid values and saving them must update the record, never
 * delete or reject it.
 */
// Identifies a request we cancelled ourselves (via AbortController, when a
// newer fetch superseded an older in-flight one) so callers can swallow it
// silently instead of surfacing a spurious error message — the newer
// request's own response is what the user actually needs to see.
export function isAbortError(err: unknown): boolean {
  const e = err as { name?: string; code?: string } | null | undefined;
  return e?.name === "AbortError" || e?.name === "CanceledError" || e?.code === "ERR_CANCELED";
}

export function isBuyPriceEmpty(value: unknown): boolean {
  return (
    value === null || value === undefined || value === "" || Number(value) === 0
  );
}

// Prices are always displayed and saved to 2 decimal places — Directus
// returns `decimal` fields as full-precision strings (e.g. tours'
// buy_price is decimal(10,5)), which round-trips as "56919.00000" instead
// of "56919.00" unless rounded here. Applied both on read (for display)
// and before every write (buy/sell price save + calculated sell price),
// so the database itself never stores more than 2 decimal places either.
export const PRICE_PRECISION = 2;

export function roundToPricePrecision(value: unknown): any {
  if (value === null || value === undefined || value === "") return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  const factor = 10 ** PRICE_PRECISION;
  return Math.round(num * factor) / factor;
}

/*
 * Returns the human-readable admin option names (matching this interface's
 * own settings panel, see `index.ts`) that are unset among the given list.
 * Used to fail loudly and specifically before ever attempting an API call
 * — a misconfigured field otherwise surfaces only as a generic "Failed to
 * save changes", which requires reading the browser console to diagnose.
 * A field-name option is only ever a non-empty string in practice, but this
 * checks for null/undefined/"" specifically (not bare falsiness) so a
 * legitimately falsy value — `0` or `false`, should either ever be added to
 * this required-fields list — isn't misreported as "not configured".
 */
export function describeMissingConfig(
  fields: { value: unknown; label: string }[],
): string[] {
  return fields
    .filter((f) => f.value === null || f.value === undefined || f.value === "")
    .map((f) => f.label);
}

export function missingConfigMessage(missing: string[]): string {
  return `This price table isn't fully configured yet — missing: ${missing.join(", ")}. Set these in this field's interface options.`;
}

// ── Occupancy normalization ──────────────────────────────────────────────


/*
 * Composes a "min-max [category]" fallback label (e.g. "7-13 Airport", "21+")
 * for an occupancy row whose primary label field (`occupancyLabelField`) is
 * empty — used when the source data itself doesn't always populate that
 * field for every row (verified live for vehicles_rental_periods: Primarix's
 * own free-text "Mietdauer" field, field_898_1, is blank for many rental
 * periods even though min/max/depot-category are always present — Primarix's
 * own admin UI evidently computes a label from those instead of relying on
 * the sparse text field).
 *
 * Entirely opt-in via the three `occupancyLabelFallback*Field` config
 * options — when `occupancyLabelFallbackMinField` isn't set (every existing
 * hotels/tours/cruises/excursions field instance), this returns `null`
 * immediately and `normalizeOccupancyFromJunction` falls through to the
 * original `String(resolvedId)` behavior, unchanged.
 *
 * `999` (and above) is treated as an open-ended "no max" sentinel — matches
 * the "21+" convention already used by real `rental_period_duration` values
 * in the same collection (rental_period_min=21, rental_period_max=999).
 */
function buildFallbackRangeLabel(
  junctionRow: DirectusItem,
  relatedRecord: DirectusItem,
  cfg: OccupancyConfig,
): string | null {
  const minField = cfg.occupancyLabelFallbackMinField;
  if (!minField) return null;

  const min = getNestedValue(relatedRecord, minField) ?? getNestedValue(junctionRow, minField);
  if (min === null || min === undefined || min === "") return null;

  const maxField = cfg.occupancyLabelFallbackMaxField;
  const max = maxField
    ? (getNestedValue(relatedRecord, maxField) ?? getNestedValue(junctionRow, maxField))
    : null;

  let range: string;
  if (max === null || max === undefined || max === "" || String(max) === String(min)) {
    range = String(min);
  } else if (Number(max) >= 999) {
    range = `${min}+`;
  } else {
    range = `${min}-${max}`;
  }

  const categoryField = cfg.occupancyLabelFallbackCategoryField;
  const category = categoryField
    ? (getNestedValue(relatedRecord, categoryField) ?? getNestedValue(junctionRow, categoryField))
    : null;

  return category ? `${range} ${category}` : range;
}

/*
 * Normalizes one occupancy junction row (or parent-field-array row — both
 * share this same shape) into the flat `{ id, [label]: ..., value, from_price }`
 * object the table's column logic expects.
 *
 * `occupancyIdField` is the single config value that decides whether a
 * hotel-shaped or a tours-shaped occupancy foreign key gets resolved
 * correctly — e.g. "id" when the price record's own FK references the
 * junction row itself (hotels), or "tours_occupancies_id.id" when it
 * references the original occupancy record instead (tours). Resolved via
 * `getNestedValue`, so any relation shape works from config alone.
 */
export function normalizeOccupancyFromJunction(
  junctionRow: DirectusItem,
  cfg: OccupancyConfig,
) {
  const relatedField = cfg.occupancyJunctionRelatedField as string;
  const related = junctionRow?.[relatedField];
  const relatedRecord = related && typeof related === "object" ? related : {};
  const resolvedId = getNestedValue(junctionRow, cfg.occupancyIdField);

  const primaryLabel =
    getNestedValue(relatedRecord, cfg.occupancyLabelField) ??
    getNestedValue(junctionRow, cfg.occupancyLabelField);
  const hasPrimaryLabel =
    typeof primaryLabel === "string" ? primaryLabel.trim().length > 0 : primaryLabel != null;

  const resolvedLabel = hasPrimaryLabel
    ? primaryLabel
    : (buildFallbackRangeLabel(junctionRow, relatedRecord, cfg) ?? String(resolvedId ?? ""));

  const valueField = resolveValueField(cfg);
  const sortField = cfg.occupancySortField;

  return {
    ...relatedRecord,
    id: resolvedId,
    [cfg.occupancyLabelField as string]: resolvedLabel,
    value:
      getNestedValue(relatedRecord, valueField) ??
      getNestedValue(junctionRow, valueField) ??
      null,
    from_price: cfg.occupancyFromPriceField
      ? (relatedRecord[cfg.occupancyFromPriceField] ??
        junctionRow?.[cfg.occupancyFromPriceField] ??
        false)
      : false,
    /*
     * Manual sort order (e.g. "sort") is typically a per-parent value that
     * lives on the junction row itself — Directus writes an M2M's
     * drag-reorder position there (see `directus_relations.sort_field`),
     * scoped to this one parent/occupancy pairing. An inherent property of
     * the occupancy type (e.g. "value", guest count) instead lives on the
     * related master record and is shared across every parent. Junction row
     * wins when both are present so a real per-parent manual order is never
     * shadowed by the `...relatedRecord` spread above silently overwriting
     * it with the (usually empty) same-named field from the master record.
     */
    ...(sortField
      ? {
          [sortField]:
            getNestedValue(junctionRow, sortField) ??
            getNestedValue(relatedRecord, sortField) ??
            null,
        }
      : {}),
  };
}

// ── Category/group field list ────────────────────────────────────────────


// Builds the field list for a Group By Collection request, keeping the
// configurable label/translation/sort fields in sync without duplicating
// knowledge of "which fields mean what" in two places.
export function buildGroupFields(cfg: GroupConfig, extra: string[] = []): string[] {
  const groupLabelField = cfg.groupLabelField as string;
  const groupLabelRoot = groupLabelField.split(".")[0];
  const groupTranslationField = cfg.groupLabelTranslationField;

  const fields = [
    "id",
    groupLabelField,
    "translations.translations_id",
    ...(groupTranslationField ? [`translations.${groupTranslationField}`] : []),
    ...(cfg.groupSharedIdField ? [cfg.groupSharedIdField] : []),
    ...extra,
  ];
  const known = new Set([...fields, groupLabelRoot]);

  if (cfg.groupFromPriceField && !known.has(cfg.groupFromPriceField)) {
    fields.push(cfg.groupFromPriceField);
    known.add(cfg.groupFromPriceField);
  }
  if (cfg.groupSortField && !known.has(cfg.groupSortField)) {
    fields.push(cfg.groupSortField);
  }
  return fields;
}

// Returns a category's display label — the group-by row's own label field
// if set, else the language-matched (or, with `currentLangId` omitted, the
// first) translation row's label, else the raw key. Appends the
// weekday-repeater's own label when the category turns out to be a
// per-weekday child (see `groupSharedIdField`/`groupChildWeekdaysField`).
export function getGroupLabel(
  key: string,
  categories: Map<string, DirectusItem>,
  cfg: GroupConfig & { groupChildWeekdaysField?: string },
  currentLangId?: string | number | null,
): string {
  if (key === "ungrouped") return "Ungrouped";
  const cat = categories.get(key);

  const resolvedLabel = getNestedValue(cat, cfg.groupLabelField);
  const translationsArr = cat?.translations || [];
  const matchedTranslation =
    currentLangId !== undefined
      ? translationsArr.find((t: DirectusItem) => t.translations_id === currentLangId)
      : translationsArr[0];

  let name: string =
    (typeof resolvedLabel === "string" && resolvedLabel) ||
    matchedTranslation?.[cfg.groupLabelTranslationField as string] ||
    key;

  // Append days_label from parent's weekday repeater when this is a child category
  const sharedId = cfg.groupSharedIdField ? cat?.[cfg.groupSharedIdField] : null;
  if (sharedId && sharedId !== key) {
    const parent = categories.get(sharedId);
    const repeaterEntry = (
      (cfg.groupChildWeekdaysField && parent?.[cfg.groupChildWeekdaysField]) ||
      []
    ).find((entry: DirectusItem) => entry.child_id === key);
    if (repeaterEntry?.days_label) name = `${name} (${repeaterEntry.days_label})`;
  }

  return name;
}

export function getGroupFromPrice(
  key: string,
  categories: Map<string, DirectusItem>,
  groupFromPriceField?: string,
): boolean {
  if (!groupFromPriceField) return false;
  return !!categories.get(key)?.[groupFromPriceField];
}

// ── Cascade delete when a leg (category/date/occupancy) is removed ──────


// Snapshots the IDs currently known in every lookup map. `reconcileRemovedLegs`
// compares this "before" state against the freshly re-fetched one to detect
// which legs were deleted elsewhere on the record.
export function captureKnownLegIds(lookupData: {
  categories: Map<string, DirectusItem>;
  dates: Map<string, DirectusItem>;
  occupancies: Map<string, DirectusItem>;
}): LegSnapshot {
  return {
    categories: new Set(lookupData.categories.keys()),
    dates: new Set(lookupData.dates.keys()),
    occupancies: new Set(lookupData.occupancies.keys()),
  };
}

// IDs present in `before` but gone in `after` — i.e. the legs that were removed.
function setDifference(before: Set<string>, after: Set<string>): string[] {
  return Array.from(before).filter((id) => !after.has(id));
}

/*
 * Deletes the database records left behind when a category, price-date, or
 * occupancy that a price row references is removed elsewhere on the same
 * hotel/tour record (a sibling repeater field this component does not
 * itself render). The schema has no cascading foreign key for this on
 * purpose, so the extension is responsible for the cleanup itself —
 * generically, using whichever field names this instance is configured
 * with, so the same logic works unmodified for hotels, tours, or any
 * future collection wired up the same way.
 */
export async function reconcileRemovedLegs(
  before: LegSnapshot,
  lookupData: { categories: Map<string, DirectusItem>; dates: Map<string, DirectusItem>; occupancies: Map<string, DirectusItem> },
  items: Ref<DirectusItem[]>,
  unpersistedCells: Ref<Map<string, DirectusItem>>,
  cfg: {
    groupByField?: string;
    rowField?: string;
    columnField?: string;
    relatedCollection?: string;
    translationsCollection?: string;
    translationsFKField?: string;
  },
  api: AxiosInstance,
  logPrefix: string,
  errorMessage?: Ref<string>,
): Promise<void> {
  const after = captureKnownLegIds(lookupData);
  const removedCategoryIds = setDifference(before.categories, after.categories);
  const removedDateIds = setDifference(before.dates, after.dates);
  const removedOccupancyIds = setDifference(before.occupancies, after.occupancies);

  if (!removedCategoryIds.length && !removedDateIds.length && !removedOccupancyIds.length) {
    return;
  }

  const isOrphaned = (item: DirectusItem) =>
    removedCategoryIds.includes(String(item[cfg.groupByField as string])) ||
    removedDateIds.includes(String(item[cfg.rowField as string])) ||
    removedOccupancyIds.includes(String(item[cfg.columnField as string]));

  // Drop any not-yet-persisted edit for a combination whose category, date,
  // or occupancy no longer exists — there is nothing in the database to
  // clean up for these, since they were never created.
  Array.from(unpersistedCells.value.entries()).forEach(([key, cell]) => {
    if (isOrphaned(cell)) unpersistedCells.value.delete(key);
  });

  // `items.value` still reflects the pre-deletion database state at this
  // point (this runs before the trailing `fetchItems` refresh), so it's
  // the authoritative source of which persisted rows now dangle.
  const orphanedRows = items.value.filter(isOrphaned);
  if (!orphanedRows.length) return;

  const priceIds = orphanedRows.map((row) => row.id).filter(Boolean);
  if (!priceIds.length) return;

  try {
    // Translations reference the price row, so they must be removed first
    // — deleting the price row while a translation still points to it
    // would otherwise leave that translation orphaned instead.
    //
    // Looked up fresh by FK here (rather than the `_translation_id` each
    // row already carries) because that field only reflects the single
    // language currently displayed — a price row can have a translation
    // per language, and every one of them needs to go, not just the
    // visible one. Config-driven, same as everything else in this
    // function, so it's a no-op for a direct-mode instance that has no
    // translations collection at all.
    if (cfg.translationsCollection && cfg.translationsFKField) {
      const { data } = await api.get(`/items/${cfg.translationsCollection}`, {
        params: {
          filter: { [cfg.translationsFKField]: { _in: priceIds } },
          fields: ["id"],
          limit: -1,
        },
      });
      const translationIds = (data?.data || []).map((t: DirectusItem) => t.id);
      if (translationIds.length) {
        await api.delete(`/items/${cfg.translationsCollection}`, { data: translationIds });
      }
    }
    await api.delete(`/items/${cfg.relatedCollection}`, { data: priceIds });
  } catch (err) {
    console.error(`${logPrefix} Error cascading deletion to price rows:`, err);
    if (errorMessage) {
      errorMessage.value =
        "Failed to clean up price rows for a removed category, price date, or occupancy — some orphaned rows may remain.";
    }
  }
}

// ── Occupancy/category/date lookup fetching ──────────────────────────────


// Creates the reactive lookup container the whole grid is built from. The
// three maps are replaced wholesale by the fetchers (never mutated in place),
// so Vue's reactivity reliably re-derives rows/columns/groups.
export function createLookupData(): Ref<LookupCollections> {
  return ref({
    categories: new Map(),
    dates: new Map(),
    occupancies: new Map(),
  });
}

// Inserts one normalized occupancy into a lookup map under its (stringified)
// ID, skipping empty keys so `undefined`/`null` ids can't poison the grid.
export function addOccupancyLookup(map: Map<string, DirectusItem>, key: unknown, occupancy: DirectusItem) {
  const normalizedKey = lookupKey(key);
  if (!normalizedKey) return;
  map.set(normalizedKey, occupancy);
}

// ── Grid computeds ────────────────────────────────────────────────────────
//
// `props` is passed through as-is (rather than destructured) so these stay
// reactive to the same Vue prop proxy the calling component already has —
// destructuring would snapshot values once instead of tracking changes.

export function useColumns(props: PriceTableProps, lookupData: Ref<LookupCollections>) {
  return computed(() => {
    const sf = props.occupancySortField as string;
    return Array.from(lookupData.value.occupancies.entries())
      .map(([id, occ]) => (occ ? { ...occ, id } : null))
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const aVal = a[sf] ?? 0;
        const bVal = b[sf] ?? 0;
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) return aNum - bNum;
        const cmp = String(aVal).localeCompare(String(bVal));
        if (cmp !== 0) return cmp;
        return a.from_price ? -1 : 1;
      });
  });
}

// Whether the table has everything it needs to display the complete set of
// generated combinations, independent of whether any of them have a
// database record yet.
export function useHasMinimumConfig(
  lookupData: Ref<LookupCollections>,
  columns: Ref<DirectusItem[]>,
) {
  return computed(
    () =>
      lookupData.value.categories.size > 0 &&
      lookupData.value.dates.size > 0 &&
      columns.value.length > 0,
  );
}

// Sourced from every known price-date (`lookupData`), not from
// `items.value` — a price-date with no database rows yet must still render
// as a full, editable row.
export function useRows(props: PriceTableProps, lookupData: Ref<LookupCollections>) {
  return computed(() => {
    const sf = props.rowSortField as string;
    return Array.from(lookupData.value.dates.values())
      .filter(Boolean)
      .sort((a: DirectusItem, b: DirectusItem) => {
        const aVal = a[sf];
        const bVal = b[sf];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        if (!isNaN(aDate) && !isNaN(bDate)) return aDate - bDate;
        return String(aVal).localeCompare(String(bVal));
      });
  });
}

export function useGroupedData(
  props: PriceTableProps,
  lookupData: Ref<LookupCollections>,
  items: Ref<DirectusItem[]>,
  rows: Ref<DirectusItem[]>,
) {
  return computed(() => {
    if (!props.groupByField) {
      return { all: { items: items.value, rows: rows.value } };
    }

    const groups: Record<string, GroupBucket> = {};

    // Pre-seed one group per known category so a category with no price
    // rows yet still renders its full, empty, editable grid.
    lookupData.value.categories.forEach((_cat, key) => {
      groups[key] = { items: [], rows: rows.value };
    });

    items.value.forEach((item) => {
      const key = item[props.groupByField as string];
      if (!key) return;
      if (!groups[key]) groups[key] = { items: [], rows: rows.value };
      groups[key].items.push(item);
    });

    return groups;
  });
}

/*
 * Ensures `unpersistedCells` contains an entry for EVERY visible combination
 * (group × row × column) that has no database record yet — not just the cells
 * the user has actively typed into. The materialization gate in
 * `persistChanges` keys off these entries, so a brand-new grid where only one
 * cell has a typed buy price must still know about all the other (untouched,
 * empty) combinations, otherwise their rows never get created on the first
 * Save & Calculate. Existing drafts (in-progress user edits) are preserved,
 * and combinations that already have a persisted row are left alone — the
 * persisted item always shadows any draft via `cellMap`.
 */
export function seedUnpersistedCells(
  orderedGroups: Record<string, GroupBucket>,
  columns: DirectusItem[],
  items: Ref<DirectusItem[]>,
  unpersistedCells: Ref<Map<string, DirectusItem>>,
  cfg: {
    groupByField?: string;
    rowField?: string;
    columnField?: string;
    buyPriceField?: string;
    sellPriceField?: string;
  },
): void {
  const itemKeys = new Set(
    items.value.map(
      (it) =>
        `${it[cfg.groupByField as string]}|${it[cfg.rowField as string]}|${it[cfg.columnField as string]}`,
    ),
  );

  Object.entries(orderedGroups).forEach(([groupKey, group]: [string, GroupBucket]) => {
    (group.rows || []).forEach((row: DirectusItem) => {
      columns.forEach((col) => {
        const key = `${groupKey}|${row.id}|${col.id}`;
        if (itemKeys.has(key)) return;
        if (unpersistedCells.value.has(key)) return;
        unpersistedCells.value.set(key, {
          [cfg.groupByField as string]: groupKey,
          [(cfg.rowField as string) as string]: row.id,
          [cfg.columnField as string]: col.id,
          [cfg.buyPriceField as string]: null,
          [cfg.sellPriceField as string]: null,
          _translation_id: null,
        });
      });
    });
  });
}

// Orders the groups for display. Priority: an explicit `groupSortField` on the
// category record wins; otherwise the parent's manually-ordered category list
// (`roomCategoryOrder`, populated from `categoryOrderField`) is honored, with
// any group not in that list appended in natural order. No ordering info at
// all falls back to insertion order.
export function useOrderedGroupedData(
  props: PriceTableProps,
  lookupData: Ref<LookupCollections>,
  groupedData: Ref<Record<string, GroupBucket>>,
  roomCategoryOrder: Ref<string[]>,
) {
  return computed(() => {
    const groups = groupedData.value;

    if (props.groupSortField) {
      const sf = props.groupSortField;
      const ordered: Record<string, GroupBucket> = {};
      Object.keys(groups)
        .sort((a, b) => {
          const aVal = lookupData.value.categories.get(a)?.[sf] ?? 0;
          const bVal = lookupData.value.categories.get(b)?.[sf] ?? 0;
          const aNum = Number(aVal);
          const bNum = Number(bVal);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          return String(aVal).localeCompare(String(bVal));
        })
        .forEach((key) => {
          ordered[key] = groups[key];
        });
      return ordered;
    }

    if (!props.groupByField || roomCategoryOrder.value.length === 0) {
      return groups;
    }

    const ordered: Record<string, GroupBucket> = {};
    roomCategoryOrder.value.forEach((id) => {
      if (groups[id]) ordered[id] = groups[id];
    });
    Object.keys(groups).forEach((key) => {
      if (!ordered[key]) ordered[key] = groups[key];
    });
    return ordered;
  });
}
