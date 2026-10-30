import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

export interface PickerOption {
  value: string;
  label: string;
  hint?: string;
}

export interface PickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  selectedLabel?: string;
  onSelectLabel?: (label: string) => void;
}

export function Picker({
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
  onSelectLabel,
  selectedLabel,
}: PickerProps & {
  options: PickerOption[];
  isLoading: boolean;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();
  const [chosen, setChosen] = useState<PickerOption>();
  const selected =
    options.find((option) => option.value === value) ??
    (chosen?.value === value ? chosen : undefined);

  return (
    <div className="space-y-1">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            id={id}
            aria-label={label}
            aria-expanded={open}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? id + "-error" : undefined}
            disabled={disabled}
            className="h-11 w-full justify-between font-normal"
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected?.label ??
                (value ? selectedLabel : undefined) ??
                placeholder ??
                t("common.actions.select")}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
                      setChosen(option);
                      onSelectLabel?.(option.label);
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
      {error ? (
        <p id={id + "-error"} className="text-xs text-st-danger-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
