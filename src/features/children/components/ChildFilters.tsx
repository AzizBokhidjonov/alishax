import { useTranslation } from "react-i18next";
import { HeartPulse, Wallet } from "lucide-react";
import { FilterBar, FilterToggle, SearchField } from "@/components/common/FilterBar";
import { SelectField } from "@/components/common/SelectField";
import { useGroupOptions } from "@/features/groups/api";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";

/**
 * Filtr panelidagi tanlov maydonlarining kengligi. Ilgari bitta panelda
 * `w-[180px]` va `w-[170px]` yonma-yon turardi.
 */
const FILTER_SELECT_WIDTH = "w-56";

interface ChildFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  filters: Record<string, string>;
  onFilterChange: (name: string, value: string) => void;
  activeCount: number;
  onReset: () => void;
}

/**
 * Bolalar ro'yxatining filtrlari.
 *
 * Holat bu yerdan olib tashlandi — u endi jadval ustidagi tablarda. Sabab:
 * holat bo'yicha ajratish eng ko'p ishlatiladigan amal va u tanlov
 * ro'yxatining ichida yashiringan edi; qolgan filtrlar esa kamroq kerak
 * bo'ladi va shu yerda qolgani ma'qul.
 */
export function ChildFilters({
  query,
  onQueryChange,
  filters,
  onFilterChange,
  activeCount,
  onReset,
}: ChildFiltersProps) {
  const { t } = useTranslation();
  const groups = useGroupOptions();
  const { can } = usePermissions();

  return (
    <FilterBar activeCount={activeCount} onReset={onReset}>
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder={t("children.searchPlaceholder")}
      />

      <SelectField
        label={t("children.filters.group")}
        value={filters.groupId ?? "all"}
        onChange={(value) => onFilterChange("groupId", value)}
        options={groups}
        allOption
        triggerClassName={FILTER_SELECT_WIDTH}
      />

      <div className="flex flex-wrap items-end gap-2 self-end">
        {can(P.debtRead) ? (
          <FilterToggle
            icon={Wallet}
            checked={filters.hasDebt === "true"}
            onCheckedChange={(checked) => onFilterChange("hasDebt", checked ? "true" : "")}
          >
            {t("children.filters.hasDebt")}
          </FilterToggle>
        ) : null}
        {can(P.medicalAlerts) ? (
          <FilterToggle
            icon={HeartPulse}
            checked={filters.hasMedicalAlert === "true"}
            onCheckedChange={(checked) => onFilterChange("hasMedicalAlert", checked ? "true" : "")}
          >
            {t("children.filters.hasMedicalAlert")}
          </FilterToggle>
        ) : null}
      </div>
    </FilterBar>
  );
}
