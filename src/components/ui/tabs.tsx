import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn, focusRing } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

/**
 * Ilova bo'ylab yagona tab uslubi: pastdan chegaralangan qator va faol
 * tabning ostidagi amber chizig'i.
 *
 * Ilgari tablar kulrang qutidagi tugmachalar edi. Bolaning kartasida
 * to'qqizta tab bor va ular qutiga sig'may ikki qatorga o'ralib, tugmalar
 * yig'indisiga o'xshab qolardi. Chiziqli tablar esa istalgan songa
 * cho'ziladi, o'ralganda ham qator bo'lib qoladi va "qayerdaman" degan
 * savolga aniq javob beradi.
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex w-full flex-wrap items-center gap-x-1 gap-y-0 border-b border-border",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Chiziq `after` da: u tabning to'liq kengligini egallaydi va
      // faollashganda chapdan o'ngga ochiladi.
      "group/tab relative -mb-px inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-t-lg px-3.5 text-sm font-semibold transition-colors",
      "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-brand after:transition-transform after:duration-300",
      "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      "data-[state=active]:text-foreground data-[state=active]:after:scale-x-100",
      "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
      focusRing,
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    /*
      Bu yerda kirish animatsiyasi YO'Q — ataylab.
      `data-[state=active]:animate-in` tab almashganda ham, komponent
      montaj bo'lganda ham ishlaydi. Ya'ni boshqa bo'limga o'tib qaytilganda
      tarkib har safar qaytadan «chiqib» kelardi va sahifa qayta
      yuklanayotgandek ko'rinardi. Tab almashgani pastdagi amber chizig'i
      bilan bildiriladi — u foydalanuvchi bosgandagina harakatlanadi.
    */
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

/** Tab yonidagi son — «Ota-onalar 3» kabi. */
function TabsCount({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums text-muted-foreground transition-colors group-data-[state=active]/tab:bg-brand-soft group-data-[state=active]/tab:text-brand-ink">
      {children}
    </span>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsCount };
