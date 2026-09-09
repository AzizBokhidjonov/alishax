import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  /** Qadamning kaliti — joriy qadamni aniqlash uchun. */
  key: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  /** Joriy qadamning kaliti. */
  current: string;
  className?: string;
}

/**
 * Ko'p bosqichli oqimlarning yuqorisidagi qadamlar chizig'i.
 *
 * Ilgari qadamlar uchta nishon (badge) bo'lib turardi: ular qaysi biri
 * bajarilgani, qaysi biri hozir ochiqligi va nechta qadam qolganini
 * ko'rsatmasdi. Bu yerda uchala savol ham bir qarashda javob topadi —
 * bajarilgan qadamda belgi, joriysida to'ldirilgan amber doira, keyingilarida
 * bo'sh doira; ular orasidagi chiziq esa o'tilgan yo'lni bo'yaydi.
 */
export function Stepper({ steps, current, className }: StepperProps) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === current),
  );

  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;

        return (
          <Fragment key={step.key}>
            {index > 0 ? (
              <li aria-hidden className="mx-2 h-px min-w-4 flex-1 overflow-hidden bg-border">
                <span
                  className={cn(
                    "block h-full origin-left bg-brand transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    done || active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </li>
            ) : null}

            <li
              className="flex shrink-0 items-center gap-2"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition-colors duration-300",
                  done && "border-brand bg-brand text-brand-foreground",
                  active &&
                    "animate-[step-pop_0.4s_ease-out] border-brand bg-brand text-brand-foreground",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check aria-hidden className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm transition-colors duration-300 sm:block",
                  active ? "font-bold text-foreground" : "font-medium text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
