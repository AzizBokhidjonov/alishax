import { useTranslation } from "react-i18next";
import { useState } from "react";
import { SelectField } from "./SelectField";
import { Field } from "@/components/forms/FormDialog";
import { Input } from "@/components/ui/input";

import { RELATIONSHIPS } from "@/lib/relationships";

export function RelationshipField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const [other, setOther] = useState(
    Boolean(value && !(RELATIONSHIPS as readonly string[]).includes(value)),
  );
  return (
    <div className="space-y-3">
      <SelectField
        label={t("flows.relationship")}
        value={other ? "other" : value}
        onChange={(next) => {
          setOther(next === "other");
          onChange(next === "other" ? "" : next);
        }}
        options={[...RELATIONSHIPS, "other"].map((key) => ({
          value: key,
          label: t(`flows.relationships.${key}`),
        }))}
        error={other ? undefined : error}
      />
      {other ? (
        <Field label={t("flows.relationshipOther")} error={error}>
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
        </Field>
      ) : null}
    </div>
  );
}
