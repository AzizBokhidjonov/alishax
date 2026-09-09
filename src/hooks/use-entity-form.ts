import { useCallback, useEffect, useRef, useState, type BaseSyntheticEvent } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { fieldErrors } from "@/api";

export interface EntityFormOptions<T extends FieldValues> {
  /** Validatsiya sxemasi (server qoidalarini takrorlaydi). */
  schema: ZodType<T>;
  /** Yangi yozuv uchun boshlang'ich qiymatlar. */
  defaults: T | (() => T);
  /** Berilsa — tahrirlash rejimi; forma shu yozuv bilan to'ldiriladi. */
  entity?: Partial<T> | null;
  /**
   * Saqlash. Promise qaytarsa forma kutadi; xato bo'lsa oyna yopilmaydi va
   * `422` dagi `details` maydon xatolariga aylantiriladi.
   */
  onSubmit: (values: T, isEditing: boolean) => void | Promise<unknown>;
}

export interface EntityForm<T extends FieldValues> {
  open: boolean;
  setOpen: (open: boolean) => void;
  form: UseFormReturn<T>;
  submit: (event?: BaseSyntheticEvent) => void;
  isEditing: boolean;
  pending: boolean;
  canSubmit: boolean;
}

function resolveDefaults<T>(defaults: T | (() => T)): T {
  return typeof defaults === "function" ? (defaults as () => T)() : defaults;
}

/**
 * Dialog ichidagi forma uchun umumiy mantiq: ochilish holati, ochilganda
 * qiymatlarni tiklash, zod validatsiyasi, saqlash va server xatolarini
 * maydonlarga bog'lash.
 */
export function useEntityForm<T extends FieldValues>({
  schema,
  defaults,
  entity,
  onSubmit,
}: EntityFormOptions<T>): EntityForm<T> {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isEditing = !!entity;

  const form = useForm<T>({
    resolver: zodResolver(schema) as Resolver<T>,
    defaultValues: resolveDefaults(defaults) as DefaultValues<T>,
    mode: "onChange",
  });

  // Eng so'nggi qiymatlar ref'da: tiklash effekti faqat `open` o'zgarganda
  // ishlaydi — forma ochiq turganda tashqi yangilanish kiritilgan matnni
  // o'chirib yubormaydi.
  const latest = useRef({ entity, defaults, onSubmit });
  useEffect(() => {
    latest.current = { entity, defaults, onSubmit };
  });

  useEffect(() => {
    if (!open) return;
    const current = latest.current;
    const base = resolveDefaults(current.defaults);
    form.reset({ ...base, ...(current.entity ?? {}) } as DefaultValues<T>);
    if (current.entity) void form.trigger();
  }, [open, form]);

  const submit = useCallback(
    (event?: BaseSyntheticEvent) => {
      void form.handleSubmit(async (values) => {
        const current = latest.current;
        setPending(true);
        try {
          await current.onSubmit(values, !!current.entity);
          setOpen(false);
        } catch (error) {
          const errors = fieldErrors(error);
          for (const [field, message] of Object.entries(errors)) {
            form.setError(field as Path<T>, { type: "server", message });
          }
        } finally {
          setPending(false);
        }
      })(event);
    },
    [form],
  );

  return {
    open,
    setOpen,
    form,
    submit,
    isEditing,
    pending,
    canSubmit: form.formState.isValid && !pending,
  };
}
