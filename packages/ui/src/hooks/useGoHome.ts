"use client";
import { useRouter } from "next/navigation";

export function useGoHome() {
  const router = useRouter();
  return () => router.push("/");
}
