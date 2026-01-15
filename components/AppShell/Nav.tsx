"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import type { UserRole } from "./AppShell";
import styles from "./AppShell.module.css";

interface NavProps {
  role: UserRole;
  email: string | null;
  currentPath: string;
}

export function Nav({ role, email, currentPath }: NavProps) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const isActive = (path: string) => currentPath === path;
  const isAdmin = role === "admin" || role === "founder";

  return (
    <nav className={styles.nav}>
      <div className={styles.navTop}>
        <Link href="/lounge" className={styles.navLogo}>
          <span className={styles.logoIcon}>◆</span>
          <span className={styles.logoName}>MicroFounder</span>
        </Link>

        <div className={styles.navLinks}>
          <Link 
            href="/lounge" 
            className={`${styles.navLink} ${isActive("/lounge") ? styles.navLinkActive : ""}`}
          >
            <span className={styles.navIcon}>⌂</span>
            <span>Lounge</span>
          </Link>

          <Link 
            href="/lounge?view=matches" 
            className={`${styles.navLink} ${currentPath.includes("matches") ? styles.navLinkActive : ""}`}
          >
            <span className={styles.navIcon}>⚡</span>
            <span>Matches</span>
          </Link>

          <Link 
            href="/lounge?view=circles" 
            className={`${styles.navLink} ${currentPath.includes("circles") ? styles.navLinkActive : ""}`}
          >
            <span className={styles.navIcon}>◎</span>
            <span>Circles</span>
          </Link>

          <Link 
            href="/lounge?view=profile" 
            className={`${styles.navLink} ${currentPath.includes("profile") ? styles.navLinkActive : ""}`}
          >
            <span className={styles.navIcon}>◇</span>
            <span>Profile</span>
          </Link>

          {isAdmin && (
            <>
              <div className={styles.navDivider} />
              
              <Link 
                href="/admin" 
                className={`${styles.navLink} ${isActive("/admin") ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navIcon}>⚙</span>
                <span>Admin</span>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className={styles.navBottom}>
        {role === "founder" && (
          <div className={styles.founderBadge}>Founder</div>
        )}
        
        <div className={styles.userInfo}>
          <span className={styles.userEmail}>{email}</span>
          <span className={styles.userRole}>{role}</span>
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}
