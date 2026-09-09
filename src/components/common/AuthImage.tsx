import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFileObjectUrl } from "@/hooks/use-file-url";
import { cn } from "@/lib/utils";

interface AuthImageProps {
  fileId?: string | null;
  alt?: string;
  className?: string;
  /** Rasm yo'q yoki yuklanmasa ko'rsatiladigan narsa (bosh harflar, ikonka). */
  fallback?: React.ReactNode;
}

/**
 * Himoyalangan rasm (Dizayn qo'llanmasi §4.4).
 *
 * `GET /files/:id` imzolangan havola bermaydi — server har so'rovda ruxsatni
 * tekshiradi. Shuning uchun `<img src="/api/v1/files/{id}">` 401 qaytaradi va
 * bola surati, olib ketuvchining surati hamda logotip faqat shu komponent
 * orqali ko'rsatiladi.
 */
export function AuthImage({ fileId, alt = "", className, fallback }: AuthImageProps) {
  const { url, loading } = useFileObjectUrl(fileId);

  if (url) return <img src={url} alt={alt} className={cn("object-cover", className)} />;

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground",
        loading && "animate-pulse",
        className,
      )}
      aria-hidden={alt ? undefined : true}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
    >
      {loading ? null : fallback}
    </div>
  );
}

/**
 * `Avatar` ichida ishlatiladigan himoyalangan rasm. `fileId` bo'yicha
 * yuklaydi; backend to'g'ridan-to'g'ri `src` bersa o'shani ishlatadi.
 * Rasm bo'lmasa `null` qaytaradi — shunda `AvatarFallback` ko'rinadi.
 */
export function AuthAvatarImage({
  fileId,
  src,
  alt = "",
}: {
  fileId?: string | null;
  src?: string | null;
  alt?: string;
}) {
  const { url } = useFileObjectUrl(fileId);
  const resolved = url ?? src ?? undefined;
  if (!resolved) return null;
  return <AvatarImage src={resolved} alt={alt} />;
}

/**
 * Surat + zaxira bosh harf — ro'yxatlarda takrorlanadigan ko'rinish.
 */
export function AuthAvatar({
  fileId,
  src,
  name,
  className,
}: {
  fileId?: string | null;
  src?: string | null;
  name?: string;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      <AuthAvatarImage fileId={fileId} src={src} />
      <AvatarFallback>{(name ?? "?").trim()[0] ?? "?"}</AvatarFallback>
    </Avatar>
  );
}
