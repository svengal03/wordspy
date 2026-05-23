"use client";
import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { WordRow } from "@/server/db/wordpacks";
import { WORD_PACKS } from "@playhub/core";
import { fetchGameWordPacks } from "@/lib/api";

export function useWordPackCache(game: string): {
  dbRowsRef: MutableRefObject<Record<string, WordRow[]>>;
  loading: boolean;
  error: string | null;
} {
  const dbRowsRef = useRef<Record<string, WordRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const nameToSlug: Record<string, string> = {};
    WORD_PACKS.forEach((wp) => { nameToSlug[wp.name] = wp.id; });
    fetchGameWordPacks(game)
      .then(({ packs, words }) => {
        if (!cancelled) {
          dbRowsRef.current = Object.fromEntries(
            packs.map((pack) => [nameToSlug[pack.name] ?? pack.id, words[pack.id] ?? []])
          );
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError((err as Error).message ?? "Failed to load word packs");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [game]);

  return { dbRowsRef, loading, error };
}
