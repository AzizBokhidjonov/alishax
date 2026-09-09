import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectField } from "@/components/common/SelectField";
import { QueryState } from "@/components/common/QueryState";
import { groupStaffSchema, type GroupStaffFormValues } from "@/components/forms/schemas";
import { useUsers } from "@/features/users/api";
import { useGroupStaff, useSetGroupStaff } from "../api";

/**
 * Guruh xodimlari. Foydalanuvchilar ro'yxati `user:manage` ruxsatini talab
 * qilishi mumkin — ruxsat bo'lmasa ro'yxat bo'sh keladi va forma faqat
 * o'qish uchun qoladi.
 */
export function GroupStaffForm({ groupId, canManage }: { groupId: string; canManage: boolean }) {
  const { t } = useTranslation();
  const staff = useGroupStaff(groupId);
  const users = useUsers({ limit: 200, status: "active" });
  const save = useSetGroupStaff(groupId);

  const form = useForm<GroupStaffFormValues>({
    resolver: zodResolver(groupStaffSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (staff.data) form.reset(staff.data);
  }, [staff.data, form]);

  const options = (users.data?.data ?? []).map((user) => ({
    value: user.id,
    label: user.fullName,
  }));

  const submit = form.handleSubmit(async (values) => {
    await save.mutateAsync(values);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("groups.staff.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState isLoading={staff.isLoading} error={staff.error} rows={2}>
          <form onSubmit={(event) => void submit(event)} className="space-y-3">
            <SelectField
              label={t("groups.staff.mainTeacher")}
              value={form.watch("mainTeacherId") ?? ""}
              onChange={(value) => form.setValue("mainTeacherId", value)}
              options={options}
              disabled={!canManage}
            />
            <SelectField
              label={t("groups.staff.assistantTeacher")}
              value={form.watch("assistantTeacherId") ?? ""}
              onChange={(value) => form.setValue("assistantTeacherId", value)}
              options={options}
              disabled={!canManage}
            />
            <SelectField
              label={t("groups.staff.nurse")}
              value={form.watch("nurseId") ?? ""}
              onChange={(value) => form.setValue("nurseId", value)}
              options={options}
              disabled={!canManage}
            />
            {canManage ? (
              <div className="flex justify-end">
                <Button type="submit" className="h-11" disabled={save.isPending}>
                  {t("common.actions.save")}
                </Button>
              </div>
            ) : null}
          </form>
        </QueryState>
      </CardContent>
    </Card>
  );
}
