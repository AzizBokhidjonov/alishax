import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
import { childDisplayName, guardiansApi, lookupsApi, type LookupPermission } from "@/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { qk } from "@/lib/query";
import { cn } from "@/lib/utils";

interface PickerOption {
  value: string;
  label: string;
  hint?: string;
}

interface PickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

function Picker({
  label,
  value,
  onChange,
  options,
  isLoading,
  query,
  onQueryChange,
  placeholder,
  error,
  disabled,
}: PickerProps & {
  options: PickerOption[];
  isLoading: boolean;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className="space-y-1">
      {label ? <Label>{label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="h-11 w-full justify-between font-normal"
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected?.label ?? placeholder ?? t("common.actions.select")}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={onQueryChange}
              placeholder={t("common.actions.search")}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? t("common.state.loading") : t("common.table.empty")}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        option.value === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="ml-auto text-xs text-muted-foreground">{option.hint}</span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error ? <p className="text-xs text-st-danger-fg">{error}</p> : null}
    </div>
  );
}

/** Bolani qidirib tanlash — ro'yxat serverda filtrlanadi. */
/**
 * Bolani qidirib tanlash.
 *
 * `permission` berilsa, ro'yxat `/lookups/children` dan AMALNING huquqi
 * ostida o'qiladi va faqat id bilan ism qaytadi. Bu muhim: ilgari har
 * qanday tanlagich to'liq katalogni (`/children`) o'qirdi va bu xodimdan
 * `child:read` talab qilardi — masalan olib ketishni rasmiylashtiradigan
 * qabulxona uchun ortiqcha huquq (Handbook, 2026-10-04).
 *
 * Standart `child:read`: reyestr ekranlarida xatti-harakat o'zgarmaydi.
 */
export function ChildPicker({
  permission = "child:read",
  ...props
}: PickerProps & { groupId?: string; permission?: LookupPermission }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query);
  const params = useMemo(
    () => ({
      permission,
      q: debounced.trim() || undefined,
      groupId: props.groupId,
      limit: 20,
    }),
    [debounced, permission, props.groupId],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["lookups", "children", params],
    queryFn: () => lookupsApi.children(params),
  });

  const options = (data?.data ?? []).map((child) => ({
    value: child.id,
    label: childDisplayName(child) || child.id,
    hint: child.groupName,
  }));

  return (
    <Picker
      {...props}
      options={options}
      isLoading={isLoading}
      query={query}
      onQueryChange={setQuery}
    />
  );
}

/** Ota-onani qidirib tanlash. */
/**
 * To'lovchi vasiy — FAQAT tanlangan bolaga bog'langanlar.
 *
 * Nega `GuardianPicker` yaramaydi: u butun vasiylar katalogini o'qiydi,
 * ya'ni boshqa bolaning ota-onasini to'lovchi qilib qo'yish mumkin edi va
 * xodimdan butun bog'cha bo'yicha `guardian:read` talab qilinardi. Bu
 * tanlagich esa `/lookups/children/{id}/payers` dan o'qiydi: ro'yxat bolaga
 * bog'langan, huquq esa `payment:create` (Handbook, 2026-10-04).
 *
 * Bola tanlanmaguncha tanlagich YOPIQ va nima qilish kerakligini aytadi —
 * bo'sh ro'yxatni ko'rsatish «to'lovchi yo'q» degan noto'g'ri xulosa beradi.
 */
export function PayerPicker({ childId, ...props }: PickerProps & { childId?: string }) {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["lookups", "payers", childId],
    queryFn: () => lookupsApi.payers(childId as string),
    enabled: Boolean(childId),
  });

  const options = (data ?? []).map((payer) => ({ value: payer.id, label: payer.fullName }));

  return (
    <Picker
      {...props}
      disabled={props.disabled || !childId}
      placeholder={childId ? props.placeholder : t("payments.form.chooseChildFirst")}
      options={options}
      isLoading={isLoading}
      // Ro'yxat to'liq keladi — qidiruv serverga emas, shu ro'yxatga tegishli.
      query=""
      onQueryChange={() => undefined}
    />
  );
}

/**
 * Ruxsat BERADIGAN ota-ona/vasiy — faqat shu bolaga bog'langanlar.
 *
 * `permission` ANIQ yuboriladi va u amalga mos kelishi kerak: doimiy
 * olib ketuvchi uchun `pickup:manage`, vaqtinchalik ruxsat uchun
 * `pickup:temporary`. Umumiy DTO'ning standarti (`child:read`) bu
 * endpointda RAD ETILADI (Handbook, 2026-10-04).
 */
export function PickupGuardianPicker({
  childId,
  permission,
  ...props
}: PickerProps & {
  childId?: string;
  permission: "pickup:read" | "pickup:manage" | "pickup:temporary";
}) {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["lookups", "pickup-guardians", childId, permission],
    queryFn: () => lookupsApi.pickupGuardians(childId as string, permission),
    enabled: Boolean(childId),
  });

  const options = (data ?? []).map((guardian) => ({
    value: guardian.id,
    label: guardian.fullName,
    hint: guardian.phone,
  }));

  return (
    <Picker
      {...props}
      disabled={props.disabled || !childId}
      placeholder={childId ? props.placeholder : t("payments.form.chooseChildFirst")}
      options={options}
      isLoading={isLoading}
      /* Ro'yxat to'liq keladi — serverga qidiruv yuborilmaydi. */
      query=""
      onQueryChange={() => undefined}
    />
  );
}

export function GuardianPicker(props: PickerProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query);
  const params = useMemo(() => ({ q: debounced.trim() || undefined, limit: 20 }), [debounced]);

  const { data, isLoading } = useQuery({
    queryKey: qk.guardians(params),
    queryFn: () => guardiansApi.list(params),
  });

  const options = (data?.data ?? []).map((guardian) => ({
    value: guardian.id,
    label: guardian.fullName,
    hint: guardian.phone,
  }));

  return (
    <Picker
      {...props}
      options={options}
      isLoading={isLoading}
      query={query}
      onQueryChange={setQuery}
    />
  );
}
