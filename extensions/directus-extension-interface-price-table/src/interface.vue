<template>
  <div class="room-prices-table">
    <div v-if="loading" class="loading">
      <v-progress-circular indeterminate />
      <p class="loading-text">Loading prices...</p>
    </div>
    <div v-else>
      <v-notice type="danger" v-if="errorMessage" class="error-notice">
        {{ errorMessage }}
      </v-notice>

      <!-- Context Selector for Hotel view (junction mode only — stays empty in direct mode) -->
      <div
        v-if="
          collection === parentCollection && availableTranslations.length > 0
        "
        class="context-header"
      >
        <div class="selector-field">
          <span class="selector-label">Language:</span>
          <v-select
            v-model="selectedTranslationId"
            :items="availableTranslations"
            placeholder="Select language..."
            inline
          />
        </div>
      </div>

      <!-- Save Bar -->
      <div class="save-bar button-top" v-if="buttonPosition === 'top'">
        <v-button
          @click="calculateSellPrices"
          :loading="calculatingSellPrices"
          :disabled="disabled || saving || loading || !parent_id || !hasChanges"
        >
          {{ label }}
        </v-button>
      </div>

      <!-- Groups (Accordion style) -->
      <template v-if="hasMinimumConfig">
      <div
        v-for="(group, groupKey) in orderedGroupedData"
        :key="groupKey"
        class="price-group"
      >
        <div class="table-wrapper">
          <table class="prices-table">
            <colgroup>
              <col class="col-label" />
              <col class="col-price-type" />
              <col
                v-for="col in columns"
                :key="'cg-' + col.id"
                class="col-price"
              />
            </colgroup>
            <thead>
              <tr>
                <th
                  class="group-header-cell sticky-col"
                  colspan="2"
                  @click="toggleGroup(groupKey)"
                >
                  <div class="group-header-inner">
                    <v-icon
                      name="expand_more"
                      class="accordion-icon"
                      :class="{ 'is-expanded': expandedGroups[groupKey] }"
                    />
                    <span class="group-title">
                      {{ getGroupLabel(groupKey) }}
                      <span
                        v-if="fromPriceSymbol && getGroupFromPrice(groupKey)"
                        class="from-price-wrapper"
                        >(<v-icon
                          :name="fromPriceSymbol"
                          small
                          class="from-price-icon"
                        />)</span
                      >
                    </span>
                  </div>
                </th>
                <th v-for="col in columns" :key="col.id" class="column-header">
                  {{ col[occupancyLabelField || ''] }}
                  [{{ col.value }}]
                  <span
                    v-if="fromPriceSymbol && col.from_price"
                    class="from-price-wrapper"
                    >(<v-icon
                      :name="fromPriceSymbol"
                      small
                      class="from-price-icon"
                    />)</span
                  >
                </th>
              </tr>
            </thead>
            <TransitionGroup tag="tbody" name="row-cascade">
              <tr
                v-for="(row, rowIndex) in expandedGroups[groupKey]
                  ? group.rows
                  : []"
                :key="`${groupKey}|${row.id}`"
                class="data-row"
                :style="{ '--row-index': Math.min(Number(rowIndex), 8) }"
              >
                <td class="row-label sticky-col">
                  <div class="row-label-content">
                    <strong
                      v-if="
                        row?.[rowLabelField || ''] &&
                        !isDateRangeName(row[rowLabelField || ''])
                      "
                      class="date-name"
                      >{{ row[rowLabelField || ''] }}
                    </strong>
                    <small class="date-range">
                      {{ formatDateRange(row[rowStartDateField || 'start_date'], row[rowEndDateField || 'end_date']) }}
                      <span
                        v-if="
                          fromPriceSymbol &&
                          rowFromPriceField &&
                          row[rowFromPriceField || '']
                        "
                        class="from-price-wrapper"
                        >(<v-icon
                          :name="fromPriceSymbol"
                          small
                          class="from-price-icon"
                        />)</span
                      >
                    </small>
                  </div>
                </td>
                <td class="label-col">
                  <div class="price-labels">
                    <label class="input-label buy-label">
                      <v-icon name="shopping_cart" x-small />
                      {{ buyLabel }} ({{ buyCurrencySymbol }})
                    </label>
                    <label class="input-label sell-label">
                      <v-icon name="sell" x-small />
                      {{ sellLabel }} ({{ sellCurrencySymbol }})
                    </label>
                  </div>
                </td>
                <td
                  v-for="col in columns"
                  :key="`${groupKey}|${row.id}|${col.id}`"
                  class="price-cell"
                  :class="{
                    'has-changes': isCellModified(groupKey, row.id, col.id),
                  }"
                >
                  <div class="price-inputs">
                    <input
                      :value="getBuyDisplay(groupKey, row.id, col.id)"
                      type="number"
                      step="0.01"
                      class="cell-input"
                      :disabled="disabled"
                      @input="
                        (markBuyCellTyped(groupKey, row.id, col.id),
                        handleBuyPriceInput(groupKey, row.id, col.id, $event))
                      "
                      @focus="($event.target as HTMLInputElement).select()"
                    />
                    <span class="price-display">
                      {{
                        formatPrice(
                          getCell(groupKey, row.id, col.id)[sellPriceField || ''],
                        )
                      }}
                    </span>
                  </div>
                </td>
              </tr>
            </TransitionGroup>
          </table>
        </div>
      </div>
      </template>

      <!-- Empty State -->
      <div v-if="!hasMinimumConfig" class="empty-state-card">
        <v-icon name="inbox" large class="empty-icon" />
        <p class="empty-title">
          {{ emptyStateTitle }}
        </p>
        <p class="empty-hint">
          {{ emptyStateHint }}
        </p>
      </div>

      <div class="save-bar button-bottom" v-if="buttonPosition === 'bottom'">
        <v-button
          @click="calculateSellPrices"
          :loading="calculatingSellPrices"
          :disabled="disabled || saving || loading || !parent_id || !hasChanges"
        >
          {{ label }}
        </v-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  type Ref,
  reactive,
  computed,
  type ComputedRef,
  watch,
  onMounted,
  onUnmounted,
} from "vue";
import { useApi } from "@directus/extensions-sdk";
import { format as formatDateFns, isValid, parse } from "date-fns";
import {
  getGroupLabel as sharedGetGroupLabel,
  getGroupFromPrice as sharedGetGroupFromPrice,
  createLookupData,
  useColumns,
  useHasMinimumConfig,
  useRows,
  useGroupedData,
  useOrderedGroupedData,
  seedUnpersistedCells,
  pickBestPriceRow,
  PRICE_PRECISION,
} from "./composables/priceTableCore";
import { usePriceTableData } from "./composables/usePriceTableData";
import type { DirectusItem, AvailableTranslation, PriceTableProps } from "./types";

/**
 * Vue component for the Price Table interface.
 *
 * Handles both of its modes in a single component, branching on `props.mode`
 * wherever their behavior genuinely differs:
 *
 * - "junction" mode (per-language/market pricing — hotels, cruises): resolves
 *   the selected language/market and its exchange rate, renders the price grid,
 *   persists buy/sell price edits, and can recompute sell prices from an
 *   admin-authored formula.
 * - "direct" mode (a single flat price row with no language concept — cars):
 *   no language selector, no translations collection, and no formula — editing
 *   buy/sell prices directly on the price row is the whole of it.
 *
 * The data/API work lives in the `usePriceTableData` composable, external
 * `price-calculator:calculated` completion handling lives in this component,
 * and the grid-shaping logic lives in `priceTableCore`; this component owns
 * the state, the input handling, and the lifecycle wiring. Registered as the
 * "Price Table" interface's component (see `index.ts`).
 */
export default defineComponent({
  /*
   * No field-name, collection-name, or cosmetic prop below carries a
   * default value. An unconfigured prop is simply absent/empty, so a
   * misconfiguration surfaces as a visibly missing value instead of a
   * silent, wrong guess (e.g. assuming a "name" field or a "€" symbol).
   */
  props: {
    mode: { type: String },
    value: { type: Array, default: () => [] },
    label: { type: String },
    buttonPosition: { type: String },
    primaryKey: { type: [String, Number], default: null },
    collection: { type: String, required: true },
    field: { type: String, required: true },
    groupByField: { type: String },
    rowField: { type: String },
    columnField: { type: String },
    disabled: { type: Boolean },
    values: { type: Object, default: () => ({}) },
    buyPriceTypeField: { type: String },
    sellPriceTypeField: { type: String },
    percentageTypeField: { type: String },
    marginField: { type: String },
    provisionField: { type: String },
    occupancyValueField: { type: String },
    roundHalfLogic: { type: String },
    calculateSellPriceLogic: { type: String },
    // Related collection (prices)
    relatedCollection: { type: String },
    foreignKeyField: { type: String },
    buyPriceField: { type: String },
    // Parent record
    parentCollection: { type: String },
    parentKeyField: { type: String },
    occupanciesField: { type: String },
    occupancySourceMode: { type: String },
    occupancyJunctionCollection: { type: String },
    occupancyJunctionPrimaryKeyField: { type: String },
    occupancyJunctionParentField: { type: String },
    occupancyJunctionRelatedField: { type: String },
    /*
     * Dot-path into the occupancy junction row for the value the price
     * record's occupancy foreign key actually stores — e.g. "id" when the
     * FK points at the junction row itself (hotels: room_prices.room_occupancy_id
     * → hotels_occupancies.id), or "tours_occupancies_id.id" when it points
     * at the original occupancy record instead (tours). Resolved via
     * `getNestedValue`.
     */
    occupancyIdField: { type: String },
    occupancyCollection: { type: String },
    categoryOrderField: { type: String },
    groupByCollection: { type: String },
    /*
     * Field on `groupByCollection` that links a per-weekday child category
     * back to its parent (the hotel `room_categories.sharedId` feature).
     * Presence of this config — not a separate boolean — is what enables
     * the whole child-category fetch/merge: leave it unset for a
     * collection with no such concept (e.g. `tours_categories`).
     */
    groupSharedIdField: { type: String },
    // Field on the parent category holding its per-weekday repeater
    // entries (hotel: `days_repeater`) — read only when the category
    // resolved via `groupSharedIdField` turns out to be a child.
    groupChildWeekdaysField: { type: String },
    rowCollection: { type: String },
    sellStatusField: { type: String },
    sellUpdatedAtField: { type: String },
    // Junction collection
    junctionCollection: { type: String },
    junctionParentKeyField: { type: String },
    junctionLanguageField: { type: String },
    junctionExchangeRateField: { type: String },
    // Translations collection (sell prices)
    translationsCollection: { type: String },
    translationsFKField: { type: String },
    translationsLanguageField: { type: String },
    sellPriceField: { type: String },
    // Currency
    ratesCollection: { type: String },
    fromCurrencyField: { type: String },
    toCurrencyField: { type: String },
    currencySymbolField: { type: String },
    defaultBuyCurrencySymbol: { type: String },
    defaultSellCurrencySymbol: { type: String },
    fromPriceSymbol: { type: String },
    groupFromPriceField: { type: String },
    occupancyFromPriceField: { type: String },
    rowFromPriceField: { type: String },
    occupancySortField: { type: String },
    rowSortField: { type: String },
    groupSortField: { type: String },
    groupLabelField: { type: String },
    groupLabelTranslationField: { type: String },
    occupancyLabelField: { type: String },
    occupancyLabelFallbackMinField: { type: String },
    occupancyLabelFallbackMaxField: { type: String },
    occupancyLabelFallbackCategoryField: { type: String },
    rowLabelField: { type: String },
    rowStartDateField: { type: String },
    rowEndDateField: { type: String },
    languageNameField: { type: String },
    emptyStateTitle: { type: String },
    emptyStateHint: { type: String },
    buyLabel: { type: String },
    sellLabel: { type: String },
  },

  emits: ["input"],

  setup(props) {
    const api = useApi();
    const isJunction = () => props.mode === "junction";
    // Prefixes every console message so junction vs. direct mode is
    // distinguishable in logs, same as when these were two files.
    const logPrefix = isJunction() ? "[RoomPricesTable]" : "[RoomPricesTable/Direct]";

    const loading = ref(false);
    const saving = ref(false);
    const calculatingSellPrices = ref(false);
    const errorMessage = ref("");
    const items = ref<DirectusItem[]>([]);
    const originalItems = ref<DirectusItem[]>([]);
    const hasChanges = ref(false);

    /*
     * Combinations the table currently displays (because their category,
     * price-date, and occupancy all exist) but that have no database record
     * yet — keyed identically to `cellMap` below (`groupKey|rowId|colId`).
     * A database record only ever gets created deliberately, in
     * `persistChanges`, once a genuine buy price is present — never merely
     * because the combination was rendered.
     */
    const unpersistedCells = ref<Map<string, DirectusItem>>(new Map());

    const parent_id = ref<string | null>(null);
    const translations_id = ref<string | null>(null);
    const lookupData = createLookupData();

    const parentRecord = ref<DirectusItem | null>(null);
    const buyCurrencySymbol = ref<string>("");
    const sellCurrencySymbol = ref<string>("");
    const roomCategoryOrder = ref<string[]>([]);
    const sellPricesStatus = ref<string | null>(null);
    const sellPricesUpdatedAt = ref<string | null>(null);

    // Translation options for Hotel view (junction mode only)
    const availableTranslations = ref<AvailableTranslation[]>([]);
    const selectedTranslationId = ref<string | number | null>(null);

    // Accordion state
    const expandedGroups = ref<Record<string, boolean>>({});

    const {
      initParentContext,
      fetchCurrencySymbols,
      fetchItems,
      loadAll,
      refreshLookupsAndReconcile,
      persistChanges,
      calculateSellPrices: calculateSellPricesInternal,
    } = usePriceTableData({
      props: props as unknown as PriceTableProps,
      api,
      logPrefix,
      isJunction,
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
    });

    // ── External calculation signal ────────────────────────────────────────
    //
    // An external caller (e.g. the Save & Stay button) that just re-ran the
    // price calculator for THIS parent announces it via the
    // `price-calculator:calculated` event — reload the rows so the table
    // reflects the freshly computed sell prices. Only relevant in junction
    // mode (the calculator only ever runs there).
    const handleExternalCalculation = async (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.parentId && String(detail.parentId) === String(parent_id.value)) {
        // The record was just saved (that's what triggered the external
        // calculation) — categories/dates/occupancies removed on a sibling
        // repeater field as part of that save may now dangle, so reconcile
        // before refreshing the displayed rows.
        await refreshLookupsAndReconcile();
        await fetchItems(true);
      }
    };

    /*
     * Buy-price edits in this grid are written straight to `items.value`/
     * `unpersistedCells` and persisted via this component's own direct API
     * calls — never through Directus's normal `emit("input", ...)` field
     * path, since `room_prices` (or equivalent) is a separate collection,
     * not a field on the current record. That means the standalone Save &
     * Stay button's own dirty-tracking (which only watches the record's
     * `values`) can't see grid-only edits at all — broadcasting `hasChanges`
     * here is what lets that button both enable itself for a grid-only edit
     * and, via the `flush-request`/`flush-complete` handshake below, persist
     * this grid before triggering its own save + calculator.
     */
    watch(hasChanges, (dirty) => {
      window.dispatchEvent(
        new CustomEvent("price-table:dirty-changed", { detail: { dirty } }),
      );
    });

    const handleFlushRequest = async () => {
      // `freshRows` carries the buy price this call just confirmed
      // persisting for each created/updated row — passed along so the Save
      // & Stay button's sell-price calculator can use it directly instead
      // of re-fetching (and possibly racing) this same write. Empty when
      // there was nothing to persist or the save failed.
      let freshRows: unknown[] = [];
      try {
        if (hasChanges.value) freshRows = await persistChanges();
      } finally {
        window.dispatchEvent(
          new CustomEvent("save-and-stay:flush-complete", {
            detail: { source: "price-table", freshRows },
          }),
        );
      }
    };

    // ── Grid state & cell access ─────────────────────────────────────────
    //
    // Maps every visible combination (`groupKey|rowId|colId`) to the mutable
    // row object the template reads and writes. Persisted rows live in
    // `items.value`; UI-only drafts for combinations that have no database
    // record yet are layered in on top from `unpersistedCells`.
    const cellMap = computed(() => {
      const map = new Map<string, DirectusItem>();
      const candidatesByKey = new Map<string, DirectusItem[]>();
      items.value.forEach((item) => {
        const key = `${item[props.groupByField as string]}|${item[(props.rowField as string) as string]}|${item[props.columnField as string]}`;
        const bucket = candidatesByKey.get(key);
        if (bucket) bucket.push(item);
        else candidatesByKey.set(key, [item]);
      });
      candidatesByKey.forEach((candidates, key) => {
        map.set(
          key,
          pickBestPriceRow(
            candidates,
            props.buyPriceField as string,
            props.sellPriceField as string,
          ),
        );
      });
      /*
       * Layer in any combinations that are only represented in the UI so
       * far — a persisted row for the same key always takes precedence,
       * since `unpersistedCells` is only ever populated for keys that had
       * no database record at the time they were edited.
       */
      unpersistedCells.value.forEach((cell, key) => {
        if (!map.has(key)) map.set(key, cell);
      });
      return map;
    });

    const getCell = (groupKey: string, rowId: string, colId: string) => {
      const key = `${groupKey}|${rowId}|${colId}`;
      return cellMap.value.get(key) || {};
    };

    const isCellModified = (groupKey: string, rowId: string, colId: string) => {
      const current = getCell(groupKey, rowId, colId);
      if (current.id === undefined) {
        // Unsaved cell for a combination with no price row yet — highlight
        // it once the user has entered a value.
        return (
          current[props.buyPriceField as string] != null ||
          current[props.sellPriceField as string] != null
        );
      }
      const original = originalItems.value.find((o) => o.id === current.id);
      return (
        original &&
        (original[props.sellPriceField as string] !== current[props.sellPriceField as string] ||
          original[props.buyPriceField as string] !== current[props.buyPriceField as string])
      );
    };

    /*
     * Returns the mutable cell object backing a given combination, creating
     * an entry in `unpersistedCells` on first touch if the combination has
     * no database record yet. A record that already exists (has an `id`)
     * is always edited in place on `items.value` via `cellMap` — only a
     * combination with no record yet gets routed to the UI-only map, so it
     * can be gated by the initialization buy-price rule later in
     * `persistChanges` instead of being written to the database immediately.
     */
    const getOrCreateEditableCell = (
      groupKey: string,
      rowId: string,
      colId: string,
    ) => {
      const key = `${groupKey}|${rowId}|${colId}`;
      const existing = cellMap.value.get(key);
      if (existing) return existing;

      const draft = {
        [props.groupByField as string]: groupKey,
        [(props.rowField as string) as string]: rowId,
        [props.columnField as string]: colId,
        [props.buyPriceField as string]: null,
        [props.sellPriceField as string]: null,
        _translation_id: null,
      };
      unpersistedCells.value.set(key, draft);
      return draft;
    };

    const handleBuyPriceInput = (
      groupKey: string,
      rowId: string,
      colId: string,
      event: Event,
    ) => {
      const input = event.target as HTMLInputElement;
      const value = input.value === "" ? null : Number(input.value);
      const cell = getOrCreateEditableCell(groupKey, rowId, colId);
      cell[props.buyPriceField as string] = value;
      hasChanges.value = true;
    };

    // ── Grid computeds ──────────────────────────────────────────────────────
    //
    // Derived from the lookup maps (columns = occupancies, rows =
    // price-dates, groups = categories), so empty-but-known legs still render
    // as full editable rows/columns. See `priceTableCore` for the shared
    // implementations.
    const columns = useColumns(props as unknown as PriceTableProps, lookupData) as unknown as ComputedRef<DirectusItem[]>;
    const hasMinimumConfig = useHasMinimumConfig(lookupData, columns);
    const rows = useRows(props as unknown as PriceTableProps, lookupData) as unknown as ComputedRef<DirectusItem[]>;
    const groupedData = useGroupedData(props as unknown as PriceTableProps, lookupData, items, rows);
    const orderedGroupedData = useOrderedGroupedData(
      props as unknown as PriceTableProps,
      lookupData,
      groupedData,
      roomCategoryOrder,
    );

    /*
     * Keep `unpersistedCells` in sync with the visible grid: every
     * combination (category × date × occupancy) that has no database record
     * yet must be represented there, not just the cells the user typed into.
     * The materialization gate in `persistChanges` derives its "create all
     * remaining empty rows on first Save & Calculate" list from this map, so
     * a brand-new grid where only one cell holds a buy price still gets its
     * other (untouched, empty) rows created with 0. Existing edits are
     * preserved and persisted rows are always left alone. Grouped mode only —
     * direct mode (no `groupByField`) has no group column to write, so the
     * pseudo "all" group must not be seeded.
     */
    if (props.groupByField) {
      watch(
        [orderedGroupedData, columns, items],
        () => {
          seedUnpersistedCells(
            orderedGroupedData.value,
            columns.value,
            items,
            unpersistedCells,
            props,
          );
        },
        { immediate: true },
      );
    }

    // Junction mode filters a category's label by the selected language;
    // direct mode has no language concept, so `currentLangId` is omitted
    // and the shared helper takes the category's first translation row.
    const getGroupLabel = (key: string) =>
      sharedGetGroupLabel(
        key,
        lookupData.value.categories,
        props,
        isJunction() ? translations_id.value : undefined,
      );

    const getGroupFromPrice = (key: string): boolean =>
      sharedGetGroupFromPrice(
        key,
        lookupData.value.categories,
        props.groupFromPriceField as string,
      );

    // An explicit 0 (not null/empty) is treated as unset in the UI — show
    // nothing rather than a literal 0.00, independently for buy and sell.
    const isZero = (value: unknown) =>
      value != null && value !== "" && Number(value) === 0;

    const getBuyValue = (groupKey: string, rowId: string, colId: string) =>
      getCell(groupKey, rowId, colId)[props.buyPriceField || ""];

    // Cells the user has actually typed a buy price into since the last
    // save, tracked explicitly (not inferred by comparing values) so there's
    // no ambiguity from type mismatches or reactivity timing — this is the
    // single source of truth for "is this 0 a live edit or a saved value".
    // Cleared wholesale once a save actually completes (see
    // `calculateSellPrices` below).
    const editedBuyCellKeys = reactive(new Set<string>());
    const buyCellKey = (groupKey: string, rowId: string, colId: string) =>
      `${groupKey}|${rowId}|${colId}`;
    const markBuyCellTyped = (groupKey: string, rowId: string, colId: string) => {
      editedBuyCellKeys.add(buyCellKey(groupKey, rowId, colId));
    };

    // A 0 is only ever blanked once it's the value actually saved in the
    // database — a 0 the user just typed and hasn't saved yet is shown
    // plainly, exactly as typed, until Save and Calculate commits it, at
    // which point it blanks out like any other saved 0.
    const getBuyDisplay = (groupKey: string, rowId: string, colId: string) => {
      const buy = getBuyValue(groupKey, rowId, colId);
      if (!isZero(buy)) return buy;
      return editedBuyCellKeys.has(buyCellKey(groupKey, rowId, colId)) ? buy : "";
    };

    // Wraps the composable's own Save and Calculate so a successful save
    // also clears every cell's "user just typed this" flag — from that
    // point on, a 0 in any of those cells reflects what's actually in the
    // database again, so the normal blank-if-zero display takes back over.
    const calculateSellPrices = async () => {
      await calculateSellPricesInternal();
      editedBuyCellKeys.clear();
    };

    // Display formatting for the (read-only) sell price — always 2
    // decimals, matching `roundToPricePrecision`'s fixed save precision.
    const formatPrice = (value: unknown) => {
      if (isZero(value)) return "";
      if (value == null || isNaN(Number(value))) return "";
      return Number(value).toFixed(PRICE_PRECISION as number);
    };

    // Read from the Directus field config for `rowStartDateField` and
    // `rowEndDateField` independently (each field's own Interface "Format"
    // option) so changing either one — no code change or rebuild — is
    // reflected here too. Each falls back to dd.MM.yyyy if that field has
    // no custom format configured, or the lookup fails.
    const rowStartDateFormat = ref<string>("dd.MM.yyyy");
    const rowEndDateFormat = ref<string>("dd.MM.yyyy");
    const loadFieldFormat = async (fieldName: string | undefined, target: Ref<string>) => {
      if (!props.rowCollection || !fieldName) return;
      try {
        const { data } = await api.get(
          `/fields/${props.rowCollection}/${fieldName}`,
        );
        const configuredFormat = data?.data?.meta?.options?.format;
        if (configuredFormat) target.value = configuredFormat;
      } catch {
        // Keep the dd.MM.yyyy fallback — a missing/misconfigured field
        // definition shouldn't break date display in the grid.
      }
    };
    const loadRowDateFormat = async () =>
      Promise.all([
        loadFieldFormat(props.rowStartDateField, rowStartDateFormat),
        loadFieldFormat(props.rowEndDateField, rowEndDateFormat),
      ]);

    // Directus's own datetime Format option isn't only a literal date-fns
    // token pattern (e.g. "dd.MM.yyyy") — it's a dropdown defaulting to the
    // presets "long"/"short" (its Field/Display "Format" choices), with
    // "allow other" letting a custom pattern be typed instead. date-fns'
    // `format()` has no idea what to do with the literal word "long", so
    // presets need to route through `Intl.DateTimeFormat` (`dateStyle`)
    // the same way Directus's own component renders them, while anything
    // else is treated as a literal custom pattern, as before.
    const INTL_DATE_STYLE_PRESETS = new Set(["full", "long", "medium", "short"]);
    const formatWithPattern = (d: string, value: string) => {
      if (INTL_DATE_STYLE_PRESETS.has(value)) {
        return new Intl.DateTimeFormat(undefined, {
          dateStyle: value as "full" | "long" | "medium" | "short",
        }).format(new Date(d));
      }
      return formatDateFns(new Date(d), value);
    };
    const formatDateRange = (start?: string, end?: string) => {
      if (!start) return "";
      const formattedStart = formatWithPattern(start, rowStartDateFormat.value);
      return end
        ? `${formattedStart} - ${formatWithPattern(end, rowEndDateFormat.value)}`
        : formattedStart;
    };

    const isDateRangeName = (name: string): boolean => {
      const parts = name.split(/\s*[-–]\s*/);
      if (parts.length !== 2) return false;
      const ref = new Date(2000, 0, 1);
      return parts.every((p) => isValid(parse(p.trim(), "dd.MM.yyyy", ref)));
    };

    // Accordion control
    const toggleGroup = (groupKey: string) => {
      expandedGroups.value[groupKey] = !expandedGroups.value[groupKey];
    };

    /*
     * Reconciles this record independently of the `price-calculator:calculated`
     * signal, which is junction-mode-only and only ever fires as a side
     * effect of a save-triggered recalculation. A category/date/occupancy
     * can just as well be removed on a *direct*-mode record, or on a
     * junction-mode one without any recalculation following it — this is
     * the generic fallback that catches those cases, by re-checking
     * whenever the browser tab holding this form regains focus (the
     * moment a user is most likely to come back after having made such an
     * edit elsewhere, e.g. a different browser tab on the same record).
     */
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && parent_id.value) {
        // The cleanup itself only touches the database — without this, the
        // grid keeps showing an orphaned row that was just deleted
        // underneath it until something else happens to reload the page,
        // which looks exactly like the deletion silently failed.
        await refreshLookupsAndReconcile();
        await fetchItems(true);
      }
    };

    // ── Lifecycle ──────────────────────────────────────────────────────────
    //
    // Initial load: resolve the parent/language context and fetch everything
    // in parallel (`loadAll`). The external `price-calculator:calculated`
    // completion signal is only relevant in junction mode (the calculator
    // only ever runs there); the visibility-based reconciliation above is
    // generic and applies to both modes.
    onMounted(async () => {
      await initParentContext();
      await Promise.all([loadAll(), loadRowDateFormat()]);
      if (isJunction()) {
        window.addEventListener(
          "price-calculator:calculated",
          handleExternalCalculation,
        );
      }
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("save-and-stay:flush-request", handleFlushRequest);
    });

    onUnmounted(() => {
      // Remove the completion-signal listener so nothing outlives the
      // component instance.
      if (isJunction()) {
        window.removeEventListener(
          "price-calculator:calculated",
          handleExternalCalculation,
        );
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("save-and-stay:flush-request", handleFlushRequest);
      // The Save & Stay button may still be mounted after this grid is torn
      // down (e.g. this field's tab/drawer closed) — make sure it doesn't
      // keep believing this grid still has unsaved edits.
      window.dispatchEvent(
        new CustomEvent("price-table:dirty-changed", { detail: { dirty: false } }),
      );
    });

    watch(
      orderedGroupedData,
      (newVal) => {
        Object.keys(newVal).forEach((key) => {
          if (expandedGroups.value[key] === undefined) {
            expandedGroups.value[key] = true;
          }
        });
      },
      { immediate: true },
    );

    watch(selectedTranslationId, async (newVal) => {
      if (newVal === null || newVal === undefined) return;
      const current = availableTranslations.value.find(
        (t) => t.value === newVal,
      );
      if (current) {
        translations_id.value = current.lang_id ? String(current.lang_id) : null;
        if (current.exchange_rate?.key) {
          fetchCurrencySymbols(current.exchange_rate.key);
        }
        await fetchItems();
      }
    });

    watch(
      () => props.primaryKey,
      async () => {
        parent_id.value = null;
        translations_id.value = null;
        /*
         * This is a switch to a *different* record, not a change on the
         * current one — deliberately NOT using `refreshLookupsAndReconcile`
         * here, since diffing the outgoing record's categories/dates against
         * the incoming record's would treat every one of them as "removed"
         * and cascade-delete the previous record's still-valid price rows.
         * `fetchLookupData` still needs to run directly, though, so the
         * previous record's categories/dates don't linger in `lookupData`.
         */
        await initParentContext();
        await loadAll();
      },
    );

    watch(
      [items, unpersistedCells],
      () => {
        /*
         * A not-yet-persisted cell only counts as a real change once it
         * actually carries a value — an empty draft object created by
         * `getOrCreateEditableCell` but never filled in isn't something to
         * save.
         */
        const hasUnpersistedEdits = Array.from(
          unpersistedCells.value.values(),
        ).some(
          (cell) =>
            cell[props.buyPriceField as string] != null ||
            cell[props.sellPriceField as string] != null,
        );
        hasChanges.value =
          hasUnpersistedEdits ||
          JSON.stringify(items.value) !== JSON.stringify(originalItems.value);
      },
      { deep: true },
    );

    watch(
      () => props.values,
      async (newVal) => {
        if (!isJunction()) return;
        if (props.primaryKey === "+") {
          const parentField = (props.parentKeyField || props.junctionParentKeyField) as string;
          const langField = props.junctionLanguageField as string;
          if (!parentField) return;
          const hId = newVal?.[parentField];
          const tId = newVal?.[langField];
          if (hId && hId !== parent_id.value) {
            parent_id.value = typeof hId === "object" ? hId.id : hId;
          }
          if (tId && tId !== translations_id.value) {
            translations_id.value = typeof tId === "object" ? tId.id : tId;
            await fetchItems();
          }
        }
      },
      { deep: true },
    );

    return {
      loading,
      saving,
      calculatingSellPrices,
      errorMessage,
      hasChanges,
      items,
      availableTranslations,
      selectedTranslationId,
      buyCurrencySymbol,
      sellCurrencySymbol,
      orderedGroupedData,
      hasMinimumConfig,
      columns,
      expandedGroups,
      getGroupLabel,
      getGroupFromPrice,
      formatPrice,
      getBuyDisplay,
      markBuyCellTyped,
      formatDateRange,
      getCell,
      isCellModified,
      handleBuyPriceInput,
      calculateSellPrices,
      toggleGroup,
      isDateRangeName,
      parent_id,
      translations_id,
      buyPriceField: props.buyPriceField,
      sellPriceField: props.sellPriceField,
    };
  },
});
</script>

<style scoped>
.room-prices-table {
  width: 100%;
  color: var(--theme--foreground);
  font-size: 0.8125rem;
}
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--theme--foreground-subdued);
  gap: 1rem;
}
.error-notice {
  margin-bottom: 1rem;
}
.context-header {
  margin-bottom: 0.75rem;
}
.selector-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}
.selector-label {
  font-weight: 600;
  color: var(--theme--foreground-subdued);
  white-space: nowrap;
}
.save-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
}
.price-group {
  margin-bottom: 1rem;
  border-radius: var(--theme--border-radius);
  overflow: hidden;
  border: var(--theme--border-width) solid var(--theme--border-color);
}
.table-wrapper {
  overflow-x: auto;
}
.prices-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  table-layout: fixed;
}
col.col-label {
  width: 220px;
}
col.col-price-type {
  width: 110px;
}
col.col-price {
  width: 120px;
}
.prices-table th,
.prices-table td {
  border: var(--theme--border-width) solid var(--theme--border-color);
  padding: 0.5rem 0.75rem;
  vertical-align: middle;
}
.group-header-cell {
  background: var(--theme--background-subdued);
  cursor: pointer;
  user-select: none;
  width: 320px;
  min-width: 200px;
  text-align: left;
  transition: background var(--fast) var(--transition);
}
.group-header-cell:hover {
  background: color-mix(
    in srgb,
    var(--theme--background-subdued),
    var(--theme--foreground-subdued) 15%
  );
}
.group-header-inner {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.accordion-icon {
  color: var(--theme--primary);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.accordion-icon.is-expanded {
  transform: rotate(180deg);
}
.group-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--theme--primary);
  white-space: nowrap;
}
.column-header {
  background: var(--theme--background-subdued);
  color: var(--theme--primary);
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  min-width: 100px;
  white-space: nowrap;
}
.sticky-col {
  position: sticky;
  left: 0;
}
.row-label {
  background: var(--theme--background-normal);
  text-align: left;
  font-weight: 500;
  width: 220px;
  min-width: 160px;
}
.row-label-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.date-range {
  color: var(--theme--foreground-accent);
  font-weight: 400;
  font-size: 0.75rem;
}
.date-name {
  color: var(--theme--foreground-accent);
  font-weight: 600;
  font-size: 0.75rem;
}
.label-col {
  background: var(--theme--banner--title--foreground);
  text-align: left;
  width: 110px;
  min-width: 100px;
}
.price-labels {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.input-label {
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}
.buy-label {
  color: var(--theme--foreground);
}
.sell-label {
  color: var(--theme--foreground-subdued);
}
.price-cell {
  background: var(--theme--background-normal);
  padding: 0.5rem !important;
  min-width: 100px;
}
.price-cell.has-changes {
  background: var(--theme--warning-background);
  border-color: var(--theme--warning);
}
.price-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.cell-input {
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: var(--theme--border-width) solid var(--theme--border-color);
  border-radius: var(--theme--border-radius);
  background: var(--theme--banner--title--foreground);
  color: var(--theme--foreground);
  font-size: 0.8125rem;
  text-align: center;
  transition: border-color var(--fast) var(--transition);
}
.cell-input:hover:not(:disabled) {
  border-color: var(--theme--primary);
}
.cell-input:focus {
  outline: none;
  border-color: var(--theme--primary);
  box-shadow: 0 0 0 2px var(--theme--primary-background);
}
.cell-input:disabled {
  background: var(--theme--background-subdued);
  color: var(--theme--foreground-subdued);
  opacity: 0.7;
}
.price-display {
  display: block;
  min-height: 1.125rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--theme--foreground-subdued);
}
.empty-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--theme--foreground-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background-subdued);
}
.empty-icon {
  color: var(--theme--foreground-subdued);
  opacity: 0.5;
}
.empty-title {
  margin: 0.75rem 0 0.375rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--theme--foreground);
}
.empty-hint {
  margin: 0;
  font-size: 0.875rem;
}
.button-bottom {
  margin-top: 1rem;
  margin-bottom: 0;
}
.button-top {
  margin-top: 0;
  margin-bottom: 1rem;
}
.row-cascade-enter-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
  transition-delay: calc(var(--row-index) * 30ms);
}
.row-cascade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.row-cascade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.row-cascade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
.from-price-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.1em;
  white-space: nowrap;
}
.from-price-icon {
  color: var(--theme--primary);
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
