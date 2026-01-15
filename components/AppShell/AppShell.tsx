"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { hasFounderOverride } from "../../lib/auth/founder-override";
import { isAdminEmail } from "../../lib/auth/types";
import { Nav } from "./Nav";
import styles from "./AppShell.module.css";

export type UserRole = "guest" | "pending" | "onboarding" | "member" | "admin" | "founder";

interface AppShellProps {
  children: React.ReactNode;
}

interface UserState {
  email: string | null;
  role: UserRole;
  passportId: string | null;
  onboardingComplete: boolean;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [userState, setUserState] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserState();
  }, [pathname]);

  async function checkUserState() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        setUserState({ email: null, role: "guest", passportId: null, onboardingComplete: false });
        setLoading(false);
        return;
      }

      const email = user.email;

      // Check founder override first
      if (hasFounderOverride(email)) {
        setUserState({ email, role: "founder", passportId: null, onboardingComplete: true });
        setLoading(false);
        return;
      }

      // Check admin
      if (isAdminEmail(email)) {
        setUserState({ email, role: "admin", passportId: null, onboardingComplete: true });
        setLoading(false);
        return;
      }

      // Check passport status
      const { data: passport } = await supabase
        .from("mf_founder_passports")
        .select("id, status, onboarding_completed")
        .eq("email", email)
        .single();

      if (!passport) {
        setUserState({ email, role: "pending", passportId: null, onboardingComplete: false });
        setLoading(false);
        return;
      }

      if (passport.status !== "active") {
        setUserState({ email, role: "pending", passportId: passport.id, onboardingComplete: false });
        setLoading(false);
        return;
      }

      if (!passport.onboarding_completed) {
        setUserState({ email, role: "onboarding", passportId: passport.id, onboardingComplete: false });
        setLoading(false);
        return;
      }

      setUserState({ email, role: "member", passportId: passport.id, onboardingComplete: true });
      setLoading(false);
    } catch (error) {
      console.error("Error checking user state:", error);
      setUserState({ email: null, role: "guest", passportId: null, onboardingComplete: false });
      setLoading(false);
    }
  }

  // Don't show shell on public pages
  const isPublicPage = pathname === "/" || pathname === "/login";
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>◆</div>
      </div>
    );
  }

  // Guest - no shell
  if (!userState || userState.role === "guest") {
    return <>{children}</>;
  }

  // Pending - minimal shell
  if (userState.role === "pending") {
    return (
      <div className={styles.shell}>
        <header className={styles.minimalHeader}>
          <span className={styles.logo}>◆</span>
          <span className={styles.logoText}>MicroFounder</span>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    );
  }

  // Onboarding - minimal shell with progress indicator
  if (userState.role === "onboarding") {
    return (
      <div className={styles.shell}>
        <header className={styles.minimalHeader}>
          <span className={styles.logo}>◆</span>
          <span className={styles.logoText}>MicroFounder</span>
          <span className={styles.badge}>Setting Up</span>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    );
  }

  // Member, Admin, Founder - full shell with nav
  return (
    <div className={styles.shell}>
      <Nav 
        role={userState.role} 
        email={userState.email} 
        currentPath={pathname}
      />
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
