import { cn } from "@/lib/utils";
import { PROGRAMS } from "../constants";
import { Reveal } from "./Reveal";

export function ProgramsSection() {
  return (
    <section id="dasturlar" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-bold uppercase tracking-widest text-berry-ink">
            Dasturlar
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            O'ynab o'rganamiz
          </h2>
          <p className="mt-3 text-muted-foreground">
            Har bir yo'nalish yosh xususiyatiga moslangan va kun tartibiga uyg'un.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMS.map((program, index) => {
            const Icon = program.icon;
            return (
              <Reveal key={program.title} delay={index * 70}>
                <div className="group h-full rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-brand/50 hover:shadow-xl">
                  <span
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110",
                      program.tone,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{program.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{program.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
