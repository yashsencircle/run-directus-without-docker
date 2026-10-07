import {
  getNestedValue,
  lookupKey,
  isBuyPriceEmpty,
  isAbortError,
  roundToPricePrecision,
  describeMissingConfig,
  missingConfigMessage,
  normalizeOccupancyFromJunction,
  buildGroupFields,
  captureKnownLegIds,
  reconcileRemovedLegs,
  addOccupancyLookup,
  hasValueField,
  resolveRelatedCollection,
  resolveValueField,
} from "./priceTableCore";
import type {
  DirectusItem,
  AvailableTranslation,
  PriceTableDataOptions,
} from "../types";

export function usePriceTableData(options: PriceTableDataOptions) {
  const { props, api, logPrefix, isJunction } = options;
  const {
    parent_id,
    translations_id,
    items,
    originalItems,
    hasChanges,
    unpersistedCells,
    lookupData,
    parentRecord,
    buyCurrencySymbol,
    sellCurrencySymbol,
    roomCategoryOrder,
    sellPricesStatus,
    sellPricesUpdatedAt,
    availableTranslations,
    selectedTranslationId,
    errorMessage,
    loading,
    saving,
    calculatingSellPrices,
  } = options;

  /*
   * Compiles the admin-authored `roundHalfLogic`/`calculateSellPriceLogic`
   * formula text (stored on this field's own saved options) into a
   * callable function. Junction mode only.
   */
  const compileCalculator = (roundHalfCode: string, calcCode: string) => {
    try {
      // eslint-disable-next-line no-new-func
      const factory = new Function(
        `${roundHalfCode}\n${calcCode}\nreturn { roundHalf, calculateSellPrice };`,
      );
      const { roundHalf, calculateSellPrice } = factory();
      if (
        typeof roundHalf !== "function" ||
        typeof calculateSellPrice !== "function"
      ) {
        return {
          error:
            "Formula must define exactly named functions roundHalf(val) and calculateSellPrice(buyPrice, settingsRow, priceRow, rateValue, occupancyValue).",
        };
      }
      return { calculateSellPrice };
    } catch (err: any) {
      return { error: `Failed to compile formula: ${err.message}` };
    }
  };

  // Fields required for a plain save (creating/updating price rows, plus
  // their sell-price translations in junction mode) — independent of the
  // calculate step.
  const saveRequiredFields = () =>
    describeMissingConfig([
      { value: props.relatedCollection, label: "Related Collection" },
      { value: props.foreignKeyField, label: "Foreign Key Field" },
      { value: props.buyPriceField, label: "Buy Price Field" },
      { value: props.sellPriceField, label: "Sell Price Field" },
      { value: props.groupByField, label: "Group By Field" },
      { value: (props.rowField as string), label: "Row Field" },
      { value: props.columnField, label: "Column Field" },
      ...(isJunction()
        ? [
            { value: props.translationsCollection, label: "Translations Collection" },
            { value: props.translationsFKField, label: "Translations → Price FK Field" },
            { value: props.translationsLanguageField, label: "Translations → Language Field" },
          ]
        : []),
    ]);

  // Additional fields required only for the sell-price calculation step
  // (junction mode only) — the formula, its inputs, and where the result
  // gets written.
  const calculateRequiredFields = () =>
    describeMissingConfig([
      { value: props.junctionCollection, label: "Junction Collection" },
      {
        value: props.parentKeyField || props.junctionParentKeyField,
        label: "Parent Key Field / Junction → Parent Key Field",
      },
      { value: props.junctionLanguageField, label: "Junction → Language Field" },
      { value: props.buyPriceTypeField, label: "Buy Price Type Field" },
      { value: props.sellPriceTypeField, label: "Sell Price Type Field" },
      { value: props.percentageTypeField, label: "Percentage Type Field" },
      { value: props.marginField, label: "Margin Percentage Field" },
      { value: props.provisionField, label: "Provision Percentage Field" },
      { value: props.junctionExchangeRateField, label: "Junction → Exchange Rate Field" },
      { value: props.ratesCollection, label: "Rates Collection" },
      { value: props.occupancyJunctionCollection, label: "Occupancy Junction Collection" },
      { value: props.occupancyJunctionParentField, label: "Occupancy Junction Parent Field" },
      // `occupancyJunctionRelatedField` is deliberately NOT required here —
      // it's optional (see `nestedOrOwn` in `fetchOccupanciesFromJunction`)
      // for junction rows that carry their own label/value directly with no
      // separate related master item to hop through (e.g.
      // `vehicles_rental_periods`), unlike hotels/tours/cruises/excursions.
      { value: props.occupancyValueField, label: "Occupancy Value Field" },
      { value: props.parentCollection, label: "Parent Collection" },
      { value: props.sellStatusField, label: "Sell Price Status Field" },
      { value: props.sellUpdatedAtField, label: "Sell Price Updated At Field" },
      { value: props.roundHalfLogic, label: "Round Half Logic" },
      { value: props.calculateSellPriceLogic, label: "Calculate Sell Price Logic" },
    ]);

  // Bound wrapper so call sites don't need to pass `props` on every call.
  const normalizeOccupancyFromJunctionBound = (junctionRow: DirectusItem) =>
    normalizeOccupancyFromJunction(junctionRow, props);

  /*
   * Resolves the buy/sell currency symbols for a given exchange-rate
   * record in a single request by fetching the rate's related currency
   * symbols as deep fields — previously this was the rate plus two
   * separate currency-record fetches. `fromCurrencyField`/`toCurrencyField`
   * resolve to relation objects (or bare IDs, in which case the
   * configured default symbols are kept).
   */
  const fetchCurrencySymbols = async (rateKey: string) => {
    try {
      const fc = props.fromCurrencyField as string;
      const tc = props.toCurrencyField as string;
      const sf = props.currencySymbolField as string;
      const { data } = await api.get(
        `/items/${props.ratesCollection}/${rateKey}`,
        { params: { fields: [`${fc}.${sf}`, `${tc}.${sf}`] } },
      );
      buyCurrencySymbol.value =
        data.data[fc]?.[sf] || props.defaultBuyCurrencySymbol;
      sellCurrencySymbol.value =
        data.data[tc]?.[sf] || props.defaultSellCurrencySymbol;
    } catch (err) {
      console.error(`${logPrefix} Error fetching currency symbols:`, err);
      errorMessage.value = "Failed to load currency symbols for the price table header.";
    }
  };

  const resolveParentId = () => {
    if (props.primaryKey && props.primaryKey !== "+") {
      parent_id.value = props.primaryKey as string;
      return;
    }
    // New record — try URL fallback
    const pathParts = window.location.pathname.split("/");
    const idx = pathParts.indexOf(props.parentCollection as string);
    if (idx !== -1 && pathParts[idx + 1] && pathParts[idx + 1] !== "+") {
      parent_id.value = pathParts[idx + 1];
    }
  };

  // Resolve parent ID and language ID from the current context. Junction
  // mode only — direct mode uses the simpler `resolveParentId` above.
  const fetchTranslationInfo = async () => {
    buyCurrencySymbol.value = props.defaultBuyCurrencySymbol as string;
    sellCurrencySymbol.value = props.defaultSellCurrencySymbol as string;

    // 1. Parent collection context (e.g. placed directly on hotels, cruises, yachts)
    if (props.collection === props.parentCollection) {
      if (!props.primaryKey || props.primaryKey === "+") {
        const pathParts = window.location.pathname.split("/");
        const parentIdx = pathParts.indexOf(props.parentCollection as string);
        if (
          parentIdx !== -1 &&
          pathParts[parentIdx + 1] &&
          pathParts[parentIdx + 1] !== "+"
        ) {
          parent_id.value = pathParts[parentIdx + 1];
        } else {
          return;
        }
      } else {
        parent_id.value = props.primaryKey as string;
      }

      try {
        const { data } = await api.get(`/items/${props.junctionCollection}`, {
          params: {
            filter: {
              [props.junctionParentKeyField as string]: { _eq: parent_id.value },
            },
            fields: [
              "id",
              `${props.junctionLanguageField}.id`,
              `${props.junctionLanguageField}.${props.languageNameField}`,
              props.junctionExchangeRateField,
            ],
          },
        });

        availableTranslations.value = data.data.map((t: DirectusItem) => ({
          text:
            getNestedValue(
              t[props.junctionLanguageField as string],
              props.languageNameField,
            ) ||
            t[props.junctionLanguageField as string]?.id ||
            "Unknown",
          value: t.id,
          exchange_rate: t[props.junctionExchangeRateField as string],
          lang_id: t[props.junctionLanguageField as string]?.id,
        }));

        if (availableTranslations.value.length > 0) {
          if (!selectedTranslationId.value) {
            selectedTranslationId.value =
              availableTranslations.value[0].value;
          }
          const current = availableTranslations.value.find(
            (t) => t.value === selectedTranslationId.value,
          );
          if (current) {
            translations_id.value = current.lang_id != null ? String(current.lang_id) : null;
            /*
             * Symbols only affect the table header — fetch them without
             * blocking the rest of the load (they land whenever ready).
             */
            if (current.exchange_rate?.key) {
              fetchCurrencySymbols(current.exchange_rate.key);
            }
          }
        }
      } catch (err) {
        console.error(`${logPrefix} Error fetching junction records:`, err);
        errorMessage.value = "Failed to load available languages for this price table.";
      }
      return;
    }

    // 2. Junction collection context (e.g. placed on hotels_translations_1, cruises_translations_1)
    if (props.collection === props.junctionCollection) {
      if (props.values?.[props.junctionParentKeyField as string]) {
        const hId =
          typeof props.values[props.junctionParentKeyField as string] === "object"
            ? props.values[props.junctionParentKeyField as string].id
            : props.values[props.junctionParentKeyField as string];
        const tId =
          typeof props.values[props.junctionLanguageField as string] === "object"
            ? props.values[props.junctionLanguageField as string].id
            : props.values[props.junctionLanguageField as string];

        if (hId) {
          parent_id.value = hId;
          translations_id.value = tId || null;

          if (props.values[props.junctionExchangeRateField as string]) {
            const rateKey =
              typeof props.values[props.junctionExchangeRateField as string] ===
              "object"
                ? props.values[props.junctionExchangeRateField as string].key
                : props.values[props.junctionExchangeRateField as string];
            if (rateKey) fetchCurrencySymbols(rateKey);
          }

          if (
            !translations_id.value &&
            props.primaryKey &&
            props.primaryKey !== "+"
          ) {
            // Language ID couldn't be derived from `values` alone (e.g. a
            // bare primary key with the language not yet populated) — fall
            // through to the API fetch below, which resolves it from the
            // saved junction record.
          } else {
            return;
          }
        }
      }

      // Fallback: read parent ID from URL
      if (!parent_id.value) {
        const pathParts = window.location.pathname.split("/");
        const parentIdx = pathParts.indexOf(props.parentCollection as string);
        if (
          parentIdx !== -1 &&
          pathParts[parentIdx + 1] &&
          pathParts[parentIdx + 1] !== "+"
        ) {
          parent_id.value = pathParts[parentIdx + 1];
        }
      }

      if (!props.primaryKey || props.primaryKey === "+") {
        return;
      }

      const parentField = props.parentKeyField || props.junctionParentKeyField;
      if (!parentField) {
        const msg =
          "Neither Parent Key Field nor Junction → Parent Key Field is configured — cannot resolve the parent record.";
        console.error(`${logPrefix} ${msg}`);
        errorMessage.value = msg;
        return;
      }

      try {
        const { data } = await api.get(
          `/items/${props.junctionCollection}/${props.primaryKey}`,
          {
            params: {
              fields: [
                parentField,
                props.junctionLanguageField,
                props.junctionExchangeRateField,
              ],
            },
          },
        );

        parent_id.value =
          typeof data.data[parentField] === "object"
            ? data.data[parentField].id
            : data.data[parentField];
        translations_id.value =
          typeof data.data[props.junctionLanguageField as string] === "object"
            ? data.data[props.junctionLanguageField as string].id
            : data.data[props.junctionLanguageField as string];

        if (data.data[props.junctionExchangeRateField as string]) {
          const rateKey =
            typeof data.data[props.junctionExchangeRateField as string] === "object"
              ? data.data[props.junctionExchangeRateField as string].key
              : data.data[props.junctionExchangeRateField as string];
          if (rateKey) fetchCurrencySymbols(rateKey);
        }
      } catch (err) {
        console.error(`${logPrefix} Error fetching junction record:`, err);
        errorMessage.value = "Failed to load the settings record for this price table.";
      }
    }
  };

  // Single entry point for resolving the parent (+ language, in junction
  // mode) — dispatches to the mode-appropriate implementation.
  const initParentContext = async () => {
    if (isJunction()) {
      await fetchTranslationInfo();
    } else {
      resolveParentId();
      buyCurrencySymbol.value = props.defaultBuyCurrencySymbol as string;
      sellCurrencySymbol.value = props.defaultSellCurrencySymbol as string;
    }
  };

  // ── Occupancy lookup (junction-collection mode) ─────────────────────────
  //
  // Fetches the occupancies linked to the parent through the M2M occupancy
  // junction collection, normalizing each row into the flat shape the column
  // logic expects, and fills the given map. When the junction's related-field
  // relation comes back as a bare ID, the original occupancy collection is
  // queried to hydrate it (same normalizer either way). Returns whether any
  // rows were found — used by the `auto` occupancy mode to decide if the
  // parent-field fallback is needed.
  const fetchOccupanciesFromJunction = async (map: Map<string, DirectusItem>) => {
    if (!parent_id.value || !props.occupancyJunctionCollection) return false;

    const primaryKeyField = props.occupancyJunctionPrimaryKeyField;
    const parentField =
      (props.occupancyJunctionParentField || props.foreignKeyField) as string;
    const relatedField = props.occupancyJunctionRelatedField as string;

    /*
     * The "occupancy value" field — `occupancyValueField` when the field
     * instance configures one (every existing field instance already sets
     * this to `"value"`, matching the previous hardcoded behavior exactly;
     * vehicles sets it to `rental_period_min` instead, since
     * `vehicles_rental_periods` has no bare `value` column at all), else the
     * literal `"value"` default. `${relatedField}.${valueField}` is only
     * ever consumed as a fallback by `normalizeOccupancyFromJunction`
     * (`relatedRecord[valueField] ?? junctionRow?.[valueField] ?? null`) —
     * the junction row's own value column is generally what's actually
     * used. Directus rejects the ENTIRE request if a related collection is
     * missing a requested nested field (e.g. a `cruise_occupancies`-shaped
     * label collection with no matching column), so both this collection's
     * own value field and — when `relatedField` is set — the related
     * collection's are resolved via schema introspection up front
     * (`hasValueField`, `resolveRelatedCollection`) rather than found out by
     * a failing request, so the fetch below only ever asks for fields it
     * already knows exist.
     *
     * `relatedField` itself is optional — some junction rows (e.g.
     * `vehicles_rental_periods`) carry their own label/value directly with
     * no further related record to hop through at all, unlike
     * hotels/tours/cruises/excursions where the junction row's related
     * field points at a separate master item. When unset, request plain
     * field names on the junction row itself instead of
     * `${relatedField}.field` — `normalizeOccupancyFromJunction` already
     * falls back to reading the junction row directly in that case.
     */
    const valueField = resolveValueField(props);
    const sortField = props.occupancySortField as string | undefined;
    const nestedOrOwn = (field: string) =>
      relatedField ? `${relatedField}.${field}` : field;
    const collection = props.occupancyJunctionCollection as string;
    const relatedCollection = relatedField
      ? await resolveRelatedCollection(api, collection, relatedField)
      : null;
    const [includeOwnValue, includeRelatedValue, includeOwnSort] = await Promise.all([
      hasValueField(api, collection, valueField),
      relatedCollection ? hasValueField(api, relatedCollection, valueField) : Promise.resolve(false),
      // A manual sort field (e.g. "sort") is typically per-parent and lives
      // on the junction row itself — see `normalizeOccupancyFromJunction`,
      // which prefers this over the nested related-record copy requested
      // below. Only requested when `relatedField` is set and the junction
      // collection actually has this field, since `nestedOrOwn` already
      // covers the no-relatedField case (the bare field IS the request).
      relatedField && sortField && sortField !== valueField
        ? hasValueField(api, collection, sortField)
        : Promise.resolve(false),
    ]);

    const fields = [
      primaryKeyField,
      ...(includeOwnValue ? [valueField] : []),
      ...(includeOwnSort ? [sortField as string] : []),
      parentField,
      ...(relatedField ? [relatedField, `${relatedField}.id`] : []),
      nestedOrOwn(props.occupancyLabelField as string),
      ...(includeRelatedValue ? [`${relatedField}.${valueField}`] : []),
      ...(props.occupancyFromPriceField
        ? [nestedOrOwn(props.occupancyFromPriceField as string)]
        : []),
      ...(sortField && sortField !== valueField
        ? [nestedOrOwn(sortField)]
        : []),
      ...(props.occupancyLabelFallbackMinField
        ? [nestedOrOwn(props.occupancyLabelFallbackMinField as string)]
        : []),
      ...(props.occupancyLabelFallbackMaxField
        ? [nestedOrOwn(props.occupancyLabelFallbackMaxField as string)]
        : []),
      ...(props.occupancyLabelFallbackCategoryField
        ? [nestedOrOwn(props.occupancyLabelFallbackCategoryField as string)]
        : []),
    ];

    const { data } = await api.get(`/items/${collection}`, {
      params: {
        fields,
        filter: { [parentField]: { _eq: parent_id.value } },
        limit: -1,
      },
    });

    const rows = data?.data || [];
    const originalIds = rows
      .map((row: DirectusItem) => row?.[relatedField])
      .filter((value: unknown) => value && typeof value !== "object");
    const originalLookup = new Map<string, DirectusItem>();

    if (originalIds.length > 0 && props.occupancyCollection) {
      const originalRes = await api.get(
        `/items/${props.occupancyCollection}`,
        {
          params: {
            fields: [
              "id",
              props.occupancyLabelField,
              valueField,
              ...(props.occupancyFromPriceField
                ? [props.occupancyFromPriceField as string]
                : []),
              ...(props.occupancySortField &&
              props.occupancySortField !== valueField
                ? [props.occupancySortField as string]
                : []),
              ...(props.occupancyLabelFallbackMinField
                ? [props.occupancyLabelFallbackMinField as string]
                : []),
              ...(props.occupancyLabelFallbackMaxField
                ? [props.occupancyLabelFallbackMaxField as string]
                : []),
              ...(props.occupancyLabelFallbackCategoryField
                ? [props.occupancyLabelFallbackCategoryField as string]
                : []),
            ],
            filter: { id: { _in: [...new Set(originalIds)] } },
            limit: -1,
          },
        },
      );
      (originalRes.data?.data || []).forEach((occupancy: DirectusItem) => {
        originalLookup.set(lookupKey(occupancy.id), occupancy);
      });
    }

    rows.forEach((row: DirectusItem) => {
      const related = row?.[relatedField];
      const hydratedRow =
        related &&
        typeof related !== "object" &&
        originalLookup.has(lookupKey(related))
          ? { ...row, [relatedField]: originalLookup.get(lookupKey(related)) }
          : row;
      const occupancy = normalizeOccupancyFromJunctionBound(hydratedRow);
      addOccupancyLookup(map, occupancy.id, occupancy);
    });

    return rows.length > 0;
  };

  // Fetches the parent record (occupancies + category order), and, in
  // junction mode, its sell-price status/timestamp too.
  const fetchParentRecord = async () => {
    if (!parent_id.value || parent_id.value === "+") return;
    try {
      /*
       * Requested this deeply (rather than a shallow `.*`) so it runs
       * through the exact same `normalizeOccupancyFromJunction` logic as
       * `fetchOccupanciesFromJunction` above — "Parent Field Array" mode
       * must resolve occupancies the same way "Junction Collection" mode
       * does, not as a shallower approximation of it.
       *
       * In `junction` mode the deep parent-field occupancy data is
       * redundant — the occupancy junction collection is the single
       * source there, fetched separately below — so the parent request
       * skips it to keep the payload lean.
       */
      const useParentOccupancies = props.occupancySourceMode !== "junction";
      // See `nestedOrOwn` in `fetchOccupanciesFromJunction` — same optional
      // related-field accommodation, applied to the parent-field-array path.
      const occupancyRelatedPrefix = props.occupancyJunctionRelatedField
        ? `${props.occupanciesField}.${props.occupancyJunctionRelatedField}`
        : (props.occupanciesField as string);
      const occupancyValueField = resolveValueField(props);
      const occupancySortFieldName = props.occupancySortField as string | undefined;
      const occupancyFields = [
        `${props.occupanciesField}.${props.occupancyJunctionPrimaryKeyField}`,
        `${occupancyRelatedPrefix}.id`,
        `${occupancyRelatedPrefix}.${props.occupancyLabelField}`,
        `${occupancyRelatedPrefix}.${occupancyValueField}`,
        ...(props.occupancyFromPriceField
          ? [`${occupancyRelatedPrefix}.${props.occupancyFromPriceField}`]
          : []),
        // A manual sort field (e.g. "sort") is typically per-parent and
        // lives on the junction row itself (`room_occupancies.sort`, not
        // `room_occupancies.occupancies_id.sort`) — see
        // `normalizeOccupancyFromJunction`, which prefers this bare copy
        // over the nested related-record one requested right after it.
        ...(occupancySortFieldName &&
        occupancySortFieldName !== occupancyValueField &&
        props.occupancyJunctionRelatedField
          ? [`${props.occupanciesField}.${occupancySortFieldName}`]
          : []),
        ...(occupancySortFieldName && occupancySortFieldName !== occupancyValueField
          ? [`${occupancyRelatedPrefix}.${occupancySortFieldName}`]
          : []),
        ...(props.occupancyLabelFallbackMinField
          ? [`${occupancyRelatedPrefix}.${props.occupancyLabelFallbackMinField}`]
          : []),
        ...(props.occupancyLabelFallbackMaxField
          ? [`${occupancyRelatedPrefix}.${props.occupancyLabelFallbackMaxField}`]
          : []),
        ...(props.occupancyLabelFallbackCategoryField
          ? [`${occupancyRelatedPrefix}.${props.occupancyLabelFallbackCategoryField}`]
          : []),
      ];

      const parentFields = [
        "*",
        ...(props.categoryOrderField ? [props.categoryOrderField as string] : []),
        ...(isJunction()
          ? [props.sellStatusField, props.sellUpdatedAtField]
          : []),
        ...(useParentOccupancies ? occupancyFields : []),
      ];

      // Build into a local map and only replace lookupData.value.occupancies
      // once fully populated — replacing it with an empty Map up front (with
      // an await before it's repopulated) briefly drops hasMinimumConfig to
      // false, making the whole table vanish and reappear.
      const newOccupancies = new Map<string, DirectusItem>();

      /*
       * `junction` occupancy mode: the parent record and the occupancy
       * junction collection are independent reads (the parent request
       * deliberately carries no occupancy fields here), so they fetch
       * concurrently. Any other mode starts from the parent-field array,
       * with the junction fetch kept purely as a fallback for configs
       * where that relation comes back shallow/bare-IDs — fetching it
       * unconditionally on top of the parent field was two round trips
       * for the same rows.
       */
      if (props.occupancySourceMode === "junction") {
        const [parentRes] = await Promise.all([
          api.get(`/items/${props.parentCollection}/${parent_id.value}`, {
            params: { fields: parentFields },
          }),
          fetchOccupanciesFromJunction(newOccupancies).catch((junctionErr) => {
            console.error(
              `${logPrefix} Error fetching occupancy junction collection:`,
              junctionErr,
            );
            errorMessage.value = "Failed to load occupancies — the table may be missing some columns.";
            return false;
          }),
        ]);
        parentRecord.value = parentRes.data.data;
      } else {
        const parentRes = await api.get(
          `/items/${props.parentCollection}/${parent_id.value}`,
          { params: { fields: parentFields } },
        );
        parentRecord.value = parentRes.data.data;
        if (
          useParentOccupancies &&
          Array.isArray(parentRecord.value![props.occupanciesField as string])
        ) {
          parentRecord.value![props.occupanciesField as string].forEach((row: DirectusItem) => {
            const occupancy = normalizeOccupancyFromJunctionBound(row);
            if (occupancy.id) addOccupancyLookup(newOccupancies, occupancy.id, occupancy);
          });
        }
        if (props.occupancySourceMode === "auto" && newOccupancies.size === 0) {
          try {
            await fetchOccupanciesFromJunction(newOccupancies);
          } catch (junctionErr) {
            console.error(
              `${logPrefix} Error fetching occupancy junction collection:`,
              junctionErr,
            );
            errorMessage.value = "Failed to load occupancies — the table may be missing some columns.";
          }
        }
      }

      if (isJunction()) {
        sellPricesStatus.value =
          parentRecord.value![props.sellStatusField as string] ?? null;
        sellPricesUpdatedAt.value =
          parentRecord.value![props.sellUpdatedAtField as string] ?? null;
      }
      if (Array.isArray(parentRecord.value![props.categoryOrderField as string])) {
        roomCategoryOrder.value = parentRecord.value![
          props.categoryOrderField as string
        ].map((cat: DirectusItem | string) => (typeof cat === "string" ? cat : cat.id || cat));
      }
      lookupData.value.occupancies = newOccupancies;
    } catch (err) {
      console.error(`${logPrefix} Error fetching parent record:`, err);
      errorMessage.value = "Failed to load the parent record for this price table.";
    }
  };

  /*
   * Filtering the row-date collection on `props.foreignKeyField` (rather
   * than a hardcoded field name) is what lets this same component serve
   * any collection wired up with the price-table interface. Always
   * filtered by the parent record, regardless of junction/direct mode —
   * `mode` only governs whether sell prices route through a separate
   * translations table, not whether the row collection is parent-scoped.
   * Every real row collection in use (junction or direct) carries the
   * parent foreign key, so skipping the filter would just leak every
   * other parent's rows into this one's table.
   */
  const fetchLookupData = async () => {
    if (!parent_id.value || parent_id.value === "+") return;
    try {
      const [baseCatRes, dateRes] = await Promise.all([
        api.get(`/items/${props.groupByCollection}`, {
          params: {
            filter: { [props.foreignKeyField as string]: { _eq: parent_id.value } },
            fields: buildGroupFields(
              props,
              props.groupChildWeekdaysField
                ? [props.groupChildWeekdaysField as string]
                : [],
            ),
            limit: -1,
          },
        }),
        api.get(`/items/${props.rowCollection}`, {
          params: {
            filter: { [props.foreignKeyField as string]: { _eq: parent_id.value } },
            limit: -1,
          },
        }),
      ]);

      const parentCats = baseCatRes.data.data || [];
      const parentCategoryIds = parentCats
        .map((cat: DirectusItem) => cat.id)
        .filter(Boolean);

      /*
       * Child categories (per-weekday splits of a parent, linked via
       * `groupSharedIdField`) are a `room_categories`-only concept — skip
       * this entirely for a `groupByCollection` that doesn't declare that
       * field, since it has nothing to query and no children to find.
       */
      let childCats: DirectusItem[] = [];
      if (parentCategoryIds.length && props.groupSharedIdField) {
        const childRes = await api.get(`/items/${props.groupByCollection}`, {
          params: {
            filter: {
              [props.groupSharedIdField as string]: { _in: parentCategoryIds },
              id: { _nin: parentCategoryIds },
            },
            fields: buildGroupFields(props),
            limit: -1,
          },
        });
        childCats = childRes.data.data || [];
      }

      /*
       * Rebuild both lookup maps from scratch on every call rather than
       * merging into whatever was there before. Categories/price-dates
       * removed elsewhere on the same record (a sibling repeater field)
       * must actually disappear here too — merging-only would leave a
       * stale entry behind forever, which would both misrepresent the
       * table and make deletion-detection (`reconcileRemovedLegs`)
       * impossible, since nothing would ever look "removed".
       */
      /*
       * Keyed by `lookupKey(cat.id)` — never the raw id — because the
       * template's `v-for="(group, groupKey) in orderedGroupedData"` always
       * hands `getGroupLabel`/`getGroupFromPrice` a *string* key (plain JS
       * object properties are always strings, even when assigned from a
       * numeric id). A category/date whose primary key is a number (tours:
       * integer ids) rather than a UUID (hotels) would otherwise sit in this
       * Map under the number 2132, which `Map.get("2132")` — unlike plain
       * object property access — does NOT match, silently falling back to
       * displaying the raw key instead of the resolved label.
       */
      const newCategories = new Map<string, DirectusItem>();
      [...parentCats, ...childCats].forEach((cat: DirectusItem) =>
        newCategories.set(lookupKey(cat.id), cat),
      );
      const newDates = new Map<string, DirectusItem>();
      (dateRes.data.data || []).forEach((date: DirectusItem) =>
        newDates.set(lookupKey(date.id), date),
      );

      lookupData.value.categories = newCategories;
      lookupData.value.dates = newDates;
    } catch (err) {
      console.error(`${logPrefix} Error fetching lookup data:`, err);
      errorMessage.value = "Failed to load categories and price dates for this price table.";
    }
  };

  // Fetches per-language sell price translations (junction mode only) and
  // returns them as a Map keyed by the related price row's id. Filters via
  // the parent relation (translationsFKField.foreignKeyField) instead of
  // _in with hundreds of price IDs, which exceeds URL/header limits (HTTP 431).
  const fetchTranslationMap = async (
    signal?: AbortSignal,
  ): Promise<Map<string, DirectusItem>> => {
    const translationMap = new Map<string, DirectusItem>();
    if (!translations_id.value || !parent_id.value) return translationMap;
    try {
      const filterValue = props.parentKeyField
        ? (props.values?.[props.parentKeyField as string] ?? parent_id.value)
        : parent_id.value;

      const { data } = await api.get(
        `/items/${props.translationsCollection}`,
        {
          params: {
            filter: {
              _and: [
                {
                  [props.translationsFKField as string]: {
                    [props.foreignKeyField as string]: { _eq: filterValue },
                  },
                },
                {
                  [props.translationsLanguageField as string]: {
                    _eq: translations_id.value,
                  },
                },
              ],
            },
            fields: [
              "id",
              props.translationsFKField,
              props.translationsLanguageField,
              props.sellPriceField,
            ],
            limit: -1,
          },
          signal,
        },
      );
      data.data.forEach((t: DirectusItem) => {
        const rpId =
          typeof t[props.translationsFKField as string] === "object"
            ? t[props.translationsFKField as string].id
            : t[props.translationsFKField as string];
        if (rpId) translationMap.set(rpId, t);
      });
    } catch (err) {
      if (isAbortError(err)) return translationMap;
      console.error(`${logPrefix} Error fetching price translations:`, err);
      errorMessage.value = "Failed to load sell prices for the current language.";
    }
    return translationMap;
  };

  // Guards `fetchItems` against out-of-order responses: an older in-flight
  // request that resolves after a newer one must not overwrite `items.value`
  // with stale data. Scoped to this function only — `fetchLookupData`/
  // `fetchParentRecord` are logically independent fetches and must not share
  // this counter/controller.
  let fetchItemsRequestId = 0;
  let fetchItemsAbortController: AbortController | null = null;

  // `silent` skips the full-page loading spinner — used when re-fetching to
  // sync state after a save/calculate rather than an initial page load, so
  // the table doesn't flash blank on every save.
  const fetchItems = async (silent = false) => {
    if (!parent_id.value || parent_id.value === "+") return;

    fetchItemsAbortController?.abort();
    const controller = new AbortController();
    fetchItemsAbortController = controller;
    const requestId = ++fetchItemsRequestId;
    const isStale = () => requestId !== fetchItemsRequestId;

    if (!silent) loading.value = true;
    try {
      const filterValue = props.parentKeyField
        ? (props.values?.[props.parentKeyField as string] ?? parent_id.value)
        : parent_id.value;

      // Fetch prices and their sell-price translations together and merge
      // before touching items.value once — assigning raw prices first and
      // merging translations in a second pass visibly flashes "no sell
      // price" for a frame in between.
      const [{ data }, translationMap] = await Promise.all([
        api.get(`/items/${props.relatedCollection}`, {
          params: {
            filter: { [props.foreignKeyField as string]: { _eq: filterValue } },
            limit: -1,
          },
          signal: controller.signal,
        }),
        isJunction()
          ? fetchTranslationMap(controller.signal)
          : Promise.resolve(new Map<string, DirectusItem>()),
      ]);

      // A newer fetchItems() call has since superseded this one — discard
      // this response rather than regressing items.value to older data.
      if (isStale()) return;

      items.value = (data.data || []).map((item: DirectusItem) => {
        if (!isJunction()) {
          return {
            ...item,
            [props.buyPriceField as string]: roundToPricePrecision(item[props.buyPriceField as string]),
            [props.sellPriceField as string]: roundToPricePrecision(item[props.sellPriceField as string]),
          };
        }

        const translation = translationMap.get(item.id);
        const translationLangId =
          typeof translation?.[props.translationsLanguageField as string] === "object"
            ? translation[props.translationsLanguageField as string]?.id
            : translation?.[props.translationsLanguageField as string];

        return {
          ...item,
          [props.buyPriceField as string]: roundToPricePrecision(item[props.buyPriceField as string]),
          [props.sellPriceField as string]: roundToPricePrecision(
            translation?.[props.sellPriceField as string] ?? item[props.sellPriceField as string],
          ),
          _translation_id: translation?.id ?? null,
          _translation_lang_id: translationLangId ?? translations_id.value,
        };
      });

      originalItems.value = JSON.parse(JSON.stringify(items.value));
      hasChanges.value = false;
    } catch (err) {
      if (isAbortError(err)) return;
      console.error(`${logPrefix} Error fetching items:`, err);
      errorMessage.value = "Failed to load prices for this table.";
      items.value = [];
    } finally {
      // Only the current (non-superseded) request may clear the spinner —
      // an older request finishing its cleanup after a newer one already
      // started must not flip loading back off underneath it.
      if (!silent && !isStale()) loading.value = false;
    }
  };

  /*
   * Single entry point for "something on this record may have changed" so
   * cascade-delete reconciliation always runs wherever a category/date/
   * occupancy removal could otherwise go unnoticed. Note that the items
   * fetch deliberately runs *after* reconciliation here —
   * `reconcileRemovedLegs` needs the stale `items.value` from before this
   * refresh to know which persisted rows now dangle.
   */
  const refreshLookupsAndReconcile = async () => {
    const before = captureKnownLegIds(lookupData.value);
    await Promise.all([fetchLookupData(), fetchParentRecord()]);
    await reconcileRemovedLegs(
      before,
      lookupData.value,
      items,
      unpersistedCells,
      props,
      api,
      logPrefix,
      errorMessage,
    );
  };

  /*
   * Fresh-load entry point for the initial mount and record switches: the
   * lookup data, the parent record, and the price rows are fully
   * independent here (reconciliation against a *previous* load is only
   * meaningful on a shared-refresh path — see `refreshLookupsAndReconcile`),
   * so they all fetch concurrently instead of one serial round trip each.
   */
  const loadAll = async (silent = false) => {
    await Promise.all([fetchLookupData(), fetchParentRecord(), fetchItems(silent)]);
  };

  // `refetch = false` skips the trailing fetchItems() — used when the
  // caller (calculateSellPrices) is about to trigger its own calculation
  // and refetch anyway, so refetching here would just be thrown away.
  /*
   * Returns the buy price this call just confirmed persisting, per row
   * (`{ id, [buyPriceField]: value }`), for every row it created or updated.
   * This is what lets a caller (the Save & Stay button) hand the sell-price
   * calculator known-good buy prices instead of the calculator re-fetching
   * them itself — that independent re-fetch is what raced the write and
   * produced `sell_price = 0` (see save-and-stay-trigger-flow's
   * `calculateRoomPricesClient`/`calculateSurchargesClient`). Always returns
   * an array (empty when there was nothing to persist or the save failed) so
   * callers can use it directly without an extra null check.
   */
  const persistChanges = async (refetch = true): Promise<DirectusItem[]> => {
    if (!hasChanges.value) return [];

    const missing = saveRequiredFields();
    if (missing.length) {
      errorMessage.value = missingConfigMessage(missing);
      return [];
    }
    errorMessage.value = "";

    const freshRows: DirectusItem[] = [];

    try {
      const changedItems = items.value.filter((item) => {
        const orig = originalItems.value.find((o) => o.id === item.id);
        return (
          orig &&
          (orig[props.sellPriceField as string] !== item[props.sellPriceField as string] ||
            orig[props.buyPriceField as string] !== item[props.buyPriceField as string])
        );
      });

      changedItems.forEach((item) => {
        freshRows.push({
          id: item.id,
          [props.buyPriceField as string]: roundToPricePrecision(
            item[props.buyPriceField as string],
          ),
        });
      });

      // Batch everything into as few requests as possible — Directus's
      // `PATCH /items/{collection}` accepts an array body of
      // `{id, ...fields}` objects and updates each record in a single
      // request (via ItemsService.updateBatch), so N scattered changes
      // collapse into one call per collection.
      const priceRowUpdates: DirectusItem[] = [];
      const translationUpdates: DirectusItem[] = [];
      const translationCreates: DirectusItem[] = [];

      changedItems.forEach((item) => {
        const orig = originalItems.value.find((o) => o.id === item.id);

        const priceRowPatch: DirectusItem = {};

        // 1. Buy price changes always land on the price record itself.
        // Rounded here — the only editable price field — so the database
        // never ends up storing more than 2 decimal places regardless of
        // what precision the user's input happened to carry.
        if (orig && orig[props.buyPriceField as string] !== item[props.buyPriceField as string]) {
          priceRowPatch[props.buyPriceField as string] = roundToPricePrecision(
            item[props.buyPriceField as string],
          );
        }

        if (!isJunction()) {
          // Direct mode: sell price lives on the price row too.
          if (
            orig &&
            orig[props.sellPriceField as string] !== item[props.sellPriceField as string]
          ) {
            priceRowPatch[props.sellPriceField as string] = roundToPricePrecision(
              item[props.sellPriceField as string],
            );
          }
          if (Object.keys(priceRowPatch).length) {
            priceRowUpdates.push({ id: item.id, ...priceRowPatch });
          }
          return;
        }

        // Junction mode: the price row holds the buy price...
        if (Object.keys(priceRowPatch).length) {
          priceRowUpdates.push({ id: item.id, ...priceRowPatch });
        }

        // 2. ...and the translation record holds the sell price.
        if (
          orig &&
          orig[props.sellPriceField as string] !== item[props.sellPriceField as string]
        ) {
          const roundedSellPrice = roundToPricePrecision(
            item[props.sellPriceField as string],
          );
          if (item._translation_id) {
            translationUpdates.push({
              id: item._translation_id,
              [props.sellPriceField as string]: roundedSellPrice,
            });
          } else {
            translationCreates.push({
              [props.translationsFKField as string]: item.id,
              [props.translationsLanguageField as string]: translations_id.value,
              [props.sellPriceField as string]: roundedSellPrice,
            });
          }
        }
      });

      const updates: Promise<unknown>[] = [];
      if (priceRowUpdates.length) {
        updates.push(
          api.patch(`/items/${props.relatedCollection}`, priceRowUpdates, {
            params: { fields: ["id"] },
          }),
        );
      }
      if (translationUpdates.length) {
        updates.push(
          api.patch(`/items/${props.translationsCollection}`, translationUpdates, {
            params: { fields: ["id"] },
          }),
        );
      }
      if (translationCreates.length) {
        updates.push(
          api.post(`/items/${props.translationsCollection}`, translationCreates, {
            params: { fields: ["id"] },
          }),
        );
      }

      /*
       * Grid materialization rule: a fresh category/date/occupancy setup has
       * every price still empty, and nothing is written to the database —
       * that's the correct first-time state. But as soon as ANY cell carries
       * a genuine buy price, pricing has begun for the parent and the whole
       * grid must exist in the database: every remaining combination is
       * created too (empty cells stored as 0, never null), so the grid can
       * be saved, displayed and calculated uniformly. This gate applies
       * exclusively to first-time creation; it is never re-applied once a
       * record exists (see the `changedItems` update loop above, which
       * accepts any value, including 0 or null, without hesitation).
       */
      const pendingCells = Array.from(unpersistedCells.value.entries());
      const hasAnyBuyPrice = pendingCells.some(
        ([, cell]) => !isBuyPriceEmpty(cell[props.buyPriceField as string]),
      );
      const cellsToCreate = hasAnyBuyPrice ? pendingCells : [];

      const createdRows: DirectusItem[] = [];

      const filterValue = props.parentKeyField
        ? (props.values?.[props.parentKeyField as string] ?? parent_id.value)
        : parent_id.value;

      /*
       * Bulk-create every qualifying price row in a single request
       * (Directus accepts an array body for /items/{collection}). The
       * per-row updates (PATCHes on existing records) and this bulk
       * creation of new rows touch different records, so both fire in one
       * `Promise.all` instead of two sequential round trips — only the
       * translations for the just-created rows below have to wait, since
       * they need the returned primary keys.
       */
      const createdRes = await Promise.all([
        Promise.all(updates),
        cellsToCreate.length
          ? api.post(
              `/items/${props.relatedCollection}`,
              cellsToCreate.map(([, cell]) => ({
                [props.foreignKeyField as string]: filterValue,
                [props.groupByField as string]: cell[props.groupByField as string],
                [(props.rowField as string) as string]: cell[(props.rowField as string) as string],
                [props.columnField as string]: cell[props.columnField as string],
                [props.buyPriceField as string]: isBuyPriceEmpty(
                  cell[props.buyPriceField as string],
                )
                  ? 0
                  : roundToPricePrecision(cell[props.buyPriceField as string]),
              })),
              { params: { fields: ["id"] } },
            )
          : Promise.resolve(null),
      ]).then((results) => results[1]);

      if (createdRes) {
        const createdData = createdRes.data?.data ?? createdRes.data;
        createdRows.push(...(Array.isArray(createdData) ? createdData : [createdData]));

        // The create response only carries `id` (`fields: ["id"]` above) —
        // pair positionally with `cellsToCreate` for the buy price actually
        // sent in the create payload, mirroring the same isBuyPriceEmpty/
        // roundToPricePrecision handling used to build that payload.
        createdRows.forEach((row, i) => {
          const cell = cellsToCreate[i]?.[1];
          freshRows.push({
            id: row.id,
            [props.buyPriceField as string]: isBuyPriceEmpty(
              cell?.[props.buyPriceField as string],
            )
              ? 0
              : roundToPricePrecision(cell?.[props.buyPriceField as string]),
          });
        });

        if (isJunction() && translations_id.value) {
          const newTranslations = cellsToCreate
            .map(([, cell], i) => ({ cell, newId: createdRows[i]?.id }))
            .filter(
              ({ cell, newId }) =>
                newId && cell[props.sellPriceField as string] != null,
            )
            .map(({ cell, newId }) => ({
              [props.translationsFKField as string]: newId,
              [props.translationsLanguageField as string]: translations_id.value,
              [props.sellPriceField as string]: roundToPricePrecision(
                cell[props.sellPriceField as string],
              ),
            }));

          if (newTranslations.length) {
            await api.post(
              `/items/${props.translationsCollection}`,
              newTranslations,
              { params: { fields: ["id"] } },
            );
          }
        }

        /*
         * These combinations now have a real database record — drop the
         * UI-only placeholder so `cellMap` starts serving the persisted
         * row (via `items.value`, refreshed below) instead of the stale
         * draft that lingers in `unpersistedCells` otherwise.
         */
        cellsToCreate.forEach(([key]) => unpersistedCells.value.delete(key));
      }

      if (refetch) {
        await fetchItems(true);
      } else if (createdRows.length) {
        /*
         * `calculateSellPrices` fetches the row collection itself as part
         * of the calculation, so instead of re-fetching it a second time
         * here, promote the just-created rows into `items.value` in place
         * (mirroring the shape `fetchItems` produces) so the combined set
         * flows into the calculation that runs right after.
         */
        const tmap = isJunction()
          ? await fetchTranslationMap()
          : new Map<string, DirectusItem>();
        items.value.push(
          ...createdRows.map((row: DirectusItem, i: number) => {
            /*
             * The create response only carries `id` (`fields: ["id"]` on
             * the POST above) — `row` has no buyPriceField/groupByField/etc
             * of its own. `cellsToCreate[i]` is the local draft this exact
             * row was created from (same pairing `freshRows` above relies
             * on), so use its actual submitted values as the base instead
             * of spreading `row`, which used to silently read every field
             * as `undefined` and made the buy price it just wrote look
             * empty to any calculation run against this in-memory copy.
             */
            const cell = cellsToCreate[i]?.[1] ?? {};
            const translation = tmap.get(row.id);
            const translationLangId =
              typeof translation?.[props.translationsLanguageField as string] === "object"
                ? translation[props.translationsLanguageField as string]?.id
                : translation?.[props.translationsLanguageField as string];
            const buyPrice = isBuyPriceEmpty(cell[props.buyPriceField as string])
              ? 0
              : roundToPricePrecision(cell[props.buyPriceField as string]);
            if (!isJunction()) {
              return {
                ...cell,
                id: row.id,
                [props.buyPriceField as string]: buyPrice,
                [props.sellPriceField as string]: roundToPricePrecision(row[props.sellPriceField as string]),
              };
            }
            return {
              ...cell,
              id: row.id,
              [props.buyPriceField as string]: buyPrice,
              [props.sellPriceField as string]: roundToPricePrecision(
                translation?.[props.sellPriceField as string] ?? row[props.sellPriceField as string],
              ),
              _translation_id: translation?.id ?? null,
              _translation_lang_id: translationLangId ?? translations_id.value,
            };
          }),
        );
        originalItems.value = JSON.parse(JSON.stringify(items.value));
        hasChanges.value = false;
      }

      return freshRows;
    } catch (err: any) {
      console.error(`${logPrefix} Save error:`, err);
      errorMessage.value =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.message ||
        err?.message ||
        "Failed to save changes.";
      // Partial/unclear write state on error — don't hand the caller
      // possibly-inaccurate freshRows, let it fall back to its own fetch.
      return [];
    }
  };

  const calculateSellPrices = async () => {
    if (!parent_id.value || parent_id.value === "+") {
      errorMessage.value = isJunction()
        ? "Save the record first before calculating sell prices."
        : "Save the record first before saving prices.";
      return;
    }

    if (!isJunction()) {
      calculatingSellPrices.value = true;
      errorMessage.value = "";
      try {
        if (hasChanges.value) {
          saving.value = true;
          try {
            await persistChanges(false);
          } finally {
            saving.value = false;
          }
          if (errorMessage.value) return;
        }

        /*
         * Direct mode has no separate settings/junction row — the formula
         * is optional here (unlike junction mode, where it's required).
         * If it isn't configured, behave exactly as before: just persist
         * the buy-price edits and stop, since there's nothing to compute.
         */
        const directMissing = describeMissingConfig([
          { value: props.buyPriceTypeField, label: "Buy Price Type Field" },
          { value: props.sellPriceTypeField, label: "Sell Price Type Field" },
          { value: props.percentageTypeField, label: "Percentage Type Field" },
          { value: props.marginField, label: "Margin Percentage Field" },
          { value: props.provisionField, label: "Provision Percentage Field" },
          { value: props.roundHalfLogic, label: "Round Half Logic" },
          { value: props.calculateSellPriceLogic, label: "Calculate Sell Price Logic" },
        ]);
        if (directMissing.length) return;

        const compiled = compileCalculator(
          props.roundHalfLogic as string,
          props.calculateSellPriceLogic as string,
        );
        if (compiled.error) throw new Error(compiled.error);
        const { calculateSellPrice } = compiled;

        // The parent record itself is the single "settings row" — direct
        // mode is single-locale, so there's no per-language split.
        const { data: parentRes } = await api.get(
          `/items/${props.parentCollection}/${parent_id.value}`,
        );
        const settingsRow = parentRes.data;

        let rateValue = 1;
        if (props.junctionExchangeRateField && props.ratesCollection) {
          const rateKey =
            settingsRow[props.junctionExchangeRateField as string]?.key;
          if (rateKey) {
            const { data: rateRes } = await api.get(
              `/items/${props.ratesCollection}/${rateKey}`,
              { params: { fields: ["rate"] } },
            );
            rateValue = parseFloat(rateRes.data?.rate) || 1;
          }
        }

        const occupancyValueMap = new Map<string, number>();
        if (props.occupancyJunctionCollection && props.occupancyJunctionParentField) {
          const occupancyJunctionRows = await api
            .get(`/items/${props.occupancyJunctionCollection}`, {
              params: {
                filter: {
                  [props.occupancyJunctionParentField as string]: {
                    _eq: parent_id.value,
                  },
                },
                fields: [
                  "id",
                  props.occupancyJunctionRelatedField
                    ? `${props.occupancyJunctionRelatedField}.${props.occupancyValueField}`
                    : (props.occupancyValueField as string),
                ],
                limit: -1,
              },
            })
            .then((r) => r.data.data || []);

          occupancyJunctionRows.forEach((occ: DirectusItem) => {
            const related = props.occupancyJunctionRelatedField
              ? occ[props.occupancyJunctionRelatedField as string]
              : occ;
            const value =
              related && typeof related === "object"
                ? related[props.occupancyValueField as string]
                : undefined;
            const occId = normalizeOccupancyFromJunctionBound(occ).id;
            if (occId !== undefined && occId !== null) {
              occupancyValueMap.set(lookupKey(occId), value ?? 1);
            }
          });
        }

        const priceUpdates: { id: string | number; [key: string]: any }[] = [];
        let formulaErrorCount = 0;
        items.value.forEach((priceRow: DirectusItem) => {
          const occupancyValue =
            occupancyValueMap.get(lookupKey(priceRow[props.columnField as string])) ?? 1;

          const buyRaw = priceRow[props.buyPriceField as string];
          const buyIsZero =
            buyRaw === null ||
            buyRaw === undefined ||
            buyRaw === "" ||
            Number(buyRaw) === 0;

          let sellPrice = null;
          if (buyIsZero) {
            sellPrice = 0;
          } else {
            try {
              const result = calculateSellPrice(
                buyRaw,
                settingsRow,
                priceRow,
                rateValue,
                occupancyValue,
              );
              if (result === null || Number.isFinite(result)) sellPrice = result;
            } catch (calcErr) {
              console.error(
                `${logPrefix} Formula threw for price row`,
                priceRow.id,
                calcErr,
              );
              formulaErrorCount += 1;
            }
          }
          sellPrice = roundToPricePrecision(sellPrice);

          const current = priceRow[props.sellPriceField as string];
          const currentNum =
            current === null || current === undefined || current === ""
              ? null
              : Number(current);
          const unchanged =
            sellPrice === null || sellPrice === undefined
              ? currentNum === null
              : currentNum !== null && currentNum === sellPrice;
          if (!unchanged) {
            priceUpdates.push({ id: priceRow.id, [props.sellPriceField as string]: sellPrice });
          }
        });

        if (priceUpdates.length) {
          await api.patch(`/items/${props.relatedCollection}`, priceUpdates, {
            params: { fields: ["id"] },
          });
        }

        await fetchItems(true);
        hasChanges.value = false;
        if (formulaErrorCount > 0) {
          errorMessage.value = `Calculate Sell Price Logic threw an error for ${formulaErrorCount} row(s) — see the browser console for details.`;
        }
      } catch (err: any) {
        console.error(`${logPrefix} calculateSellPrices (direct) error:`, err);
        errorMessage.value =
          err?.response?.data?.error ||
          err?.response?.data?.errors?.[0]?.message ||
          err?.message ||
          "Failed to calculate sell prices.";
      } finally {
        calculatingSellPrices.value = false;
      }
      return;
    }

    const missing = [...saveRequiredFields(), ...calculateRequiredFields()];
    if (missing.length) {
      errorMessage.value = missingConfigMessage(missing);
      return;
    }

    calculatingSellPrices.value = true;
    errorMessage.value = "";

    try {
      if (hasChanges.value) {
        saving.value = true;
        try {
          // Skip persistChanges' own refetch — we refetch below once the
          // calculation itself has finished, so an intermediate refetch
          // here would just be immediately superseded and wasted.
          await persistChanges(false);
        } finally {
          saving.value = false;
        }
        // persistChanges sets errorMessage itself on failure rather than
        // throwing — bail out here before attempting a calculation on
        // top of a save that didn't actually go through.
        if (errorMessage.value) {
          calculatingSellPrices.value = false;
          return;
        }
      }

      /*
       * The field on the settings/junction collection that points back to
       * the parent record — admin-configured per instance via Parent Key
       * Field / Junction → Parent Key Field, no hardcoded fallback so
       * misconfiguration fails loudly instead of silently assuming the
       * wrong field name for whatever collection this is placed on.
       */
      const settingsParentField =
        (props.parentKeyField || props.junctionParentKeyField) as string;

      const compiled = compileCalculator(
        props.roundHalfLogic as string,
        props.calculateSellPriceLogic as string,
      );
      if (compiled.error) throw new Error(compiled.error);
      const { calculateSellPrice } = compiled;

      /*
       * Formerly a single call to a dedicated `/price-calculator/calculate`
       * backend route. That endpoint's only real job was fetching this
       * same data and running this same formula server-side; both are
       * ordinary, already-authenticated Directus `items` reads and the
       * formula is just as safe to execute here (see `compileCalculator`
       * above), so the round trip through a bespoke endpoint added no
       * capability this component didn't already have direct access to.
       *
       * Fetch the junction/settings rows first — their configured exchange
       * rates determine which rate records the pricing loop can possibly
       * touch — so the rates request below can be scoped to exactly those
       * keys (`_in`) and only their `rate` value, instead of hauling every
       * row in the rates collection.
       */
      const settingsRows = await api
        .get(`/items/${props.junctionCollection}`, {
          params: {
            filter: { [settingsParentField]: { _eq: parent_id.value } },
            fields: ["*"],
            limit: -1,
          },
        })
        .then((r) => r.data.data || []);

      const usedRateKeys = Array.from(
        new Set(
          settingsRows
            .map((s: DirectusItem) => s[props.junctionExchangeRateField as string]?.key)
            .filter((k: unknown) => !!k),
        ),
      );

      const [rates, priceRows, occupancyJunctionRows, existingTranslations] =
        await Promise.all([
          usedRateKeys.length
            ? api
                .get(`/items/${props.ratesCollection}`, {
                  params: {
                    filter: { id: { _in: usedRateKeys } },
                    fields: ["id", "rate"],
                    limit: -1,
                  },
                })
                .then((r) => r.data.data || [])
            : Promise.resolve([]),
          /*
           * `persistChanges(false)` already merged any just-created rows
           * into `items.value` above, so reuse it directly rather than
           * re-fetching the row collection it just came from.
           */
          Promise.resolve(items.value),
          api.get(`/items/${props.occupancyJunctionCollection}`, {
            params: {
              filter: {
                [props.occupancyJunctionParentField as string]: {
                  _eq: parent_id.value,
                },
              },
              fields: [
                "id",
                props.occupancyJunctionRelatedField
                  ? `${props.occupancyJunctionRelatedField}.${props.occupancyValueField}`
                  : (props.occupancyValueField as string),
              ],
              limit: -1,
            },
          }).then((r) => r.data.data || []),
          api.get(`/items/${props.translationsCollection}`, {
            params: {
              filter: {
                [props.translationsFKField as string]: {
                  [props.foreignKeyField as string]: { _eq: parent_id.value },
                },
              },
              fields: [
                "id",
                props.translationsFKField,
                props.translationsLanguageField,
                props.sellPriceField,
              ],
              limit: -1,
            },
          }).then((r) => r.data.data || []),
        ]);

      /*
       * Key the map by the *normalized* occupancy id — the same value the
       * grid columns are keyed by (`normalizeOccupancyFromJunction` applied
       * to the junction row with the configured `occupancyIdField`) — NOT
       * the raw junction-row primary key. These differ when the price
       * record's column field references the original occupancy record
       * instead of the junction row (tours: `occupancyIdField =
       * "tours_occupancies_id.id"`), and keying by the wrong one would make
       * every lookup miss and silently default the occupancy value to 1.
       */
      const occupancyValueMap = new Map<string, number>();
      occupancyJunctionRows.forEach((occ: DirectusItem) => {
        const related = props.occupancyJunctionRelatedField
          ? occ[props.occupancyJunctionRelatedField as string]
          : occ;
        const value =
          related && typeof related === "object"
            ? related[props.occupancyValueField as string]
            : undefined;
        const occId = normalizeOccupancyFromJunctionBound(occ).id;
        if (occId !== undefined && occId !== null) {
          occupancyValueMap.set(lookupKey(occId), value ?? 1);
        }
      });

      const rateById = new Map<string, DirectusItem>(
        rates.map((r: DirectusItem) => [r.id, r]),
      );
      const translationByKey = new Map<string, DirectusItem>(
        existingTranslations.map((t: DirectusItem) => [
          `${t[props.translationsFKField as string]}|${t[props.translationsLanguageField as string]}`,
          t,
        ]),
      );

      const translationUpdates: { id: string | number; [key: string]: any }[] = [];
      const translationCreates: DirectusItem[] = [];
      let formulaErrorCount = 0;

      /*
       * Core pricing loop: for every language configuration (each with
       * its own margin/rate), compute a localized sell price for every
       * base price row — identical logic to the retired server endpoint.
       */
      settingsRows.forEach((settingsRow: DirectusItem) => {
        const langId = settingsRow[props.junctionLanguageField as string];
        if (!langId) return;
        if (
          settingsRow[props.buyPriceTypeField as string] == null ||
          settingsRow[props.sellPriceTypeField as string] == null ||
          settingsRow[props.percentageTypeField as string] == null ||
          settingsRow[props.marginField as string] == null ||
          settingsRow[props.junctionExchangeRateField as string] == null
        ) {
          return;
        }

        const exchangeRateInfo = settingsRow[props.junctionExchangeRateField as string];
        const rateRecord =
          exchangeRateInfo && exchangeRateInfo.key
            ? rateById.get(exchangeRateInfo.key)
            : undefined;
        if (!rateRecord) return;
        const rateValue = parseFloat(rateRecord.rate);

        priceRows.forEach((priceRow: DirectusItem) => {
          const occupancyValue =
            occupancyValueMap.get(
              lookupKey(priceRow[props.columnField as string]),
            ) ?? 1;

          let sellPrice = null;
          const buyRaw = priceRow[props.buyPriceField as string];
          const buyIsZero =
            buyRaw === null ||
            buyRaw === undefined ||
            buyRaw === "" ||
            Number(buyRaw) === 0;
          if (buyIsZero) {
            // Zero buy price never goes through the formula — the sell
            // price is 0 outright (both speed and a hard invariant that
            // zero-buy cells can never pick up a stray computed value).
            sellPrice = 0;
          } else {
            try {
              const result = calculateSellPrice(
                buyRaw,
                settingsRow,
                priceRow,
                rateValue,
                occupancyValue,
              );
              if (result === null || Number.isFinite(result)) {
                sellPrice = result;
              }
            } catch (calcErr) {
              console.error(
                `${logPrefix} Formula threw for price row`,
                priceRow.id,
                calcErr,
              );
              formulaErrorCount += 1;
            }
          }
          // Round the formula's raw output before it's ever compared or
          // written — otherwise a full-precision result could compare as
          // "changed" against an already-2-decimal stored value forever.
          sellPrice = roundToPricePrecision(sellPrice);

          const key = `${priceRow.id}|${langId}`;
          const existing = translationByKey.get(key);
          if (existing) {
            /*
             * Skip no-op updates: most cells are still zero-buy and their
             * sell price recomputes to the same 0 already stored. Writing
             * those back bloats the bulk-PATCH payload and (since
             * `updateBatch` applies each row sequentially inside one
             * transaction) is exactly what makes the whole request slow.
             * Only rows whose stored sell price actually differs from the
             * recomputed value need to be sent.
             */
            const current = existing[props.sellPriceField as string];
            const currentNum =
              current === null || current === undefined || current === ""
                ? null
                : Number(current);
            const unchanged =
              (sellPrice === null || sellPrice === undefined)
                ? currentNum === null
                : currentNum !== null && currentNum === sellPrice;
            if (!unchanged) {
              translationUpdates.push({
                id: existing.id,
                [props.sellPriceField as string]: sellPrice,
              });
            }
          } else {
            translationCreates.push({
              [props.translationsFKField as string]: priceRow.id,
              [props.translationsLanguageField as string]: langId,
              [props.sellPriceField as string]: sellPrice,
            });
          }
        });
      });

      /*
       * Batch the writes: Directus's `PATCH /items/{collection}` accepts an
       * array body of `{id, ...fields}` objects and updates each record in
       * one request, so every changed translation collapses into a single
       * call. Creates remain a single bulk POST, same as `persistChanges`.
       *
       * All three write groups are independent of each other (the bulk
       * PATCH touches distinct translations, the bulk POST creates
       * brand-new ones, and the parent PATCH only writes sell-status), so
       * they run together in one `Promise.all` rather than three
       * sequential waits.
       */
      await Promise.all([
        translationUpdates.length
          ? api.patch(
              `/items/${props.translationsCollection}`,
              translationUpdates,
              { params: { fields: ["id"] } },
            )
          : Promise.resolve(),
        translationCreates.length
          ? api.post(
              `/items/${props.translationsCollection}`,
              translationCreates,
              { params: { fields: ["id"] } },
            )
          : Promise.resolve(),
        api.patch(
          `/items/${props.parentCollection}/${parent_id.value}`,
          {
            [props.sellStatusField as string]: "done",
            [props.sellUpdatedAtField as string]: new Date().toISOString(),
          },
          { params: { fields: ["id"] } },
        ),
      ]);

      /*
       * Only sell prices changed — occupancies/category order don't, so
       * there's no need to re-fetch the whole row collection (a full
       * `fetchItems` here meant re-reading the related, translations, and
       * junction collections). The only thing the table needs refreshed is
       * the sell price for the currently displayed language, so merge just
       * that from a single translations request. `priceRows` is
       * `items.value`, so the calculation results can be written straight
       * onto the same rows the table renders.
       */
      const translationMap = await fetchTranslationMap();
      items.value.forEach((item) => {
        const translation = translationMap.get(item.id);
        if (!translation) return;
        const langId =
          typeof translation[props.translationsLanguageField as string] === "object"
            ? translation[props.translationsLanguageField as string]?.id
            : translation[props.translationsLanguageField as string];
        item[props.sellPriceField as string] = roundToPricePrecision(
          translation[props.sellPriceField as string],
        );
        item._translation_id = translation.id;
        item._translation_lang_id = langId ?? translations_id.value;
      });
      originalItems.value = JSON.parse(JSON.stringify(items.value));
      hasChanges.value = false;
      if (formulaErrorCount > 0) {
        errorMessage.value = `Calculate Sell Price Logic threw an error for ${formulaErrorCount} row(s) — see the browser console for details.`;
      }
    } catch (err: any) {
      console.error(`${logPrefix} calculateSellPrices error:`, err);
      errorMessage.value =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.message ||
        err?.message ||
        "Failed to calculate sell prices.";
      try {
        await api.patch(
          `/items/${props.parentCollection}/${parent_id.value}`,
          { [props.sellStatusField as string]: "failed" },
        );
      } catch (statusErr) {
        /*
         * Best-effort status update — the original failure above is the
         * one that matters and is already surfaced via `errorMessage`.
         */
      }
    } finally {
      calculatingSellPrices.value = false;
    }
  };

  return {
    initParentContext,
    fetchCurrencySymbols,
    fetchItems,
    loadAll,
    refreshLookupsAndReconcile,
    persistChanges,
    calculateSellPrices,
  };
}