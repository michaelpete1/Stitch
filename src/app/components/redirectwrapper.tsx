// src/components/RedirectWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function RedirectWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        const session = data.session;

        if (error || !session) {
          router.replace("/signuppage");
        } else if (session && pathname === "/signuppage") {
          router.replace("/");
        }
      } catch {
        router.replace("/signuppage");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [pathname, router]);

  if (loading) return null; // Or a loading spinner

  return <>{children}</>;
}
