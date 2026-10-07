import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { BookOpen, Check, CircleDashed, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth, usePermissions } from "@/auth/auth-context";
import { roleLabelKey } from "@/config/permissions";
import { cn } from "@/lib/utils";
import { ROLE_GUIDES, openRoutesFor, routeLabelKey, type RoleGuide } from "./role-guides";

/**
 * i18n dan matnlar ro'yxatini o'qish.
 *
 * `returnObjects` massiv qaytaradi, lekin kalit yo'q bo'lsa i18next kalitning
 * O'ZINI satr qilib beradi. Shuning uchun natija tekshiriladi: yarim
 * tarjima qilingan katalog sahifani sindirmasin.
 */
function useList(key: string): string[] {
  const { t } = useTranslation();
  const value = t(key, { returnObjects: true }) as unknown;
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/** Ruxsat kaliti — bor/yo'q belgisi bilan. */
function PermissionChip({ permissionKey, held }: { permissionKey: string; held: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      title={held ? t("guide.youHave") : t("guide.youLack")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs",
        held
          ? "border-st-ok-border bg-st-ok-soft text-st-ok-fg"
          : "border-border bg-secondary text-muted-foreground",
      )}
    >
      {held ? (
        <Check aria-hidden className="h-3 w-3" />
      ) : (
        <CircleDashed aria-hidden className="h-3 w-3" />
      )}
      {permissionKey}
    </span>
  );
}

function RoleCard({ guide, isMine }: { guide: RoleGuide; isMine: boolean }) {
  const { t } = useTranslation();
  const { can } = usePermissions();

  const steps = useList(`guide.roles.${guide.code}.steps`);
  const cautions = useList(`guide.roles.${guide.code}.cautions`);

  return (
    <Card className={cn(isMine && "border-brand")}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">{t(roleLabelKey(guide.code))}</CardTitle>
          {isMine ? (
            <Badge className="bg-brand text-brand-foreground">{t("guide.yourRole")}</Badge>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t(`guide.roles.${guide.code}.summary`)}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-bold">{t("guide.sections.steps")}</h3>
          {/*
            Raqamlangan ro'yxat — qadamlar TARTIBI ahamiyatli: qabul qilish ham,
            hisoblash ham oldingi qadam bajarilmasa keyingisiga o'tmaydi.
          */}
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {cautions.length > 0 ? (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-st-warn-fg">
              <TriangleAlert aria-hidden className="h-4 w-4" />
              {t("guide.sections.cautions")}
            </h3>
            <ul className="space-y-2 rounded-xl border border-st-warn-border bg-st-warn-soft px-4 py-3">
              {cautions.map((item, index) => (
                <li key={index} className="text-sm leading-relaxed text-st-warn-fg">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h3 className="mb-2 text-sm font-bold">{t("guide.sections.screens")}</h3>
          <div className="flex flex-wrap gap-2">
            {guide.routes.map((to) => (
              <Link
                key={to}
                to={to}
                className="rounded-full border border-border px-3 py-1 text-sm hover:bg-secondary"
              >
                {t(routeLabelKey(to))}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold">{t("guide.sections.permissions")}</h3>
          <div className="flex flex-wrap gap-1.5">
            {guide.permissions.map((key) => (
              <PermissionChip key={key} permissionKey={key} held={can(key)} />
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

/** Foydalanuvchining o'ziga tegishli qism — jonli ruxsatlardan hisoblanadi. */
function MyAccess() {
  const { t } = useTranslation();
  const { roles, permissions } = useAuth();
  const { can } = usePermissions();

  const openRoutes = openRoutesFor(can);
  const entries = Object.entries(permissions).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("guide.yours.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <section>
            <h3 className="mb-2 text-sm font-bold">{t("guide.yours.roles")}</h3>
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("guide.yours.noRoles")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge key={role.id} variant="secondary" className="text-sm">
                    {/* Maxsus rol seed ro'yxatida yo'q — o'shanda serverdagi nomi ishlatiladi. */}
                    {t(roleLabelKey(role.code), { defaultValue: role.nameUz ?? role.code })}
                  </Badge>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-bold">{t("guide.yours.openSections")}</h3>
            <div className="flex flex-wrap gap-2">
              {openRoutes.map((to) => (
                <Link
                  key={to}
                  to={to}
                  className="rounded-full border border-border px-3 py-1 text-sm hover:bg-secondary"
                >
                  {t(routeLabelKey(to))}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-bold">{t("guide.yours.permissions")}</h3>
            <p className="mb-2 text-xs text-muted-foreground">{t("guide.yours.scopeHint")}</p>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("guide.yours.none")}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {entries.map(([key, scope]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs"
                  >
                    <span className="font-mono">{key}</span>
                    <span className="rounded-full bg-secondary px-1.5 font-semibold">
                      {t(`domain.scopes.${scope}`, { defaultValue: String(scope) })}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </section>
        </CardContent>
      </Card>

      {/* O'z roli uchun to'liq qo'llanma shu yerda — boshqa tabga o'tish shart emas. */}
      {ROLE_GUIDES.filter((guide) => roles.some((role) => role.code === guide.code)).map(
        (guide) => (
          <RoleCard key={guide.code} guide={guide} isMine />
        ),
      )}
    </div>
  );
}

function CommonRules() {
  const { t } = useTranslation();
  const items = useList("guide.common.items");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("guide.common.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * Rollar qo'llanmasi.
 *
 * Sahifa HAMMAGA ochiq va ataylab: xodim o'zida qaysi huquq borligini va
 * uni qanday ishlatishni bilishi kerak. Ro'yxatdagi ruxsat kalitlari maxfiy
 * emas — ular katalogning bir qismi, haqiqiy himoya esa serverda.
 */
export function GuidePage() {
  const { t } = useTranslation();
  const { roles } = useAuth();
  const hasOwnGuide = ROLE_GUIDES.some((guide) => roles.some((role) => role.code === guide.code));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("guide.title")}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <BookOpen aria-hidden className="h-4 w-4" />
            {t("guide.subtitle")}
          </span>
        }
      />

      <Tabs defaultValue={hasOwnGuide ? "mine" : "all"}>
        <TabsList>
          <TabsTrigger value="mine">{t("guide.tabs.mine")}</TabsTrigger>
          <TabsTrigger value="all">{t("guide.tabs.all")}</TabsTrigger>
          <TabsTrigger value="common">{t("guide.tabs.common")}</TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          <MyAccess />
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-6">
            {ROLE_GUIDES.map((guide) => (
              <RoleCard
                key={guide.code}
                guide={guide}
                isMine={roles.some((role) => role.code === guide.code)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="common">
          <CommonRules />
        </TabsContent>
      </Tabs>
    </div>
  );
}
