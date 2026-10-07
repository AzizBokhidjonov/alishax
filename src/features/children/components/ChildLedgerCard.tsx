import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Scale, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/common/StatusBadge";
import { Money } from "@/components/common/Money";
import { MoneyInput } from "@/components/common/MoneyInput";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { DatePicker } from "@/components/common/DateField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { adjustmentSchema, type AdjustmentFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { formatDate, formatDateTime } from "@/lib/dates";
import { toTiyin } from "@/lib/money";
import {
  useChargeLedger,
  useChildCharges,
  useCreateAdjustment,
  usePeriods,
  useRecalculateChildBilling,
} from "@/features/finance/api";

/**
 * Qo'lda tuzatish oynasi.
 *
 * Yo'nalish ALOHIDA maydonda, summa esa har doim musbat: ishorali bitta
 * maydonda «minus»ni ko'rmay qolib oilaga qarz yozib yuborish mumkin edi.
 * Oyna tanlangan yo'nalishni so'z bilan ham takrorlaydi.
 *
 * Bu amal naqd pul QAYTARISH emas — qaytarishning alohida jarayoni yo'q va
 * buni oynaning o'zi aytadi.
 */
function AdjustmentDialog({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const periods = usePeriods();
  const adjust = useCreateAdjustment();

  const form = useEntityForm<AdjustmentFormValues>({
    schema: adjustmentSchema,
    defaults: () => ({ periodId: "", sign: "-1", amountSom: "", reason: "" }),
    onSubmit: async (values) => {
      await adjust.mutateAsync({
        childId,
        periodId: values.periodId,
        sign: values.sign === "-1" ? -1 : 1,
        amountTiyin: toTiyin(values.amountSom),
        reason: values.reason,
        dueDate: values.dueDate,
      });
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);
  const sign = watch("sign");

  /* Faqat OCHIQ davrga tuzatish kiritiladi — yopilgani serverda rad etiladi. */
  const openPeriods = (periods.data ?? []).filter((period) => period.status !== "closed");

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          {t("charges.adjust.title")}
        </Button>
      }
      title={t("charges.adjust.title")}
      description={t("charges.adjust.hint")}
      submitLabel={t("common.actions.save")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <SelectField
          label={t("charges.columns.period")}
          value={watch("periodId")}
          onChange={(value) => setValue("periodId", value, { shouldValidate: true })}
          options={openPeriods.map((period) => ({
            value: period.id,
            label: `${period.month}.${period.year}`,
          }))}
          error={error("periodId")}
        />

        <SelectField
          label={t("charges.adjust.direction")}
          value={sign}
          onChange={(value) => setValue("sign", value as "-1" | "1", { shouldValidate: true })}
          options={[
            { value: "-1", label: t("charges.adjust.credit") },
            { value: "1", label: t("charges.adjust.debit") },
          ]}
          error={error("sign")}
        />

        <MoneyInput
          label={t("charges.columns.amount")}
          value={watch("amountSom")}
          onChange={(value) => setValue("amountSom", value, { shouldValidate: true })}
          error={error("amountSom")}
          hint={sign === "-1" ? t("charges.adjust.creditHint") : t("charges.adjust.debitHint")}
        />

        <Field label={t("common.labels.reason")} error={error("reason")}>
          <Textarea rows={3} {...register("reason")} />
        </Field>

        <Field label={t("charges.adjust.dueDate")} error={error("dueDate")}>
          <DatePicker
            value={watch("dueDate") ?? ""}
            onChange={(value) => setValue("dueDate", value, { shouldValidate: true })}
            clearable
          />
        </Field>
      </div>
    </FormDialog>
  );
}

/**
 * Davomat tuzatilgandan keyin oyni qayta hisoblash.
 *
 * Natija uch xil bo'ladi va uni umumiy «bajarildi» ostiga yashirmaslik kerak:
 * hisob qaytarilib qayta yozilishi, keyingi ochiq davrga tuzatish
 * qo'shilishi yoki qo'lda hal qilinadigan ish paydo bo'lishi mumkin.
 */
function RecalculateDialog({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const recalculate = useRecalculateChildBilling(childId);

  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const valid =
    Number.isInteger(yearNumber) &&
    yearNumber >= 2000 &&
    yearNumber <= 2100 &&
    Number.isInteger(monthNumber) &&
    monthNumber >= 1 &&
    monthNumber <= 12;

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" variant="outline">
          <RefreshCw className="mr-1 h-4 w-4" />
          {t("charges.recalculate.title")}
        </Button>
      }
      title={t("charges.recalculate.title")}
      description={t("charges.recalculate.hint")}
      submitLabel={t("charges.recalculate.title")}
      canSubmit={valid}
      pending={recalculate.isPending}
      onSubmit={() =>
        recalculate.mutate(
          { year: yearNumber, month: monthNumber },
          { onSuccess: () => setOpen(false) },
        )
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("periods.columns.year")}>
          <Input
            inputMode="numeric"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
        </Field>
        <Field label={t("periods.columns.month")}>
          <Input
            inputMode="numeric"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </Field>
      </div>
    </FormDialog>
  );
}

/** Joriy hisoblar — faqat musbat, ochiq hisoblar ko'rinishi. */
function CurrentCharges({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const charges = useChildCharges(childId);

  return (
    <QueryState
      isLoading={charges.isLoading}
      error={charges.error}
      isEmpty={(charges.data ?? []).length === 0}
      emptyTitle={t("charges.empty")}
      onRetry={() => void charges.refetch()}
      rows={2}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("charges.columns.period")}</TableHead>
            <TableHead>{t("charges.columns.description")}</TableHead>
            <TableHead>{t("charges.columns.amount")}</TableHead>
            <TableHead>{t("charges.columns.paid")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(charges.data ?? []).map((charge) => (
            <TableRow key={charge.id}>
              <TableCell>
                {charge.period ? `${charge.period.month}.${charge.period.year}` : "—"}
              </TableCell>
              <TableCell>
                {charge.description ?? "—"}
                {charge.sign === -1 ? (
                  <Badge tone="danger" className="ml-2">
                    {t("charges.reversed")}
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell>
                <Money value={charge.amountTiyin} colored />
              </TableCell>
              <TableCell>
                <Money value={charge.paidTiyin ?? "0"} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </QueryState>
  );
}

/**
 * To'liq daftarcha — faqat qo'shiladigan tarix.
 *
 * Har bir satr o'z ishorasi bilan turadi va qaytarish satri «nimani
 * qaytaradi» degan belgi bilan ko'rsatiladi: daftarchada hech narsa
 * o'chirilmaydi, shuning uchun juftlikni ko'rish muhim.
 */
function LedgerTable({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const ledger = useChargeLedger(childId);
  const rows = ledger.data?.data ?? [];

  return (
    <QueryState
      isLoading={ledger.isLoading}
      error={ledger.error}
      isEmpty={rows.length === 0}
      emptyTitle={t("charges.ledger.empty")}
      emptyDescription={t("charges.ledger.emptyHint")}
      onRetry={() => void ledger.refetch()}
      rows={3}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("charges.columns.period")}</TableHead>
            <TableHead>{t("charges.columns.description")}</TableHead>
            <TableHead>{t("charges.columns.amount")}</TableHead>
            <TableHead>{t("charges.ledger.createdAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                {entry.period ? `${entry.period.month}.${entry.period.year}` : "—"}
              </TableCell>
              <TableCell className="max-w-[320px]">
                <span className="block truncate">
                  {entry.description ?? entry.reason ?? entry.kind ?? "—"}
                </span>
                <span className="flex flex-wrap gap-1 pt-1">
                  {entry.reversesChargeId ? (
                    <Badge tone="warn">{t("charges.ledger.reversal")}</Badge>
                  ) : null}
                  {entry.reversedAt ? <Badge tone="danger">{t("charges.reversed")}</Badge> : null}
                  {entry.dueDate ? (
                    <span className="text-xs text-muted-foreground">
                      {t("charges.adjust.dueDate")}: {formatDate(entry.dueDate)}
                    </span>
                  ) : null}
                </span>
              </TableCell>
              <TableCell>
                {/*
                  Ishora summada ko'rinadi: kredit satri manfiy bo'lib
                  chiziladi, aks holda qaytarish va asl yozuv bir xil ko'rinadi.
                */}
                <Money
                  value={
                    entry.sign === -1 && !entry.amountTiyin.startsWith("-")
                      ? `-${entry.amountTiyin}`
                      : entry.amountTiyin
                  }
                  colored
                />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {entry.createdAt ? formatDateTime(entry.createdAt) : "—"}
                {entry.createdByName ? <div>{entry.createdByName}</div> : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </QueryState>
  );
}

/**
 * Bolaning hisoblari va daftarchasi.
 *
 * Ikki ko'rinish ATAYLAB ajratilgan: «Joriy hisoblar» — bugungi qarzni
 * tushunish uchun, «Daftarcha» — nima bo'lganini tushunish uchun. Ularni
 * bitta jadvalga qo'shish ikkala savolga ham yomon javob beradi.
 */
export function ChildLedgerCard({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();

  /*
    Tuzatish IKKI ruxsatni talab qiladi (§5, Adjustments) — server ham
    shunday tekshiradi. Bittasi bo'lsa tugma ko'rsatilmaydi: ko'rsatilgan,
    lekin har doim 403 beradigan tugma yomonroq.
  */
  const canAdjust = can(P.chargeGenerate) && can(P.chargeReverse);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale aria-hidden className="h-4 w-4" />
          {t("charges.title")}
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {canAdjust ? <AdjustmentDialog childId={childId} /> : null}
          {can(P.chargeGenerate) ? <RecalculateDialog childId={childId} /> : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="current">
          <TabsList className="mx-4 mt-1">
            <TabsTrigger value="current">{t("charges.tabs.current")}</TabsTrigger>
            <TabsTrigger value="ledger">{t("charges.tabs.ledger")}</TabsTrigger>
          </TabsList>
          <TabsContent value="current">
            <CurrentCharges childId={childId} />
          </TabsContent>
          <TabsContent value="ledger">
            <LedgerTable childId={childId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
