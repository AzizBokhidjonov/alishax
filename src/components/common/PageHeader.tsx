import type { ReactNode } from "react";

/** Sahifa sarlavhasi va o'ng tomondagi amallar. Barcha sahifalarda bir xil. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>

      {/*
        Amallar BITTA guruh bo'lib turadi.

        Ilgari ular to'g'ridan-to'g'ri `justify-between` konteynerining
        bolalari edi: ikkita tugma berilganda brauzer ularni sarlavha bilan
        birga qatorga YOYIB tashlardi va «Yangilash» sahifaning o'rtasida,
        «Qo'shish» dan uzoqda osilib qolardi. Endi ular bir konteynerda —
        qanchasi bo'lishidan qat'i nazar, o'ng chetda yonma-yon turadi.
      */}
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
