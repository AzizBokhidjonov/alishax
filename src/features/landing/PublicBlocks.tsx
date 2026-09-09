import { Quote } from "lucide-react";
import type { PublicBlock, PublicLandingPage } from "@/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "./components/Reveal";

/**
 * Chop etilgan bloklarni chizish (Landing spec §6).
 *
 * Ommaviy javobda matn BITTA tilga yassilangan va tarjimasi bo'lmagan maydon
 * `null` bo'lib keladi — kalit esa qoladi. Shuning uchun har bir qiymat
 * `text()` orqali o'qiladi: `null`, bo'sh satr va yo'q maydon bir xil
 * qaraladi va blok bo'sh sarlavha bilan chizilmaydi.
 */
function text(content: Record<string, unknown>, key: string): string | undefined {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function list(content: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const value = content[key];
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function strings(content: Record<string, unknown>, key: string): string[] {
  const value = content[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/** Rasm manzili — ommaviy yo'l orqali, tokensiz (§5). */
type MediaUrl = (fileId: unknown) => string | undefined;

function SectionTitle({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <Reveal>
      <h2 className="text-center text-3xl font-bold md:text-4xl">{children}</h2>
    </Reveal>
  );
}

function Section({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-6", className)}>
      {children}
    </section>
  );
}

function HeroBlock({ block, media }: { block: PublicBlock; media: MediaUrl }) {
  const image = media(block.content.imageFileId);
  const label = text(block.content, "ctaLabel");
  const href = text(block.content, "ctaHref");

  return (
    <Section id={block.type} className="grid items-center gap-8 md:grid-cols-2">
      <Reveal className="space-y-5">
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          {text(block.content, "title")}
        </h1>
        {text(block.content, "subtitle") ? (
          <p className="text-lg text-muted-foreground">{text(block.content, "subtitle")}</p>
        ) : null}
        {label && href ? (
          <Button asChild className="h-12 rounded-full bg-brand px-6 text-brand-foreground">
            <a href={href}>{label}</a>
          </Button>
        ) : null}
      </Reveal>
      {image ? (
        <Reveal delay={100}>
          <img src={image} alt="" className="w-full rounded-3xl object-cover shadow-lg" />
        </Reveal>
      ) : null}
    </Section>
  );
}

function AboutBlock({ block, media }: { block: PublicBlock; media: MediaUrl }) {
  const image = media(block.content.imageFileId);
  return (
    <Section id={block.type} className="grid items-center gap-8 md:grid-cols-2">
      <Reveal className="space-y-4">
        {text(block.content, "title") ? (
          <h2 className="text-3xl font-bold md:text-4xl">{text(block.content, "title")}</h2>
        ) : null}
        <p className="whitespace-pre-line text-muted-foreground">{text(block.content, "body")}</p>
      </Reveal>
      {image ? (
        <Reveal delay={100}>
          <img src={image} alt="" className="w-full rounded-3xl object-cover shadow-lg" />
        </Reveal>
      ) : null}
    </Section>
  );
}

function FeaturesBlock({ block, media }: { block: PublicBlock; media: MediaUrl }) {
  return (
    <Section id={block.type} className="space-y-8">
      <SectionTitle>{text(block.content, "title")}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list(block.content, "items").map((item, index) => {
          const image = media(item.imageFileId);
          return (
            <Reveal key={index} delay={index * 60}>
              <article className="h-full rounded-3xl border border-border bg-card p-6 shadow-sm">
                {image ? (
                  <img src={image} alt="" className="mb-4 h-32 w-full rounded-2xl object-cover" />
                ) : null}
                <h3 className="text-lg font-bold">{text(item, "title")}</h3>
                {text(item, "description") ? (
                  <p className="mt-2 text-sm text-muted-foreground">{text(item, "description")}</p>
                ) : null}
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

function GalleryBlock({ block, media }: { block: PublicBlock; media: MediaUrl }) {
  return (
    <Section id={block.type} className="space-y-8">
      <SectionTitle>{text(block.content, "title")}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list(block.content, "images").map((item, index) => {
          const image = media(item.fileId);
          if (!image) return null;
          return (
            <Reveal key={index} delay={index * 40}>
              <figure className="overflow-hidden rounded-2xl">
                <img
                  src={image}
                  alt={text(item, "caption") ?? ""}
                  className="h-56 w-full object-cover"
                />
                {text(item, "caption") ? (
                  <figcaption className="p-2 text-center text-sm text-muted-foreground">
                    {text(item, "caption")}
                  </figcaption>
                ) : null}
              </figure>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

function TeachersBlock({ block, media }: { block: PublicBlock; media: MediaUrl }) {
  return (
    <Section id={block.type} className="space-y-8">
      <SectionTitle>{text(block.content, "title")}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list(block.content, "people").map((person, index) => {
          const photo = media(person.photoFileId);
          return (
            <Reveal key={index} delay={index * 60}>
              <article className="h-full rounded-3xl border border-border bg-card p-5 text-center shadow-sm">
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    className="mx-auto mb-3 h-28 w-28 rounded-full object-cover"
                  />
                ) : null}
                <h3 className="font-bold">{text(person, "name")}</h3>
                {text(person, "role") ? (
                  <p className="text-sm text-brand-ink">{text(person, "role")}</p>
                ) : null}
                {text(person, "bio") ? (
                  <p className="mt-2 text-sm text-muted-foreground">{text(person, "bio")}</p>
                ) : null}
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

function PricingBlock({ block }: { block: PublicBlock }) {
  return (
    <Section id={block.type} className="space-y-8">
      <SectionTitle>{text(block.content, "title")}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list(block.content, "plans").map((plan, index) => (
          <Reveal key={index} delay={index * 60}>
            <article
              className={cn(
                "h-full rounded-3xl border p-6 shadow-sm",
                plan.highlighted ? "border-brand bg-brand-soft" : "border-border bg-card",
              )}
            >
              <h3 className="text-lg font-bold">{text(plan, "name")}</h3>
              {/* Narx — marketing MATNI, pul emas: hech qanday formatlash yo'q (§10.7). */}
              <p className="mt-2 text-2xl font-extrabold">{text(plan, "price")}</p>
              {text(plan, "description") ? (
                <p className="mt-2 text-sm text-muted-foreground">{text(plan, "description")}</p>
              ) : null}
            </article>
          </Reveal>
        ))}
      </div>
      {text(block.content, "note") ? (
        <p className="text-center text-sm text-muted-foreground">{text(block.content, "note")}</p>
      ) : null}
    </Section>
  );
}

function TestimonialsBlock({ block, media }: { block: PublicBlock; media: MediaUrl }) {
  return (
    <Section id={block.type} className="space-y-8">
      <SectionTitle>{text(block.content, "title")}</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list(block.content, "items").map((item, index) => {
          const photo = media(item.photoFileId);
          return (
            <Reveal key={index} delay={index * 60}>
              <blockquote className="h-full rounded-3xl border border-border bg-card p-6 shadow-sm">
                <Quote aria-hidden className="mb-3 h-6 w-6 text-brand" />
                <p className="text-sm">{text(item, "quote")}</p>
                <footer className="mt-4 flex items-center gap-3">
                  {photo ? (
                    <img src={photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : null}
                  <span>
                    <span className="block text-sm font-bold">{text(item, "author")}</span>
                    {text(item, "role") ? (
                      <span className="block text-xs text-muted-foreground">
                        {text(item, "role")}
                      </span>
                    ) : null}
                  </span>
                </footer>
              </blockquote>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

function FaqBlock({ block }: { block: PublicBlock }) {
  return (
    <Section id={block.type} className="space-y-6">
      <SectionTitle>{text(block.content, "title")}</SectionTitle>
      <div className="mx-auto max-w-3xl space-y-2">
        {list(block.content, "items").map((item, index) => (
          <Reveal key={index} delay={index * 40}>
            {/* Ochiladigan ro'yxat — brauzerning o'z elementi: klaviatura va qidiruv bilan ishlaydi. */}
            <details className="group rounded-2xl border border-border bg-card p-4">
              <summary className="cursor-pointer list-none font-semibold">
                {text(item, "question")}
              </summary>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {text(item, "answer")}
              </p>
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function ContactsBlock({ block }: { block: PublicBlock }) {
  const map = text(block.content, "mapEmbedUrl");
  return (
    <Section id={block.type} className="space-y-8">
      <SectionTitle>{text(block.content, "title")}</SectionTitle>
      <div className="grid gap-6 md:grid-cols-2">
        <Reveal className="space-y-3">
          {text(block.content, "address") ? (
            <p className="text-lg font-medium">{text(block.content, "address")}</p>
          ) : null}
          {strings(block.content, "phones").map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="block text-lg font-bold text-brand-ink hover:underline"
            >
              {phone}
            </a>
          ))}
          {text(block.content, "email") ? (
            <a href={`mailto:${text(block.content, "email")}`} className="block hover:underline">
              {text(block.content, "email")}
            </a>
          ) : null}
          {text(block.content, "workingHours") ? (
            <p className="text-muted-foreground">{text(block.content, "workingHours")}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            {list(block.content, "social").map((item, index) => {
              const url = text(item, "url");
              if (!url) return null;
              return (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  {text(item, "platform") ?? url}
                </a>
              );
            })}
          </div>
        </Reveal>
        {map ? (
          <Reveal delay={100}>
            <iframe
              src={map}
              title={text(block.content, "title") ?? "map"}
              loading="lazy"
              className="h-72 w-full rounded-3xl border border-border"
            />
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}

function CtaBlock({ block }: { block: PublicBlock }) {
  const label = text(block.content, "buttonLabel");
  const href = text(block.content, "buttonHref");
  return (
    <Section id={block.type}>
      <Reveal className="rounded-3xl bg-brand px-6 py-12 text-center text-brand-foreground">
        <h2 className="text-3xl font-bold md:text-4xl">{text(block.content, "title")}</h2>
        {text(block.content, "subtitle") ? (
          <p className="mx-auto mt-3 max-w-2xl opacity-90">{text(block.content, "subtitle")}</p>
        ) : null}
        {label && href ? (
          <Button asChild variant="secondary" className="mt-6 h-12 rounded-full px-6">
            <a href={href}>{label}</a>
          </Button>
        ) : null}
      </Reveal>
    </Section>
  );
}

function StatsBlock({ block }: { block: PublicBlock }) {
  return (
    <Section id={block.type} className="space-y-8">
      <SectionTitle>{text(block.content, "title")}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list(block.content, "items").map((item, index) => (
          <Reveal key={index} delay={index * 60}>
            <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
              {/* Qiymat — oddiy satr: «7+», «98%» (§3). */}
              <div className="text-3xl font-extrabold text-brand-ink">{text(item, "value")}</div>
              <div className="mt-1 text-sm text-muted-foreground">{text(item, "label")}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/**
 * Noma'lum tur — sayt SINMAYDI, blok shunchaki chizilmaydi.
 * Server yangi tur qo'shsa, u frontend yangilanmaguncha ko'rinmaydi.
 */
export function PublicBlockView({ block, page }: { block: PublicBlock; page: PublicLandingPage }) {
  const media: MediaUrl = (fileId) =>
    typeof fileId === "string" && fileId ? `${page.mediaBaseUrl}/${fileId}` : undefined;

  switch (block.type) {
    case "hero":
      return <HeroBlock block={block} media={media} />;
    case "about":
      return <AboutBlock block={block} media={media} />;
    case "features":
      return <FeaturesBlock block={block} media={media} />;
    case "gallery":
      return <GalleryBlock block={block} media={media} />;
    case "teachers":
      return <TeachersBlock block={block} media={media} />;
    case "pricing":
      return <PricingBlock block={block} />;
    case "testimonials":
      return <TestimonialsBlock block={block} media={media} />;
    case "faq":
      return <FaqBlock block={block} />;
    case "contacts":
      return <ContactsBlock block={block} />;
    case "cta":
      return <CtaBlock block={block} />;
    case "stats":
      return <StatsBlock block={block} />;
    default:
      return null;
  }
}
