import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { BillingRulesTab } from "./components/BillingRulesTab";
import { BillingRunTab } from "./components/BillingRunTab";

export function BillingPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader title={t("billing.title")} subtitle={t("billing.preview.hint")} />
      <Tabs defaultValue="run">
        <TabsList>
          <TabsTrigger value="run">{t("billing.tabs.run")}</TabsTrigger>
          <TabsTrigger value="rules">{t("billing.tabs.rules")}</TabsTrigger>
        </TabsList>
        <TabsContent value="run">
          <BillingRunTab />
        </TabsContent>
        <TabsContent value="rules">
          <BillingRulesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
