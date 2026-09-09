import { cn } from "@/lib/utils";

/**
 * Yuklanish o'rindig'i. Oddiy pulsatsiya o'rniga chapdan o'ngga o'tadigan
 * yorug'lik: u yo'nalishga ega, shuning uchun "kutilmoqda" degani aniqroq
 * o'qiladi. «Kamroq harakat» rejimida to'lqin to'xtaydi va yumshoq yuza
 * qoladi.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-secondary",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite]",
        "before:bg-[linear-gradient(90deg,transparent,var(--color-card),transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
