import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AuthImage } from "@/components/common/AuthImage";
import { FileUploadField } from "@/components/common/FileUploadField";
import { cn, focusRing } from "@/lib/utils";
import { emptyItem, type FieldSpec } from "../block-schema";

/** Maydon nomi -> tarjima; katalogda bo'lmasa nomning o'zi ko'rsatiladi. */
function useFieldLabel() {
  const { t } = useTranslation();
  return (name: string) => {
    const key = `website.fields.${name}`;
    const label = t(key);
    return label === key ? name : label;
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm font-medium text-destructive">{message}</p>;
}

/**
 * Ko'p tilli matn — HAR BIR MAYDON uchun alohida til tablari (§7).
 *
 * Sahifa darajasidagi bitta til almashtirgichi emas: muharrir maydonma-maydon
 * ishlaydi va umumiy almashtirgich uni har safar joyidan yo'qotadi. Tarjimasi
 * yo'q til tabida nuqta turadi — yarim tarjima qilingan sahifa ham chop
 * etiladigan holat, shuning uchun bu ogohlantirish, to'siq emas.
 */
function I18nInput({
  spec,
  locales,
  value,
  onChange,
  error,
}: {
  spec: FieldSpec;
  locales: string[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const label = useFieldLabel()(spec.name);
  const [locale, setLocale] = useState(locales[0] ?? "uz");
  const Control = spec.multiline ? Textarea : Input;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>
          {label}
          {spec.required ? " *" : ""}
        </Label>
        <div className="flex gap-1">
          {locales.map((code) => {
            const filled = Boolean(value?.[code]?.trim());
            return (
              <button
                key={code}
                type="button"
                aria-pressed={locale === code}
                aria-label={filled ? code : `${code} — ${t("website.locales.missing")}`}
                onClick={() => setLocale(code)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold uppercase transition-colors",
                  focusRing,
                  locale === code
                    ? "bg-brand-soft text-brand-ink"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {code}
                {!filled ? (
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-st-warn-fg" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <Control
        value={value?.[locale] ?? ""}
        rows={spec.multiline ? 3 : undefined}
        onChange={(event: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
          onChange({ ...value, [locale]: event.target.value })
        }
      />
      <FieldError message={error} />
    </div>
  );
}

function ImageInput({
  spec,
  value,
  onChange,
  error,
}: {
  spec: FieldSpec;
  value?: string;
  onChange: (next: string | undefined) => void;
  error?: string;
}) {
  const label = useFieldLabel()(spec.name);

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-3">
        {/*
          Ko'rib turish MUHARRIRDA `/files/:id` orqali — himoyalangan yo'l.
          Ommaviy saytda esa `mediaBaseUrl` ishlatiladi va rasm faqat uni
          ishlatgan blok chop etilgandan keyin ochiq bo'ladi (§5).
        */}
        {value ? (
          <AuthImage fileId={value} alt="" className="h-20 w-20 shrink-0 rounded-xl" />
        ) : null}
        <div className="min-w-0 flex-1">
          <FileUploadField
            label={`${label}${spec.required ? " *" : ""}`}
            value={value}
            onChange={onChange}
            accept="image/jpeg,image/png,image/webp"
            entityType="landing"
          />
        </div>
      </div>
      <FieldError message={error} />
    </div>
  );
}

function StringsInput({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslation();
  const label = useFieldLabel()(spec.name);
  const list = value ?? [];

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {list.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(event) =>
              onChange(list.map((old, at) => (at === index ? event.target.value : old)))
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("common.actions.remove")}
            onClick={() => onChange(list.filter((_, at) => at !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...list, ""])}>
        <Plus className="mr-1 h-4 w-4" />
        {t("common.actions.add")}
      </Button>
    </div>
  );
}

/**
 * Takrorlanuvchi ro'yxat: xizmatlar, galereya, tariflar, savol-javob.
 * Tartib ham shu yerda o'zgaradi — chop etilgan sahifada elementlar aynan
 * shu ketma-ketlikda chiqadi.
 */
function ItemsInput({
  spec,
  locales,
  value,
  onChange,
  errors,
  path,
}: {
  spec: FieldSpec;
  locales: string[];
  value: Record<string, unknown>[];
  onChange: (next: Record<string, unknown>[]) => void;
  errors: Record<string, string>;
  path: string;
}) {
  const { t } = useTranslation();
  const label = useFieldLabel()(spec.name);
  const list = value ?? [];
  const fields = spec.fields ?? [];
  const full = spec.max !== undefined && list.length >= spec.max;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>
          {label}
          {spec.max ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {list.length} / {spec.max}
            </span>
          ) : null}
        </Label>
      </div>

      {list.map((item, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                aria-label={t("website.blocks.moveUp")}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === list.length - 1}
                aria-label={t("website.blocks.moveDown")}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("common.actions.remove")}
                onClick={() => onChange(list.filter((_, at) => at !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ContentEditor
            fields={fields}
            locales={locales}
            value={item}
            onChange={(next) => onChange(list.map((old, at) => (at === index ? next : old)))}
            errors={errors}
            path={`${path}.${index}`}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={full}
        onClick={() => onChange([...list, emptyItem(fields)])}
      >
        <Plus className="mr-1 h-4 w-4" />
        {t("common.actions.add")}
      </Button>
    </div>
  );
}

/**
 * Blok tarkibi formasi.
 *
 * `path` — server xatolarini maydonga qaytarish uchun: `422` javobidagi
 * `details[].path` aynan shu ko'rinishda keladi (`items.2.question`, §8).
 */
export function ContentEditor({
  fields,
  locales,
  value,
  onChange,
  errors,
  path = "",
}: {
  fields: FieldSpec[];
  locales: string[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  errors: Record<string, string>;
  path?: string;
}) {
  const label = useFieldLabel();
  const set = (name: string, next: unknown) => onChange({ ...value, [name]: next });
  const keyFor = (name: string) => (path ? `${path}.${name}` : name);

  return (
    <div className="space-y-4">
      {fields.map((spec) => {
        const fieldPath = keyFor(spec.name);
        const error = errors[fieldPath];
        const current = value?.[spec.name];

        switch (spec.kind) {
          case "i18n":
            return (
              <I18nInput
                key={spec.name}
                spec={spec}
                locales={locales}
                value={(current as Record<string, string>) ?? {}}
                onChange={(next) => set(spec.name, next)}
                error={error}
              />
            );

          case "image":
            return (
              <ImageInput
                key={spec.name}
                spec={spec}
                value={current as string | undefined}
                onChange={(next) => set(spec.name, next)}
                error={error}
              />
            );

          case "bool":
            return (
              <div key={spec.name} className="flex items-center justify-between gap-3">
                <Label htmlFor={fieldPath}>{label(spec.name)}</Label>
                <Switch
                  id={fieldPath}
                  checked={Boolean(current)}
                  onCheckedChange={(next) => set(spec.name, next)}
                />
              </div>
            );

          case "strings":
            return (
              <StringsInput
                key={spec.name}
                spec={spec}
                value={(current as string[]) ?? []}
                onChange={(next) => set(spec.name, next)}
              />
            );

          case "items":
            return (
              <ItemsInput
                key={spec.name}
                spec={spec}
                locales={locales}
                value={(current as Record<string, unknown>[]) ?? []}
                onChange={(next) => set(spec.name, next)}
                errors={errors}
                path={fieldPath}
              />
            );

          default:
            return (
              <div key={spec.name} className="space-y-1.5">
                <Label htmlFor={fieldPath}>
                  {label(spec.name)}
                  {spec.required ? " *" : ""}
                </Label>
                <Input
                  id={fieldPath}
                  type={spec.kind === "url" ? "url" : "text"}
                  value={(current as string) ?? ""}
                  onChange={(event) => set(spec.name, event.target.value)}
                />
                <FieldError message={error} />
              </div>
            );
        }
      })}
    </div>
  );
}
