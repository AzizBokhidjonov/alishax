import { useEffect, useState } from "react";
import { acquireFileUrl, releaseFileUrl } from "@/lib/files";

/**
 * `fileId` uchun object URL beradi va komponent yechilganda uni bo'shatadi
 * (Dizayn qo'llanmasi §4.4). Havola keshlanadi — bir xil rasm ro'yxatda ko'p
 * marta uchrasa ham bir marta yuklanadi.
 */
export function useFileObjectUrl(fileId?: string | null): {
  url?: string;
  loading: boolean;
  failed: boolean;
} {
  const [url, setUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(Boolean(fileId));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!fileId) {
      setUrl(undefined);
      setLoading(false);
      setFailed(false);
      return;
    }

    let active = true;
    setLoading(true);
    setFailed(false);

    acquireFileUrl(fileId)
      .then((next) => {
        if (active) {
          setUrl(next);
          return;
        }
        // Komponent javob kelguncha yechildi — havolani darhol bo'shatamiz.
        releaseFileUrl(fileId);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      // `acquire` muvaffaqiyatli bo'lgan bo'lsa — hisobni kamaytiramiz.
      releaseFileUrl(fileId);
    };
  }, [fileId]);

  return { url, loading, failed };
}
