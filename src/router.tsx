import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { isApiError } from "./api";
import { routeTree } from "./routeTree.gen";

/**
 * So'rovlarning standart sozlamalari.
 *
 * Ilgari `new QueryClient()` sozlamasiz yaratilardi, ya'ni `staleTime: 0` —
 * har bir montajda ma'lumot eskirgan hisoblanib qayta so'ralardi. Sahifadan
 * chiqib qaytish ham montaj, shuning uchun jadval har safar qaytadan
 * yuklanardi.
 *
 * Endi ma'lumot bir daqiqa davomida yangi hisoblanadi: shu vaqt ichida
 * qaytilsa keshdan darhol chiziladi va so'rov ketmaydi. Yangilash kerak
 * bo'lsa — sahifadagi «Yangilash» tugmasi.
 */
const queryDefaults = {
  queries: {
    staleTime: 60_000,
    // Kesh so'nggi ishlatilishidan keyin ham 15 daqiqa saqlanadi — bo'limlar
    // orasida borib-kelish so'rov keltirib chiqarmaydi.
    gcTime: 15 * 60_000,
    // Boshqa oynadan qaytganda jimgina qayta so'rash operatorni chalg'itadi:
    // jadval ostidan o'zgarib ketadi. Yangilash aniq amal bo'lsin.
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    /*
      4xx — bu javob, xato emas: ruxsat yo'q yoki topilmadi. Uni uch marta
      takrorlash foydasiz va serverni bezovta qiladi. Faqat tarmoq va 5xx
      qayta uriniladi.
    */
    retry: (failureCount: number, error: unknown) => {
      if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
      return failureCount < 2;
    },
  },
} as const;

export const getRouter = () => {
  const queryClient = new QueryClient({ defaultOptions: queryDefaults });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
