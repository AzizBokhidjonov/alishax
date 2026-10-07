import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlaskConical } from "lucide-react";
import { billingApi, type BillingTraceStep } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/common/Money";
import { ChildPicker } from "@/components/common/EntityPicker";
import { Field } from "@/components/forms/FormDialog";
import { currentPeriod } from "@/lib/dates";
import { useErrorToast } from "@/lib/query";
import { subtractTiyin } from "@/lib/money";

interface SimulationPair {
  /** Tahrirdagi qoidalar bo'yicha natija. */
  draftTiyin: string;
  /** Amaldagi qoidalar bo'yicha natija — solishtirish uchun. */
  activeTiyin: string;
  trace?: BillingTraceStep[];
}

interface RulesSimulatePanelProps {
  /** Tekshiriladigan qoidalar (JSON matn). */
  rulesJson: string;
  /** Muvaffaqiyatli tekshirilgan JSON — o'zgarsa natija bekor bo'ladi. */
  onSimulated: (simulatedJson: string | null) => void;
}

/**
 * Qoidalarni saqlashdan oldin majburiy tekshirish (§7.1).
 *
 * `POST /billing-rules/simulate` `rules` bilan chaqirilsa — qoralama,
 * `rules` siz chaqirilsa — amaldagi versiya hisoblanadi. Ikkalasi yonma-yon
 * ko'rsatiladi: buxgalter farqni ko'rmasdan yangi versiyani chiqarmasin.
 */
export function RulesSimulatePanel({ rulesJson, onSimulated }: RulesSimulatePanelProps) {
  const { t } = useTranslation();
  const showError = useErrorToast();
  const period = currentPeriod();

  const [childId, setChildId] = useState("");
  const [year, setYear] = useState(period.year);
  const [month, setMonth] = useState(period.month);
  const [result, setResult] = useState<SimulationPair | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    let rules: Record<string, unknown>;
    try {
      rules = JSON.parse(rulesJson) as Record<string, unknown>;
    } catch {
      showError(new Error(t("billing.rules.invalidJson")));
      return;
    }

    setBusy(true);
    try {
      // Ikkala hisob bir vaqtda: qoralama va amaldagi qoidalar.
      const [draft, active] = await Promise.all([
        billingApi.simulate({ childId, year, month, rules }),
        billingApi.simulate({ childId, year, month }),
      ]);
      setResult({
        draftTiyin: draft.amountTiyin,
        activeTiyin: active.amountTiyin,
        trace: draft.trace,
      });
      onSimulated(rulesJson);
    } catch (error) {
      setResult(null);
      onSimulated(null);
      showError(error);
    } finally {
      setBusy(false);
    }
  }, [childId, month, onSimulated, rulesJson, showError, t, year]);

  const delta = result ? subtractTiyin(result.draftTiyin, result.activeTiyin) : null;

  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div className="text-sm font-medium">{t("billing.rules.simulateRequired")}</div>

      <ChildPicker
        permission="billing_rules:manage"
        label={t("billing.rules.simulateChild")}
        value={childId}
        onChange={(value) => {
          setChildId(value);
          setResult(null);
          onSimulated(null);
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("common.labels.year")}>
          <Input
            type="number"
            className="h-11"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          />
        </Field>
        <Field label={t("common.labels.month")}>
          <Input
            type="number"
            min={1}
            max={12}
            className="h-11"
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
          />
        </Field>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={!childId || busy}
        onClick={() => void run()}
      >
        <FlaskConical className="mr-2 h-4 w-4" />
        {t("billing.rules.simulate")}
      </Button>

      {result ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary p-3">
            <div className="text-xs text-muted-foreground">{t("billing.rules.activeResult")}</div>
            <Money value={result.activeTiyin} className="text-lg font-bold" />
          </div>
          <div className="rounded-xl border border-st-info-border bg-st-info-soft p-3">
            <div className="text-xs text-st-info-fg">{t("billing.rules.draftResult")}</div>
            <Money value={result.draftTiyin} className="text-lg font-bold" />
            {delta && delta !== "0" ? (
              <div className="text-xs">
                <Money value={delta} colored />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {result?.trace?.length ? (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {result.trace.map((step, index) => (
            <li key={`${step.step}-${index}`} className="flex justify-between gap-2">
              <span>{step.step}</span>
              {step.amount ? <Money value={step.amount} hideCurrency /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
