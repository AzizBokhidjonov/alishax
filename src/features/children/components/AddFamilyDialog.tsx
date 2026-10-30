import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnrollGuardianStep } from "./EnrollGuardianStep";

export function AddFamilyDialog({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11">
          {t("flows.familyAdd")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("flows.familyAdd")}</DialogTitle>
          <DialogDescription>{t("flows.familyHint")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <EnrollGuardianStep
            childId={childId}
            onBusyChange={setBusy}
            onLinked={() => {
              void client.invalidateQueries({ queryKey: ["children"] });
              void client.invalidateQueries({ queryKey: ["guardians"] });
              void client.invalidateQueries({ queryKey: ["lookups"] });
              setOpen(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
