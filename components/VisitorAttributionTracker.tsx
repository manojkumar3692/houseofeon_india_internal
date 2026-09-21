"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureVisitorAttribution } from "@/lib/visitorAttribution";

export default function VisitorAttributionTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname?.startsWith("/admin")) captureVisitorAttribution();
  }, [pathname]);
  return null;
}
