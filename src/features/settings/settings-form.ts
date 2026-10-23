import type { Settings, UpdateSettingsDto } from "@/api";
import type { SettingsFormValues } from "@/components/forms/schemas";

export function settingsToForm(settings: Settings): SettingsFormValues {
  return {
    displayName: settings.displayName ?? "",
    address: settings.address ?? "",
    phones: (settings.phones ?? []).join(", "),
    workingDays: settings.workingDays ?? [],
    open: settings.workingHours?.open ?? "",
    close: settings.workingHours?.close ?? "",
    defaultLanguage: settings.defaultLanguage,
    currency: settings.currency ?? "",
    timezone: settings.timezone ?? "",
    receiptNumberFormat: settings.receiptNumberFormat ?? "",
    paymentDueDay: settings.paymentDueDay,
  };
}

export function settingsToDto(values: SettingsFormValues): UpdateSettingsDto {
  return {
    displayName: values.displayName,
    // Bo'sh satr/obyekt ham yuboriladi: undefined eski qiymatni saqlab qoladi.
    address: values.address,
    phones: values.phones
      .split(",")
      .map((phone) => phone.trim())
      .filter(Boolean),
    workingDays: values.workingDays,
    workingHours: values.open && values.close ? { open: values.open, close: values.close } : {},
    defaultLanguage: values.defaultLanguage,
    currency: values.currency,
    timezone: values.timezone,
    receiptNumberFormat: values.receiptNumberFormat,
    paymentDueDay: values.paymentDueDay,
  };
}
