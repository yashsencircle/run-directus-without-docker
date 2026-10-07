import { defineInterface } from "@directus/extensions-sdk";
import type { DeepPartial, Field, Condition } from "@directus/types";
import InterfaceComponent from "./interface.vue";

/**
 * Extension definition for the Price Table interface.
 *
 * Declares the interface to Directus under the id `price-table` and configures
 * the full set of admin-configurable options: labels, layout, mode, collections,
 * relationships, formulas, and currency settings. The options list dynamically
 * shows, hides, or requires settings based on the selected mode (junction vs.
 * direct) so a misconfiguration surfaces immediately instead of failing at
 * runtime. Points the interface at the `InterfaceComponent` Vue file that
 * renders the table.
 */
export default defineInterface({
  id: "price-table",
  name: "Price Table",
  icon: "table_chart",
  description:
    "Display and edit prices in a grouped table format. Fully configurable for hotels, cruises, yachts, or any similar product.",
  component: InterfaceComponent,
  options: () => {
    const hideWhenDirect: Condition[] = [
      { name: "Direct mode", rule: { mode: { _eq: "direct" } }, hidden: true },
    ];
    // Formula fields are meaningless in direct mode (sell prices are edited
    // directly on the price row there; no calculation ever runs), so only
    // require them when junction mode is selected.
    const requireWhenJunction: Condition[] = [
      {
        name: "Direct mode",
        rule: { mode: { _eq: "direct" } },
        hidden: true,
        required: false,
      },
      {
        name: "Junction mode",
        rule: { mode: { _eq: "junction" } },
        required: true,
      },
    ];

    const divider = (field: string, title: string, conditions?: Condition[]) => ({
      field,
      name: title,
      type: "alias" as const,
      meta: {
        width: "full",
        interface: "presentation-divider",
        options: { title, color: "var(--theme--primary)" },
        ...(conditions ? { conditions } : {}),
      },
    });

    return [
      // ─── General ─────────────────────────────────────────────────────────────
      divider("divider_general", "General"),
      {
        field: "label",
        type: "string",
        name: "$t:label",
        meta: {
          width: "full",
          interface: "system-input-translated-string",
          options: { placeholder: "$t:label" },
        },
      },
      {
        field: "buttonPosition",
        name: "Button Position",
        type: "string",
        meta: {
          width: "half",
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Top", value: "top" },
              { text: "Bottom", value: "bottom" },
            ],
          },
        },
      },
      // ─── Mode ────────────────────────────────────────────────────────────────
      {
        field: "mode",
        name: "Mode",
        type: "string",
        meta: {
          width: "half",
          interface: "select-dropdown",
          note: "Junction: prices are per language/market (hotels, cruises) — uses a junction collection and translations table. Direct: prices live on one flat collection with no language concept (e.g. cars).",
          options: {
            choices: [
              {
                text: "Junction Table (With Translations) (hotels, cruises etc)",
                value: "junction",
              },
              { text: "Direct Table (Without Translations)", value: "direct" },
            ],
          },
        },
      },

      // ─── Table Layout ────────────────────────────────────────────────────────
      divider("divider_layout", "Table Layout"),
      {
        field: "fromPriceSymbol",
        name: "From Price Icon",
        type: "string",
        meta: {
          width: "half",
          interface: "select-icon",
          note: "Icon shown next to any item (occupancy, room category, price date) marked as a 'from price'. Pick any Material icon.",
        },
      },
      {
        field: "groupFromPriceField",
        name: "Category From-Price Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the group-by collection that marks a room category as a 'from price' (e.g. price_start). Leave empty to disable the from-price indicator on category headers.",
          options: { placeholder: "e.g. price_start" },
        },
      },
      {
        field: "occupancyFromPriceField",
        name: "Occupancy From-Price Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the occupancy record that marks it as a 'from price' column (e.g. from_price). Leave empty to disable the from-price indicator on column headers.",
          options: { placeholder: "e.g. from_price" },
        },
      },
      {
        field: "rowFromPriceField",
        name: "Date (Row) From-Price Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the row collection that marks a price date as a 'from price' row (e.g. from_price). Leave empty to disable the from-price indicator on row labels.",
          options: { placeholder: "e.g. from_price" },
        },
      },
      {
        field: "groupSharedIdField",
        name: "Category Shared Id Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Group By Collection linking a per-weekday child category back to its parent (hotels: 'sharedId'). Leave empty for a collection with no such concept — e.g. tours_categories — this field's presence is what enables weekday-splitting support at all; leaving it unset skips that fetch entirely instead of requesting a field that doesn't exist.",
          options: { placeholder: "e.g. sharedId" },
        },
      },
      {
        field: "groupChildWeekdaysField",
        name: "Category Child Weekdays Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the parent category holding its per-weekday repeater entries (hotels: 'days_repeater'). Only read when Category Shared Id Field is also set.",
          options: { placeholder: "e.g. days_repeater" },
        },
      },
      {
        field: "groupSortField",
        name: "Category (Group) Sort Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the group-by collection used to sort room categories in the table. e.g. 'sort' for a manual sort integer. Leave empty to use the parent record's category order array.",
          options: { placeholder: "e.g. sort" },
        },
      },
      {
        field: "groupLabelField",
        name: "Category Label Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field (dot-path into a relation allowed) on the Group By Collection used as the category display name, e.g. room_category.name or just name. Update this here if the underlying name field ever changes — no extension release needed.",
          options: { placeholder: "e.g. room_category.name" },
        },
      },
      {
        field: "groupLabelTranslationField",
        name: "Category Label Translation Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Group By Collection's translations used as a language-specific label addition (optional fallback, used when the main label is empty).",
          options: { placeholder: "e.g. room_category_additions" },
        },
      },
      {
        field: "occupancySortField",
        name: "Occupancy (Column) Sort Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field used to sort columns left-to-right. Checked on the occupancy junction row first (e.g. a manual 'sort' integer — this is what a drag-reorder in the M2M/occupancy selector writes, per-parent), falling back to the original occupancy record (e.g. 'value', a number of guests shared across every parent). Use 'sort' for manual per-record ordering — but that only works once each record's occupancies have actually been drag-reordered at least once; until then the field is empty for every row and the sort has no effect.",
          options: { placeholder: "e.g. value" },
        },
      },
      {
        field: "occupancyLabelField",
        name: "Occupancy Label Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the occupancy record used as the column display label. Update this here if the underlying name field ever changes — no extension release needed.",
          options: { placeholder: "e.g. name" },
        },
      },
      {
        field: "occupancyLabelFallbackMinField",
        name: "Occupancy Label Fallback: Min Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Optional. When the Occupancy Label Field is empty on a given row, compose a 'min-max' (or 'min+' when max is 999 or more) label from these fields instead of falling back to the raw row id. Leave empty to keep the old raw-id fallback (e.g. hotels, tours, cruises).",
          options: { placeholder: "e.g. rental_period_min" },
        },
      },
      {
        field: "occupancyLabelFallbackMaxField",
        name: "Occupancy Label Fallback: Max Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Optional, only used when Occupancy Label Fallback: Min Field is also set.",
          options: { placeholder: "e.g. rental_period_max" },
        },
      },
      {
        field: "occupancyLabelFallbackCategoryField",
        name: "Occupancy Label Fallback: Category Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Optional (dot-path into a relation allowed). Appended after the min-max range in the fallback label, e.g. 'rental_period_depot_category.name' → '7-13 Airport'. Only used when the Min Field above is also set.",
          options: { placeholder: "e.g. rental_period_depot_category.name" },
        },
      },
      {
        field: "rowSortField",
        name: "Date (Row) Sort Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the row collection used to sort rows top-to-bottom. e.g. 'start_date' for chronological order or 'sort' for a manual sort integer.",
          options: { placeholder: "e.g. start_date" },
        },
      },
      {
        field: "rowLabelField",
        name: "Row Label Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Row Collection used as the row display label (e.g. a custom date-range name). Update this here if the underlying name field ever changes — no extension release needed.",
          options: { placeholder: "e.g. name" },
        },
      },
      {
        field: "rowStartDateField",
        name: "Row Start Date Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Row Collection holding the range start date, used for the date-range fallback label shown under the row name. e.g. 'start_date' for hotels, 'price_period_start' for tours.",
          options: { placeholder: "e.g. start_date" },
        },
      },
      {
        field: "rowEndDateField",
        name: "Row End Date Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Row Collection holding the range end date. e.g. 'end_date' for hotels, 'price_period_end' for tours.",
          options: { placeholder: "e.g. end_date" },
        },
      },
      {
        field: "groupByField",
        name: "Group By Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field name on the price record used to group rows into sections. e.g. room_category_id for hotels, cruise_room_category_id for cruises.",
          options: { placeholder: "e.g. room_category_id" },
        },
      },
      {
        field: "rowField",
        name: "Row Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field name on the price record used for each row inside a group. e.g. price_date_id for hotels, cruise_price_date_id for cruises.",
          options: { placeholder: "e.g. price_date_id" },
        },
      },
      {
        field: "columnField",
        name: "Column Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field name on the price record used for each column. Typically room_occupancy_id for both hotels and cruises.",
          options: { placeholder: "e.g. room_occupancy_id" },
        },
      },
      // ─── Labels ──────────────────────────────────────────────────────────────
      divider("divider_labels", "Labels"),
      {
        field: "buyLabel",
        name: "Buy Price Label",
        type: "string",
        meta: {
          width: "half",
          interface: "system-input-translated-string",
          options: { placeholder: "e.g. Buy" },
        },
      },
      {
        field: "sellLabel",
        name: "Sell Price Label",
        type: "string",
        meta: {
          width: "half",
          interface: "system-input-translated-string",
          options: { placeholder: "e.g. Sell" },
        },
      },
      {
        field: "emptyStateTitle",
        name: "Empty State Title",
        type: "string",
        meta: {
          width: "half",
          interface: "system-input-translated-string",
          note: "Heading shown when there are no prices to display. Supports $t: translation keys.",
          options: { placeholder: "e.g. No prices configured yet" },
        },
      },
      {
        field: "emptyStateHint",
        name: "Empty State Hint",
        type: "string",
        meta: {
          width: "half",
          interface: "system-input-translated-string",
          note: "Subtext shown below the empty state heading. Supports $t: translation keys.",
          options: { placeholder: "e.g. Add price dates, categories, and occupancies to see them here." },
        },
      },

      // ─── Sell Price Calculation ──────────────────────────────────────────────
      // Junction mode: the sell price is computed in the browser by the
      // interface's own `calculateSellPrices` (see `usePriceTableData`),
      // driven entirely by the two formula fields below.
      divider("divider_formula", "Calculation Formula (Junction Mode)", [
        { name: "Direct mode", rule: { mode: { _eq: "direct" } }, hidden: true },
      ]),
      {
        field: "buyPriceTypeField",
        name: "Buy Price Type Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Junction Collection (settings row) storing whether the buy price is 'net' or 'gross'.",
          options: { placeholder: "e.g. buy_price_type" },
        },
      },
      {
        field: "sellPriceTypeField",
        name: "Sell Price Type Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Junction Collection (settings row) storing whether the sell price is 'net' or 'gross'.",
          options: { placeholder: "e.g. sell_price_type" },
        },
      },
      {
        field: "percentageTypeField",
        name: "Percentage Type Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Junction Collection (settings row) storing 'net'/'gross' for how margin/provision are applied.",
          options: { placeholder: "e.g. percentage_type" },
        },
      },
      {
        field: "marginField",
        name: "Margin Percentage Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Junction Collection (settings row) storing the margin percentage.",
          options: { placeholder: "e.g. margin_percentage" },
        },
      },
      {
        field: "provisionField",
        name: "Provision Percentage Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the Junction Collection (settings row) storing the provision percentage.",
          options: { placeholder: "e.g. provision_percentage" },
        },
      },
      {
        field: "occupancyValueField",
        name: "Occupancy Value Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the occupancy record storing its numeric value (e.g. guest count) — drives BOTH the '[value]' shown next to each column header AND the formula's occupancy value when buy/sell price types differ. Defaults to 'value' if left empty. Use a different field for a collection with no bare 'value' column (e.g. vehicles: 'rental_period_min').",
          options: { placeholder: "e.g. value" },
        },
      },
      {
        field: "roundHalfLogic",
        name: "Round Half Logic",
        type: "text",
        meta: {
          width: "full",
          interface: "input-code",
          options: { language: "javascript", lineNumber: true },
          note: "Required to enable sell-price calculation (junction or direct mode). Define a function named exactly roundHalf(val). Applies to every hotel/record using this field configuration. There is no built-in fallback — this must be provided.",
        },
      },
      {
        field: "calculateSellPriceLogic",
        name: "Calculate Sell Price Logic",
        type: "text",
        meta: {
          width: "full",
          interface: "input-code",
          options: { language: "javascript", lineNumber: true },
          note: "Required to enable sell-price calculation (junction or direct mode). Define a function named exactly calculateSellPrice(buyPrice, settingsRow, priceRow, rateValue, occupancyValue). In direct mode settingsRow is the parent record itself. Applies to every hotel/record using this field configuration. There is no built-in fallback — this must be provided.",
        },
      },

      // ─── Related Collection (Prices) ─────────────────────────────────────────
      divider("divider_related", "Related Collection (Prices)"),
      {
        field: "relatedCollection",
        name: "Related Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The collection that holds the price records to display in the table. For hotels this is 'room_prices'. For cruises or yachts, create a similar collection and enter its name here.",
          options: { placeholder: "e.g. room_prices" },
        },
      },
      {
        field: "foreignKeyField",
        name: "Foreign Key Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Related Collection that stores the ID linking each price back to its parent record. For hotels it is 'hotel_id'. For cruises it would be 'cruise_id'. For yachts 'yacht_id'.",
          options: { placeholder: "e.g. hotel_id" },
        },
      },
      {
        field: "buyPriceField",
        name: "Buy Price Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field name in the Related Collection that stores the buy/purchase price. This is the raw cost price before any margin or exchange rate is applied.",
          options: { placeholder: "e.g. buy_price" },
        },
      },
      {
        field: "sellPriceField",
        name: "Sell Price Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field that holds the sell price value. In junction mode: field on the Translations Collection. In direct mode: field directly on the price record.",
          options: { placeholder: "e.g. sell_price" },
        },
      },

      // ─── Parent Record ───────────────────────────────────────────────────────
      divider("divider_parent", "Parent Record"),
      {
        field: "parentCollection",
        name: "Parent Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The main product collection this interface belongs to. For hotels enter 'hotels', for cruises 'cruises', for yachts 'yachts'. Used to fetch occupancies, category order, and sell price status.",
          options: { placeholder: "e.g. hotels" },
        },
      },
      {
        field: "parentKeyField",
        name: "Parent Key Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Only needed when this interface is placed on a junction/translation collection instead of the parent directly. Enter the field name on the junction that holds the parent record ID. Example: placed on 'hotels_translations_1' → enter 'hotels_id'. Placed on 'cruises_translations_1' → enter 'cruises_id'. Leave empty if placed directly on the parent collection.",
          options: {
            placeholder:
              "e.g. hotels_id — leave empty if on parent collection directly",
          },
        },
      },
      {
        field: "groupByCollection",
        name: "Group By Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The collection used to fetch group labels for the table. Matches the Group By Field — if grouping by room_category_id, this should be 'room_categories'. For cruises grouping by cabin_category_id, enter 'cabin_categories'.",
          options: { placeholder: "e.g. room_categories" },
        },
      },
      {
        field: "rowCollection",
        name: "Row Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The collection used to fetch row labels for the table. Matches the Row Field — if rows are price_date_id, this should be 'price_dates'. For cruises with departure_date_id rows, enter 'departure_dates'.",
          options: { placeholder: "e.g. price_dates" },
        },
      },
      {
        field: "occupanciesField",
        name: "Occupancies Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the Parent Collection that holds the list of occupancy options (e.g. single, double, triple). These become the columns in the price table. For hotels this is 'room_occupancies'.",
          options: { placeholder: "e.g. room_occupancies" },
        },
      },
      {
        field: "occupancySourceMode",
        name: "Occupancy Source Mode",
        type: "string",
        meta: {
          width: "half",
          interface: "select-dropdown",
          note: "Where column occupancies are loaded from. Use Junction Collection when the price record stores the M2M junction row ID, e.g. room_prices.room_occupancy_id = hotels_occupancies.id.",
          options: {
            choices: [
              {
                text: "Auto (Junction first, parent field fallback)",
                value: "auto",
              },
              { text: "Parent Field Array", value: "parent_field" },
              { text: "Junction Collection", value: "junction" },
            ],
          },
        },
      },
      {
        field: "occupancyJunctionCollection",
        name: "Occupancy Junction Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "M2M junction collection that stores the selected occupancies for the parent. For hotels this is 'hotels_occupancies'.",
          options: { placeholder: "e.g. hotels_occupancies" },
        },
      },
      {
        field: "occupancyJunctionPrimaryKeyField",
        name: "Occupancy Junction Primary Key Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Primary key field on the occupancy junction collection. This is the value stored in the price table column field. For hotels_occupancies this is 'id'.",
          options: { placeholder: "e.g. id" },
        },
      },
      {
        field: "occupancyJunctionParentField",
        name: "Occupancy Junction Parent Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the occupancy junction collection that points back to the parent record. For hotels_occupancies this is 'hotels_id'.",
          options: { placeholder: "e.g. hotels_id" },
        },
      },
      {
        field: "occupancyJunctionRelatedField",
        name: "Occupancy Junction Related Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the occupancy junction collection that points to the original occupancy collection. For hotels_occupancies this is 'occupancies_id'.",
          options: { placeholder: "e.g. occupancies_id" },
        },
      },
      {
        field: "occupancyIdField",
        name: "Occupancy Id Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Dot-path into the occupancy junction row for the value the price record's occupancy foreign key actually stores. Use 'id' if the FK references the junction row itself (hotels: room_prices.room_occupancy_id → hotels_occupancies.id). Use a dot-path through the Occupancy Junction Related Field if it references the original occupancy record instead (tours: tours_prices.occupancy_id → tours_occupancies.id → enter 'tours_occupancies_id.id').",
          options: { placeholder: "e.g. id or tours_occupancies_id.id" },
        },
      },
      {
        field: "occupancyCollection",
        name: "Original Occupancy Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Original collection that stores occupancy labels and values. Used as a fallback if the junction relation is returned as an ID instead of an object. For hotels this is 'occupancies'.",
          options: { placeholder: "e.g. occupancies" },
        },
      },
      {
        field: "categoryOrderField",
        name: "Category Order Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the Parent Collection that defines the display order of categories (groups) in the table. For hotels this is 'room_categories'. Leave empty to use default ordering.",
          options: { placeholder: "e.g. room_categories" },
        },
      },
      {
        field: "sellStatusField",
        name: "Sell Price Status Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the Parent Collection that tracks the status of the sell price calculation job (e.g. idle, processing, done, failed). Used to poll and refresh the table after the flow completes.",
          options: { placeholder: "e.g. sell_prices_status" },
        },
      },
      {
        field: "sellUpdatedAtField",
        name: "Sell Price Updated At Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the Parent Collection that stores the timestamp of the last successful sell price calculation. Used to detect when a new calculation has completed.",
          options: { placeholder: "e.g. sell_prices_updated_at" },
        },
      },

      // ─── Junction / Translation Collection ───────────────────────────────────
      divider(
        "divider_junction",
        "Junction / Translation Collection",
        hideWhenDirect,
      ),
      {
        field: "junctionCollection",
        name: "Junction Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The junction/translation collection that links the parent to a language or market. For hotels this is 'hotels_translations_1'. For cruises it would be 'cruises_translations_1'. Used to fetch available languages for the selector when placed on the parent collection.",
          options: { placeholder: "e.g. hotels_translations_1" },
          conditions: hideWhenDirect,
        },
      },
      {
        field: "junctionParentKeyField",
        name: "Junction → Parent Key Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Junction Collection that links back to the parent record. For 'hotels_translations_1' this is 'hotels_id'. For 'cruises_translations_1' it would be 'cruises_id'.",
          options: { placeholder: "e.g. hotels_id" },
          conditions: hideWhenDirect,
        },
      },
      {
        field: "junctionLanguageField",
        name: "Junction → Language Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Junction Collection that stores the language or market ID. Typically 'translations_id'. Used to filter sell prices per language.",
          options: { placeholder: "e.g. translations_id" },
          conditions: hideWhenDirect,
        },
      },
      {
        field: "junctionExchangeRateField",
        name: "Junction → Exchange Rate Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Junction Collection that stores the exchange rate reference for this market. Used to determine the buy and sell currency symbols displayed in the table header.",
          options: { placeholder: "e.g. exchange_rate" },
        },
      },
      {
        field: "languageNameField",
        name: "Language Name Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Field on the language/market record (Junction → Language Field relation) used as its display name in the language selector dropdown.",
          options: { placeholder: "e.g. name" },
          conditions: hideWhenDirect,
        },
      },

      // ─── Translations Collection (Sell Prices) ───────────────────────────────
      divider(
        "divider_translations",
        "Translations Collection (Sell Prices)",
        hideWhenDirect,
      ),
      {
        field: "translationsCollection",
        name: "Translations Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The collection that stores per-language sell prices for each price record. For hotels this is 'room_prices_translations'. For cruises it would be 'cruise_prices_translations'.",
          options: { placeholder: "e.g. room_prices_translations" },
          conditions: hideWhenDirect,
        },
      },
      {
        field: "translationsFKField",
        name: "Translations → Price FK Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Translations Collection that links each sell price record back to its parent price record in the Related Collection. For 'room_prices_translations' this is 'room_prices_id'.",
          options: { placeholder: "e.g. room_prices_id" },
          conditions: hideWhenDirect,
        },
      },
      {
        field: "translationsLanguageField",
        name: "Translations → Language Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field inside the Translations Collection that stores the language or market ID. Used to filter sell prices for the currently selected language. Typically 'translations_id'.",
          options: { placeholder: "e.g. translations_id" },
          conditions: hideWhenDirect,
        },
      },

      // ─── Currency ─────────────────────────────────────────────────────────────
      // Buy & sell prices are always displayed and saved to 2 decimal
      // places (see `PRICE_PRECISION` in `priceTableCore`) — not
      // configurable, so there's no field for it here.
      divider("divider_currency", "Currency"),
      {
        field: "defaultBuyCurrencySymbol",
        name: "Buy Currency Symbol",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Symbol shown in the buy price column header. In junction mode this is a fallback; in direct mode it is always used.",
          options: { placeholder: "e.g. €" },
        },
      },
      {
        field: "defaultSellCurrencySymbol",
        name: "Sell Currency Symbol",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "Symbol shown in the sell price column header. In junction mode this is a fallback; in direct mode it is always used.",
          options: { placeholder: "e.g. $" },
        },
      },
      {
        field: "ratesCollection",
        name: "Rates Collection",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The collection that stores exchange rate records. Used to resolve and display currency symbols in the table header.",
          options: { placeholder: "e.g. rates" },
          conditions: hideWhenDirect,
        },
      },
      {
        field: "fromCurrencyField",
        name: "Rate → From Currency Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the rate record that references the source (buy) currency.",
          options: { placeholder: "e.g. from_currency" },
          conditions: hideWhenDirect,
        },
      },
      {
        field: "toCurrencyField",
        name: "Rate → To Currency Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on the rate record that references the target (sell) currency.",
          options: { placeholder: "e.g. to_currency" },
          conditions: hideWhenDirect,
        },
      },
      {
        field: "currencySymbolField",
        name: "Currency → Symbol Field",
        type: "string",
        meta: {
          width: "half",
          interface: "input",
          note: "The field on each currency record that holds the display symbol (e.g. €, $, £).",
          options: { placeholder: "e.g. symbol" },
          conditions: hideWhenDirect,
        },
      },
    ] as DeepPartial<Field>[];
  },
  types: ["alias"],
  localTypes: ["presentation"],
  group: "other",
  relational: false,
});
