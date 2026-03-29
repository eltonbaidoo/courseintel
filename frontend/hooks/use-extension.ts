import useSWR from "swr";
import { api } from "@/lib/api";

export function usePlatformHelp(platform: string | null) {
  return useSWR(
    platform ? ["extension/help", platform] : null,
    () => api.getPlatformHelp(platform!),
    { revalidateOnFocus: false },
  );
}

export function useOrchestration(platform: string | null, courseContext = "") {
  return useSWR(
    platform ? ["extension/orchestrate", platform, courseContext] : null,
    () => api.getOrchestration(platform!, courseContext),
    { revalidateOnFocus: false },
  );
}
