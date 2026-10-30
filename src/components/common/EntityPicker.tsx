import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { childDisplayName, guardiansApi, lookupsApi, type LookupPermission } from "@/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { qk } from "@/lib/query";
import { Picker, type PickerProps } from "./EntityCombobox";

export function ChildPicker({
  permission = "child:read",
  ...props
}: PickerProps & { groupId?: string; permission?: LookupPermission }) {
  const { t } = useTranslation();
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
    label: childDisplayName(child) || t("flows.unknownName"),
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

export function PayerPicker({ childId, ...props }: PickerProps & { childId?: string }) {
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["lookups", "payers", childId],
    queryFn: () => lookupsApi.payers(childId as string),
    enabled: Boolean(childId),
  });

  const options = (data ?? [])
    .filter((payer) => payer.fullName.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .map((payer) => ({ value: payer.id, label: payer.fullName }));

  return (
    <Picker
      {...props}
      disabled={props.disabled || !childId}
      placeholder={childId ? props.placeholder : t("payments.form.chooseChildFirst")}
      options={options}
      isLoading={isLoading}
      // Ro'yxat to'liq keladi — qidiruv serverga emas, shu ro'yxatga tegishli.
      query={query}
      onQueryChange={setQuery}
    />
  );
}

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
