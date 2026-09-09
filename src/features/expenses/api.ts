import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  expensesApi,
  type CreateExpenseDto,
  type PayExpenseDto,
  type UpdateExpenseDto,
} from "@/api";
import type { ExpenseListParams } from "@/api/endpoints/misc";
import { qk, useApiMutation } from "@/lib/query";

export function useExpenses(params: ExpenseListParams) {
  return useQuery({
    queryKey: qk.expenses(params),
    queryFn: () => expensesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useExpenseSummary(year: number) {
  return useQuery({
    queryKey: qk.expenseSummary(year),
    queryFn: () => expensesApi.summary(year),
  });
}

export function useCreateExpense() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateExpenseDto) => expensesApi.create(dto),
    successMessage: t("common.state.created"),
    invalidate: [["expenses"]],
  });
}

export function useUpdateExpense() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseDto }) => expensesApi.update(id, dto),
    successMessage: t("common.state.updated"),
    invalidate: [["expenses"]],
  });
}

export function usePayExpense() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PayExpenseDto }) => expensesApi.pay(id, dto),
    successMessage: t("expenses.pay.done"),
    invalidate: [["expenses"]],
  });
}
