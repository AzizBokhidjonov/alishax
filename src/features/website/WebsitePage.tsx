import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CloudUpload, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { RefreshButton } from "@/components/common/RefreshButton";
import { TableSkeleton } from "@/components/common/TableCard";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { formatDateTime } from "@/lib/dates";
import { BlockList } from "./components/BlockList";
import { SeoPanel } from "./components/SeoPanel";
import { VersionsPanel } from "./components/VersionsPanel";
import { useBlockTypes, useLandingDraft, usePublishLanding } from "./api";

/**
 * Chop etish oynasi.
 *
 * Bu ilovadagi kam sonli amallardan biri — natijasi OCHIQ INTERNETDA
 * ko'rinadi. Shuning uchun tasdiq matni aynan shuni aytadi va izoh maydoni
 * shu yerda: izoh versiyalar tarixida qoladi va «nima o'zgardi» degan
 * savolga keyin javob beradi (§4).
 */
function PublishDialog({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const publish = usePublishLanding();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11" disabled={disabled}>
          <CloudUpload className="mr-2 h-4 w-4" />
          {t("website.publish.action")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("website.publish.action")}</DialogTitle>
          <DialogDescription>{t("website.publish.confirm")}</DialogDescription>
        </DialogHeader>
        <Textarea
          rows={2}
          placeholder={t("website.publish.note")}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            disabled={publish.isPending}
            onClick={() =>
              publish.mutate(
                { note: note.trim() || undefined },
                {
                  onSuccess: () => {
                    setNote("");
                    setOpen(false);
                  },
                },
              )
            }
          >
            {t("website.publish.action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Sayt muharriri (Landing spec §9).
 *
 * Modelning o'zi bitta jumla: sahifa — tartiblangan tipli bloklar ro'yxati;
 * muharrir QORALAMANI o'zgartiradi; chop etish qoralamani tashrif
 * buyuruvchi ko'radigan nusxaga muzlatadi. Shu sababli bu ekrandagi hech
 * bir saqlash jonli saytga tegmaydi va buni ekran ochiq aytadi.
 */
export function WebsitePage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canPublish = can(P.landingPublish);

  const draft = useLandingDraft();
  const catalog = useBlockTypes();
  const locales = catalog.data?.locales ?? ["uz", "ru", "en"];

  const dirty = draft.data?.hasUnpublishedChanges ?? false;

  /*
    Chop etilmagan o'zgarish bor ekan, sahifadan chiqishda brauzer
    ogohlantiradi. Muharrir «saqladim, demak sayt yangilandi» deb o'ylashi
    mumkin — ogohlantirish shu tushunmovchilikni ushlaydi (§9).
  */
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("website.title")}
        subtitle={
          draft.data?.publishedAt
            ? t("website.publishedAt", {
                version: draft.data.publishedVersion ?? draft.data.version,
                at: formatDateTime(draft.data.publishedAt),
              })
            : t("website.neverPublished")
        }
      >
        <RefreshButton
          onRefresh={() => void draft.refetch()}
          isFetching={draft.isFetching}
          updatedAt={draft.dataUpdatedAt}
        />
        <Button variant="outline" className="h-11" asChild>
          <Link to="/" target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("website.openSite")}
          </Link>
        </Button>
        {/* Chop etish huquqi yo'q bo'lsa tugma o'chirilmaydi — KO'RSATILMAYDI (§2). */}
        {canPublish ? <PublishDialog disabled={!dirty} /> : null}
      </PageHeader>

      {dirty ? (
        <div className="rounded-xl border border-st-info-border bg-st-info-soft px-4 py-2.5 text-sm font-medium text-st-info-fg">
          {canPublish ? t("website.dirty") : t("website.dirtyNoPublish")}
        </div>
      ) : null}

      <QueryState
        isLoading={draft.isLoading}
        error={draft.error}
        onRetry={() => void draft.refetch()}
        skeleton={<TableSkeleton columns={3} rows={4} />}
      >
        <Tabs defaultValue="blocks">
          <TabsList>
            <TabsTrigger value="blocks">{t("website.tabs.blocks")}</TabsTrigger>
            <TabsTrigger value="seo">{t("website.tabs.seo")}</TabsTrigger>
            <TabsTrigger value="versions">{t("website.tabs.versions")}</TabsTrigger>
          </TabsList>

          <TabsContent value="blocks">
            <BlockList blocks={draft.data?.blocks ?? []} catalog={catalog.data} locales={locales} />
          </TabsContent>

          <TabsContent value="seo">
            {/* `key` — tiklashdan keyin forma yangi qiymatlar bilan qayta quriladi. */}
            <SeoPanel key={draft.dataUpdatedAt} seo={draft.data?.seo ?? {}} locales={locales} />
          </TabsContent>

          <TabsContent value="versions">
            <VersionsPanel
              canPublish={canPublish}
              currentVersion={draft.data?.publishedVersion ?? null}
            />
          </TabsContent>
        </Tabs>
      </QueryState>
    </div>
  );
}
