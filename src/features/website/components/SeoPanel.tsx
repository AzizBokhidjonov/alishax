import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { LandingSeo } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentEditor } from "./ContentFields";
import { contentFieldErrors } from "../content-errors";
import { useSaveSeo } from "../api";
import type { FieldSpec } from "../block-schema";

const SEO_FIELDS: FieldSpec[] = [
  { name: "title", kind: "i18n" },
  { name: "description", kind: "i18n", multiline: true },
  { name: "ogImageFileId", kind: "image" },
  { name: "canonicalUrl", kind: "url" },
];

/** Qidiruv va ijtimoiy tarmoqdagi ko'rinish (§4 `PUT /landing/seo`). */
export function SeoPanel({ seo, locales }: { seo: LandingSeo; locales: string[] }) {
  const { t } = useTranslation();
  const save = useSaveSeo();
  const [value, setValue] = useState<Record<string, unknown>>({ ...seo });
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("website.seo.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("website.seo.hint")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ContentEditor
          fields={SEO_FIELDS}
          locales={locales}
          value={value}
          onChange={setValue}
          errors={errors}
        />
        <Button
          className="h-11"
          disabled={save.isPending}
          onClick={() =>
            save.mutate(value as LandingSeo, {
              onSuccess: () => setErrors({}),
              onError: (error) => setErrors(contentFieldErrors(error)),
            })
          }
        >
          {t("common.actions.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
