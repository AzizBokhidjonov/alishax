import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link2, UserPlus } from "lucide-react";
import { childrenApi, type Guardian } from "@/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/forms/FormDialog";
import { phone as phoneSchema } from "@/components/forms/schemas/common";
import { GuardianPicker } from "@/components/common/EntityPicker";
import { useErrorToast } from "@/lib/query";
import { createOrReuseGuardian } from "@/features/guardians/duplicate";

interface LinkedGuardian {
  id: string;
  name: string;
  reused: boolean;
}

/**
 * Ustaning uchinchi qadami: ota-onani yaratish yoki mavjudini tanlash va
 * bolaga bog'lash.
 *
 * Yaratish `POST /guardians` bilan boshlanadi; telefon takrorlansa server
 * `409 DUPLICATE` va mavjud yozuvni qaytaradi — shunda yangi yozuv
 * yaratilmaydi, o'sha `id` bilan `POST /children/:id/guardians` bajariladi.
 */
export function EnrollGuardianStep({
  childId,
  onLinked,
  onBusyChange,
}: {
  childId: string;
  onBusyChange?: (busy: boolean) => void;
  onLinked: (linked: LinkedGuardian) => void;
}) {
  const { t } = useTranslation();
  const showError = useErrorToast();

  const [mode, setMode] = useState<"new" | "existing">("new");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [existingId, setExistingId] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPayer, setIsPayer] = useState(true);
  const [isPrimary, setIsPrimary] = useState(true);
  const [isEmergency, setIsEmergency] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const phoneValid = phoneSchema.safeParse(phone).success;

  const canSubmit =
    relationship.trim().length > 0 &&
    (mode === "existing" ? Boolean(existingId) : fullName.trim() !== "" && phoneValid);

  const submit = async () => {
    if (!canSubmit || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    onBusyChange?.(true);
    try {
      let guardian: Guardian | { id: string; fullName: string };
      let reused = false;

      if (mode === "existing") {
        guardian = { id: existingId, fullName };
      } else {
        const result = await createOrReuseGuardian({
          fullName: fullName.trim(),
          phone: phone.trim(),
        });
        guardian = result.guardian;
        reused = result.reused;
      }

      await childrenApi.linkGuardian(childId, {
        guardianId: guardian.id,
        relationship: relationship.trim(),
        isPayer,
        isPrimaryContact: isPrimary,
        isEmergencyContact: isEmergency,
      });

      toast.success(reused ? t("enroll.guardianReused") : t("enroll.guardianLinked"));
      onLinked({ id: guardian.id, name: guardian.fullName || fullName, reused });
      setFullName("");
      setPhone("");
      setExistingId("");
      setRelationship("");
    } catch (error) {
      showError(error);
    } finally {
      submitting.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  return (
    <fieldset disabled={busy} className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("enroll.guardianHint")}</p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("new")}
        >
          <UserPlus className="mr-1 h-4 w-4" />
          {t("guardians.add")}
        </Button>
        <Button
          type="button"
          variant={mode === "existing" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("existing")}
        >
          <Link2 className="mr-1 h-4 w-4" />
          {t("guardians.duplicate.link")}
        </Button>
      </div>

      {mode === "new" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("guardians.form.fullName")}>
            <Input
              className="h-11"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </Field>
          <Field
            label={t("guardians.form.phone")}
            hint={t("guardians.form.phoneHint")}
            error={phone && !phoneValid ? t("common.validation.invalidPhone") : undefined}
          >
            <Input
              className="h-11"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
        </div>
      ) : (
        <GuardianPicker
          label={t("common.labels.guardian")}
          value={existingId}
          onChange={setExistingId}
        />
      )}

      <Field label={t("guardians.link.relationship")}>
        <Input
          className="h-11"
          placeholder="mother"
          value={relationship}
          onChange={(event) => setRelationship(event.target.value)}
        />
      </Field>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isPayer} onCheckedChange={(value) => setIsPayer(value === true)} />
          {t("guardians.link.isPayer")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isPrimary} onCheckedChange={(value) => setIsPrimary(value === true)} />
          {t("guardians.link.isPrimaryContact")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={isEmergency}
            onCheckedChange={(value) => setIsEmergency(value === true)}
          />
          {t("guardians.link.isEmergencyContact")}
        </label>
      </div>

      <div className="flex justify-end">
        <Button disabled={!canSubmit || busy} onClick={() => void submit()}>
          <Label className="cursor-pointer">{t("guardians.link.add")}</Label>
        </Button>
      </div>
    </fieldset>
  );
}
