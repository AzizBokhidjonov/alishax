import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
import { childrenApi, guardiansApi } from "@/api";
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
export function ChildPicker(props: PickerProps & { groupId?: string }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query);
  const params = useMemo(
    () => ({ q: debounced.trim() || undefined, groupId: props.groupId, limit: 20 }),
    [debounced, props.groupId],
  );

  const { data, isLoading } = useQuery({
    queryKey: qk.children(params),
    queryFn: () => childrenApi.list(params),
  });

  const options = (data?.data ?? []).map((child) => ({
    value: child.id,
    label: `${child.lastName} ${child.firstName}`,
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
