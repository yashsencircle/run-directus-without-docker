import type { Ref } from "vue";

/*
 * A raw Directus item. Field names are entirely configurable per field
 * instance (this same interface serves hotels, tours, cruises, or any
 * future collection), so the honest static shape of a row is a dynamic
 * record, not a fixed interface — `any` here documents "arbitrary
 * Directus-item shape", not "unchecked/unknown value".
 */
export type DirectusItem = Record<string, any>;

// One group bucket in the grid: the price rows belonging to it plus the
// full set of row-dates (every group shares the same row-date list).
export interface GroupBucket {
  items: DirectusItem[];
  rows: DirectusItem[];
}

// Every admin-configurable option this interface's Vue component accepts
// (see the `props: {...}` block in `interface.vue`) — shared so the
// composables and grid computeds below don't each re-widen `props` to `any`.
export interface PriceTableProps {
  mode?: string;
  value?: DirectusItem[];
  label?: string;
  buttonPosition?: string;
  primaryKey?: string | number | null;
  collection?: string;
  field?: string;
  groupByField?: string;
  rowField?: string;
  columnField?: string;
  disabled?: boolean;
  values?: DirectusItem;
  buyPriceTypeField?: string;
  sellPriceTypeField?: string;
  percentageTypeField?: string;
  marginField?: string;
  provisionField?: string;
  occupancyValueField?: string;
  roundHalfLogic?: string;
  calculateSellPriceLogic?: string;
  relatedCollection?: string;
  foreignKeyField?: string;
  buyPriceField?: string;
  parentCollection?: string;
  parentKeyField?: string;
  occupanciesField?: string;
  occupancySourceMode?: string;
  occupancyJunctionCollection?: string;
  occupancyJunctionPrimaryKeyField?: string;
  occupancyJunctionParentField?: string;
  occupancyJunctionRelatedField?: string;
  occupancyIdField?: string;
  occupancyCollection?: string;
  categoryOrderField?: string;
  groupByCollection?: string;
  groupSharedIdField?: string;
  groupChildWeekdaysField?: string;
  rowCollection?: string;
  sellStatusField?: string;
  sellUpdatedAtField?: string;
  junctionCollection?: string;
  junctionParentKeyField?: string;
  junctionLanguageField?: string;
  junctionExchangeRateField?: string;
  translationsCollection?: string;
  translationsFKField?: string;
  translationsLanguageField?: string;
  sellPriceField?: string;
  ratesCollection?: string;
  fromCurrencyField?: string;
  toCurrencyField?: string;
  currencySymbolField?: string;
  defaultBuyCurrencySymbol?: string;
  defaultSellCurrencySymbol?: string;
  fromPriceSymbol?: string;
  groupFromPriceField?: string;
  occupancyFromPriceField?: string;
  rowFromPriceField?: string;
  occupancySortField?: string;
  rowSortField?: string;
  groupSortField?: string;
  groupLabelField?: string;
  groupLabelTranslationField?: string;
  occupancyLabelField?: string;
  occupancyLabelFallbackMinField?: string;
  occupancyLabelFallbackMaxField?: string;
  occupancyLabelFallbackCategoryField?: string;
  rowLabelField?: string;
  rowStartDateField?: string;
  rowEndDateField?: string;
  languageNameField?: string;
  emptyStateTitle?: string;
  emptyStateHint?: string;
  buyLabel?: string;
  sellLabel?: string;
}

export interface OccupancyConfig {
  occupancyJunctionRelatedField?: string;
  occupancyIdField?: string;
  occupancyLabelField?: string;
  occupancyFromPriceField?: string;
  occupancyValueField?: string;
  occupancySortField?: string;
  occupancyLabelFallbackMinField?: string;
  occupancyLabelFallbackMaxField?: string;
  occupancyLabelFallbackCategoryField?: string;
}

export interface GroupConfig {
  groupLabelField?: string;
  groupLabelTranslationField?: string;
  groupSharedIdField?: string;
  groupFromPriceField?: string;
  groupSortField?: string;
}

export interface LegSnapshot {
  categories: Set<string>;
  dates: Set<string>;
  occupancies: Set<string>;
}

export interface LookupCollections {
  categories: Map<string, DirectusItem>;
  dates: Map<string, DirectusItem>;
  occupancies: Map<string, DirectusItem>;
}

export interface AvailableTranslation {
  text: string;
  value: string | number;
  exchange_rate: DirectusItem | null | undefined;
  lang_id: string | number | null | undefined;
}

export interface PriceTableDataOptions {
  props: PriceTableProps;
  api: import("axios").AxiosInstance;
  logPrefix: string;
  isJunction: () => boolean;
  parent_id: Ref<string | null>;
  translations_id: Ref<string | null>;
  items: Ref<DirectusItem[]>;
  originalItems: Ref<DirectusItem[]>;
  hasChanges: Ref<boolean>;
  unpersistedCells: Ref<Map<string, DirectusItem>>;
  lookupData: Ref<LookupCollections>;
  parentRecord: Ref<DirectusItem | null>;
  buyCurrencySymbol: Ref<string>;
  sellCurrencySymbol: Ref<string>;
  roomCategoryOrder: Ref<string[]>;
  sellPricesStatus: Ref<string | null>;
  sellPricesUpdatedAt: Ref<string | null>;
  availableTranslations: Ref<AvailableTranslation[]>;
  selectedTranslationId: Ref<string | number | null>;
  errorMessage: Ref<string>;
  loading: Ref<boolean>;
  saving: Ref<boolean>;
  calculatingSellPrices: Ref<boolean>;
}
