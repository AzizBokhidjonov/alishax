import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { BranchesTab } from "./components/BranchesTab";
import { HolidaysTab } from "./components/HolidaysTab";
import { ChangePasswordCard } from "./components/ChangePasswordCard";
import { GeneralTab } from "./components/GeneralTab";

export function SettingsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();

  return (
    <div className="space-y-6">
      <PageHeader title={t("settings.title")} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("settings.tabs.general")}</TabsTrigger>
          <TabsTrigger value="branches">{t("settings.tabs.branches")}</TabsTrigger>
          <TabsTrigger value="holidays">{t("settings.tabs.holidays")}</TabsTrigger>
          <TabsTrigger value="security">{t("settings.tabs.security")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab canManage={can(P.settingsManage)} />
        </TabsContent>
        <TabsContent value="branches">
          <BranchesTab canManage={can(P.branchManage)} />
        </TabsContent>
        <TabsContent value="holidays">
          <HolidaysTab canManage={can(P.holidayManage)} />
        </TabsContent>
        <TabsContent value="security">
          <ChangePasswordCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
