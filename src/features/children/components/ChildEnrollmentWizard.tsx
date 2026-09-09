import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { Badge } from "@/components/common/StatusBadge";
import { Stepper } from "@/components/common/Stepper";
import { childSchema, type ChildFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { todayIso } from "@/lib/dates";
import { useBranchOptions } from "@/features/settings/api";
import { useAssignChildToGroup, useGroupOptions } from "@/features/groups/api";
import { useCreateChild } from "../api";
import { ChildFormFields } from "./ChildFormFields";
import { EnrollGuardianStep } from "./EnrollGuardianStep";
import { DatePicker } from "@/components/common/DateField";

type Step = "child" | "group" | "guardian";

const STEP_ORDER: Step[] = ["child", "group", "guardian"];

/**
 * Bola qabul qilish ustasi — backend oqimini bir ekranda ketma-ket bajaradi:
 *
 * 1. `POST /children` — bolaning o'zi (guruh maydoni yo'q: guruh a'zoligi
 *    vaqtinchalik tarix, bolaning xossasi emas).
 * 2. `POST /groups/:id/children` — biriktirish, `effectiveDate` bilan.
 *    O'tkazib yuborilishi mumkin: bola navbatda turishi normal holat.
 * 3. `POST /guardians` (+ `409 DUPLICATE` da mavjudini qayta ishlatish) va
 *    `POST /children/:id/guardians` — bog'lash.
 */
export function ChildEnrollmentWizard({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const branches = useBranchOptions();
  const groups = useGroupOptions();
  const createChild = useCreateChild();
  const assign = useAssignChildToGroup();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("child");
  const [child, setChild] = useState<{ id: string; name: string } | null>(null);
  const [groupId, setGroupId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [linked, setLinked] = useState<{ id: string; name: string; reused: boolean }[]>([]);

  const form = useEntityForm<ChildFormValues>({
    schema: childSchema,
    defaults: () => ({
      branchId: branches[0]?.value ?? "",
      firstName: "",
      lastName: "",
      birthDate: "",
      enrollmentDate: todayIso(),
    }),
    onSubmit: async (values) => {
      const created = await createChild.mutateAsync(values);
      setChild({ id: created.id, name: `${values.lastName} ${values.firstName}` });
      toast.success(t("enroll.created"));
      setStep("group");
    },
  });

  const error = useFieldError(form.form.formState.errors);

  const reset = () => {
    setStep("child");
    setChild(null);
    setGroupId("");
    setLinked([]);
    setEffectiveDate(todayIso());
  };

  const assignGroup = () => {
    if (!child || !groupId) return;
    assign.mutate(
      { groupId, dto: { childId: child.id, effectiveDate } },
      { onSuccess: () => setStep("guardian") },
    );
  };

  const finish = () => {
    const id = child?.id;
    setOpen(false);
    reset();
    toast.success(t("enroll.done"));
    if (id) void navigate({ to: "/bolalar/$id", params: { id } });
  };

  const steps = STEP_ORDER.map((key) => ({ key, label: t(`enroll.steps.${key}`) }));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 space-y-4 border-b border-border px-6 py-5">
          <div className="space-y-1.5">
            <DialogTitle>{t("enroll.title")}</DialogTitle>
            <DialogDescription>{t("enroll.hint")}</DialogDescription>
          </div>
          {/*
            Qadamlar chizig'i sarlavha bilan birga qotib turadi: forma
            skroll qilinganda ham «nechanchi qadamdaman» ko'rinib turadi.
          */}
          <Stepper steps={steps} current={step} />
        </DialogHeader>

        {/*
          Har bir qadam o'z kaliti bilan qayta chiziladi — `key` almashgani
          uchun React blokni yangidan yaratadi va u o'ngdan sirg'alib kiradi.
        */}
        <div
          key={step}
          className="min-h-0 flex-1 animate-in space-y-4 overflow-y-auto px-6 py-5 fade-in-0 slide-in-from-right-4 duration-300"
        >
          {step === "child" ? (
            <ChildFormFields form={form.form} error={error} branches={branches} />
          ) : null}

          {step === "group" ? (
            <>
              <StepNote>{t("enroll.groupHint")}</StepNote>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label={t("common.labels.group")}
                  value={groupId}
                  onChange={setGroupId}
                  options={groups}
                />
                <Field label={t("groups.assign.effectiveDate")}>
                  <DatePicker value={effectiveDate} onChange={setEffectiveDate} clearable={false} />
                </Field>
              </div>
            </>
          ) : null}

          {step === "guardian" && child ? (
            <>
              <EnrollGuardianStep
                childId={child.id}
                onLinked={(item) => setLinked((current) => [...current, item])}
              />
              {linked.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {linked.map((item) => (
                    <Badge key={item.id} tone="ok" className="animate-in zoom-in-95 duration-200">
                      <Check className="mr-1 h-3.5 w-3.5" />
                      {item.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-secondary/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          {/*
            Bola yaratilgandan keyin orqaga qaytib bo'lmaydi (u allaqachon
            bazada), shuning uchun «Orqaga» faqat birinchi qadamda «Bekor
            qilish» ga aylanadi — keyingi qadamlarda esa «O'tkazib yuborish».
          */}
          {step === "child" ? (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {t("common.actions.cancel")}
              </Button>
              <Button onClick={form.submit} disabled={!form.canSubmit} className="min-w-32">
                {form.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("enroll.next")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : null}

          {step === "group" ? (
            <>
              <Button variant="ghost" onClick={() => setStep("guardian")}>
                {t("enroll.skip")}
              </Button>
              <Button
                disabled={!groupId || assign.isPending}
                onClick={assignGroup}
                className="min-w-32"
              >
                {assign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("enroll.next")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : null}

          {step === "guardian" ? (
            <>
              {/*
                Orqaga qaytish faqat guruh o'tkazib yuborilgan bo'lsa
                ko'rinadi: biriktirish allaqachon bajarilgan bo'lsa, qayta
                kirish ikkinchi a'zolik yozuvini yaratib qo'yardi.
              */}
              {assign.isSuccess ? null : (
                <Button variant="ghost" onClick={() => setStep("group")} className="sm:mr-auto">
                  <ArrowLeft className="h-4 w-4" />
                  {t("common.actions.back")}
                </Button>
              )}
              <Button variant="ghost" onClick={finish}>
                {t("enroll.skip")}
              </Button>
              <Button onClick={finish} className="min-w-32">
                <UserPlus className="h-4 w-4" />
                {t("enroll.finish")}
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Qadamning maqsadini bir jumlada aytadigan izoh. */
function StepNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-st-info-border bg-st-info-soft px-3.5 py-2.5 text-sm text-st-info-fg">
      {children}
    </p>
  );
}
