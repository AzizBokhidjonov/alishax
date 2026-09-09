import { SCHEDULE } from "../constants";
import { Reveal } from "./Reveal";

export function ScheduleSection() {
  return (
    <section id="kun-tartibi" className="bg-card py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-berry-ink">
            Kun tartibi
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            Bir kun bog'chada
          </h2>
        </Reveal>

        <ol className="relative mt-10 space-y-4 border-l-2 border-dashed border-brand/40 pl-6">
          {SCHEDULE.map((item, index) => (
            <li key={item.time}>
              <Reveal delay={index * 60}>
                <div className="group relative rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md">
                  <span className="absolute -left-[1.95rem] top-6 h-3 w-3 rounded-full bg-brand ring-4 ring-card transition-transform group-hover:scale-150" />
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-brand/20 px-3 py-1 text-sm font-bold text-brand-foreground">
                      {item.time}
                    </span>
                    <span className="font-medium">{item.title}</span>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
