import { useTranslation } from "react-i18next";
import { AlertCircle, Phone, ShieldCheck, ShieldX } from "lucide-react";
import type { PickupRecipient, PickupVerifyResult } from "@/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuthAvatarImage } from "@/components/common/AuthImage";
import { useChildGuardians } from "@/features/children/api";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/dates";

interface PickupVerdictProps {
  childId: string;
  /** Teglangan qabul qiluvchi — tanlanmaguncha `null`. */
  recipient: PickupRecipient | null;
  data?: PickupVerifyResult;
  isLoading: boolean;
  error: unknown;
}

/**
 * Olib ketish hukmi — kunning eng xavfli qaroriga javob beradigan ekran.
 *
 * Uch holat ATAYLAB ajratilgan:
 *   – ruxsat bor;
 *   – ruxsat yo'q (server shunday dedi) — sabab va keyingi qadam ko'rsatiladi;
 *   – tekshirib bo'lmadi (tarmoq/xato) — bu RAD ETISH EMAS. Ilgari xato ham
 *     «RUXSAT YO'Q» deb chizilardi va qabulxona serverni tekshirmagan holni
 *     rasmiy taqiq deb o'qishi mumkin edi.
 */
export function PickupVerdict({ childId, recipient, data, isLoading, error }: PickupVerdictProps) {
  const { t } = useTranslation();
  /*
    Vasiylar ikki holda kerak: rad etilganda — qo'ng'iroq qilish uchun,
    vaqtinchalik ruxsatda esa — kim bergani ko'rinishi uchun. Ruxsat kimdan
    kelganini bilmasdan qabulxona uni tekshira olmaydi (§5.2).
  */
  const needsGuardians =
    Boolean(error) || data?.allowed === false || data?.person?.permissionType === "temporary";
  const guardians = useChildGuardians(needsGuardians ? childId : "");

  if (!childId || !recipient) {
    return <p className="text-sm text-muted-foreground">{t("pickup.verify.selectBoth")}</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("common.state.loading")}</p>;
  }

  const primary =
    (guardians.data ?? []).find((link) => link.isPrimaryContact) ?? (guardians.data ?? [])[0];

  const grantedBy = (guardians.data ?? []).find(
    (link) => link.guardianId === data?.person?.grantedByGuardianId,
  )?.fullName;

  const callButton = primary?.phone ? (
    <Button variant="outline" asChild>
      <a href={`tel:${primary.phone.replace(/\s/g, "")}`}>
        <Phone className="mr-2 h-4 w-4" />
        {t("pickup.verify.callGuardian", { name: primary.fullName ?? "" })}
      </a>
    </Button>
  ) : null;

  // Tekshiruvning o'zi bajarilmadi — hukm emas.
  if (error) {
    return (
      <>
        <AlertCircle className="h-12 w-12 text-st-warn-fg" />
        <div className="text-lg font-bold text-st-warn-fg">{t("pickup.verify.unknown")}</div>
        <div className="text-sm text-st-warn-fg">{errorMessage(t, error)}</div>
        {callButton}
      </>
    );
  }

  if (data?.allowed) {
    const person = data.person;
    /*
      Ism uchun eng ishonchli manba — serverning `pickupName` i: vasiy
      yo'lida `person` qisqartirilgan bo'lishi mumkin (Handbook, 2026-10-04).
    */
    const name = data.pickupName ?? person?.fullName ?? "";
    return (
      <>
        {/* Surat — tekshiruvning o'zi, shuning uchun eng katta element. */}
        <Avatar className="h-52 w-52 border-2 border-st-ok-border">
          <AuthAvatarImage fileId={person?.photoFileId} src={data.photoUrl ?? person?.photoUrl} />
          <AvatarFallback className="text-4xl">{(name || "?")[0]}</AvatarFallback>
        </Avatar>

        <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-st-ok-fg px-4 py-2 text-xl font-extrabold text-white">
          <ShieldCheck className="h-6 w-6" />
          {t("pickup.verify.allowed")}
        </div>

        <div className="font-medium">{name}</div>
        {person?.relationship ? (
          <div className="text-sm text-muted-foreground">{person.relationship}</div>
        ) : null}
        {person?.phone ? <div className="text-sm text-muted-foreground">{person.phone}</div> : null}

        {/* Vaqtinchalik ruxsat: kim bergan va qachongacha amal qiladi. */}
        {person?.permissionType === "temporary" ? (
          <div className="text-sm text-muted-foreground">
            <div>
              {t("pickup.verify.temporaryUntil", {
                date: person.validTo ? formatDate(person.validTo) : "—",
              })}
            </div>
            {grantedBy ? (
              <div>
                {t("pickup.persons.grantedBy")}: {grantedBy}
              </div>
            ) : null}
          </div>
        ) : null}
        {data.expiresAt ? (
          <div className="text-sm text-muted-foreground">
            {t("pickup.verify.expiresAt")}: {formatDateTime(data.expiresAt)}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <ShieldX className="h-16 w-16 text-st-danger-fg" />
      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-st-danger-fg px-4 py-2 text-xl font-extrabold text-white">
        {t("pickup.verify.denied")}
      </div>
      {/* Sabab — «nega bo'lmaydi» degan savolga javob. */}
      <div className="text-sm text-st-danger-fg">
        {data?.reason ?? t("pickup.verify.deniedFallback")}
      </div>
      {/* Boshi berk ko'cha bo'lmasin: keyingi qadam — vasiyga qo'ng'iroq. */}
      {callButton}
    </>
  );
}
