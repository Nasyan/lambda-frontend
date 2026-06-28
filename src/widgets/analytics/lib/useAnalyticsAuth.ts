import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAccessToken,
  getInstanceUuidFromAccessToken,
} from "@/src/shared/lib/session";

export function useAnalyticsAuth() {
  const router = useRouter();
  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;

      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const uuid = getInstanceUuidFromAccessToken();
      if (!uuid) {
        setAuthError("В сессии отсутствует текущий инстанс (instance_uuid)");
        setIsAuthLoading(false);
        return;
      }

      setInstanceUuid(uuid);
      setIsAuthLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { instanceUuid, authError, isAuthLoading };
}
