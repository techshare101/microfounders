"use client";

import { useState, useEffect } from "react";
import styles from "./lounge.module.css";
import { supabase } from "../../lib/supabase/client";
import {
  getPassportByEmail,
  getMatchesForPassport,
  getCirclesForPassport,
  getRecentActivity,
  getLoungeStats,
  respondToMatch,
  type FullPassport,
  type MatchWithFounder,
  type CircleWithMembers,
  type ActivityItem,
  type LoungeStats,
} from "./actions";
import { hasFounderOverride } from "../../lib/auth/founder-override";

type NavSection = "home" | "matches" | "circles" | "profile";

// Helper to get initials from name or email
function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

// Helper to format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function LoungePage() {
  const [activeNav, setActiveNav] = useState<NavSection>("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real data state
  const [passport, setPassport] = useState<FullPassport | null>(null);
  const [matches, setMatches] = useState<MatchWithFounder[]>([]);
  const [circles, setCircles] = useState<CircleWithMembers[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<LoungeStats | null>(null);
  const [processingMatch, setProcessingMatch] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        // Not authenticated - redirect to login
        window.location.href = "/login?redirect=/lounge";
        return;
      }

      const passportData = await getPassportByEmail(user.email);
      
      // Founder override bypasses all access checks
      const isFounder = hasFounderOverride(user.email);
      
      if (!passportData && !isFounder) {
        // No passport - redirect to onboarding
        window.location.href = "/onboarding";
        return;
      }
      
      if (passportData && passportData.passport.status !== "active" && !isFounder) {
        // Passport not active - redirect to onboarding
        window.location.href = "/onboarding";
        return;
      }

      setPassport(passportData);

      // Load all data in parallel
      const [matchesData, circlesData, activityData, statsData] = await Promise.all([
        getMatchesForPassport(passportData.passport.id),
        getCirclesForPassport(passportData.passport.id),
        getRecentActivity(passportData.passport.id),
        getLoungeStats(passportData.passport.id),
      ]);

      setMatches(matchesData);
      setCircles(circlesData);
      setActivity(activityData);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading lounge data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMatchResponse(matchId: string, response: "accepted" | "declined") {
    setProcessingMatch(matchId);
    const success = await respondToMatch(matchId, response);
    
    if (success) {
      // Remove from list
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    }
    
    setProcessingMatch(null);
  }

  // Get display name for greeting
  const displayName = passport?.passport.display_name || "Founder";

  return (
    <div className={styles.lounge}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>◆</div>
          <span className={styles.logoText}>MicroFounder</span>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeNav === "home" ? styles.navItemActive : ""}`}
            onClick={() => setActiveNav("home")}
          >
            <span>◇</span>
            <span>Home</span>
          </button>
          <button
            className={`${styles.navItem} ${activeNav === "matches" ? styles.navItemActive : ""}`}
            onClick={() => setActiveNav("matches")}
          >
            <span>⟷</span>
            <span>Matches</span>
          </button>
          <button
            className={`${styles.navItem} ${activeNav === "circles" ? styles.navItemActive : ""}`}
            onClick={() => setActiveNav("circles")}
          >
            <span>○</span>
            <span>Circles</span>
          </button>

          <div className={styles.navDivider} />

          <button
            className={`${styles.navItem} ${activeNav === "profile" ? styles.navItemActive : ""}`}
            onClick={() => setActiveNav("profile")}
          >
            <span>◎</span>
            <span>Profile</span>
          </button>
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {passport ? getInitials(passport.passport.display_name, passport.passport.email) : "--"}
            </div>
            <div>
              <div className={styles.userName}>
                {passport?.passport.display_name || passport?.passport.email || "Loading..."}
              </div>
              <div className={styles.userStatus}>
                {passport?.passport.tier ? `${passport.passport.tier.charAt(0).toUpperCase() + passport.passport.tier.slice(1)} Member` : "Member"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Loading your lounge...</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>{error}</p>
            <button className={styles.sectionAction} onClick={loadData}>Try again</button>
          </div>
        ) : !passport ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>◆</div>
            <p className={styles.emptyTitle}>Welcome to MicroFounder</p>
            <p className={styles.emptyText}>Complete your onboarding to access the Lounge.</p>
          </div>
        ) : (
          <>
        <header className={styles.header}>
          <h1 className={styles.greeting}>Good evening, {displayName}</h1>
          <p className={styles.subGreeting}>Your network is quiet and intentional.</p>
        </header>

        {/* Match Queue */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Suggested Matches</h2>
            <button className={styles.sectionAction}>View all</button>
          </div>

          {matches.length > 0 ? (
            <div className={styles.matchQueue}>
              {matches.map((match) => (
                <div key={match.id} className={styles.matchCard}>
                  <div className={styles.matchHeader}>
                    <div className={styles.matchAvatar}>
                      {getInitials(match.matchedFounder.displayName, match.matchedFounder.email)}
                    </div>
                    <div className={styles.matchInfo}>
                      <p className={styles.matchName}>
                        {match.matchedFounder.displayName || match.matchedFounder.email}
                      </p>
                      <p className={styles.matchProject}>
                        {match.matchedFounder.currentProject || "Building something"}
                      </p>
                    </div>
                    <div className={styles.matchScore}>{match.score}%</div>
                  </div>
                  <div className={styles.matchReasons}>
                    {match.matchReasons.map((reason, i) => (
                      <span key={i} className={styles.matchReason}>{reason}</span>
                    ))}
                  </div>
                  <div className={styles.matchActions}>
                    <button
                      className={`${styles.matchBtn} ${styles.matchBtnAccept}`}
                      onClick={() => handleMatchResponse(match.id, "accepted")}
                      disabled={processingMatch === match.id}
                    >
                      {processingMatch === match.id ? "..." : "Connect"}
                    </button>
                    <button
                      className={`${styles.matchBtn} ${styles.matchBtnDecline}`}
                      onClick={() => handleMatchResponse(match.id, "declined")}
                      disabled={processingMatch === match.id}
                    >
                      Not now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⟷</div>
              <p className={styles.emptyTitle}>No matches right now</p>
              <p className={styles.emptyText}>We'll notify you when someone aligns with your profile.</p>
            </div>
          )}
        </section>

        {/* Circles */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Circles</h2>
            <button className={styles.sectionAction}>Manage</button>
          </div>

          {circles.length > 0 ? (
            <div className={styles.circlesList}>
              {circles.map((circle) => (
                <div key={circle.id} className={styles.circleCard}>
                  <div className={styles.circleHeader}>
                    <h3 className={styles.circleName}>{circle.name}</h3>
                    <span className={`${styles.circleStatus} ${circle.status === "active" ? styles.circleStatusActive : styles.circleStatusForming}`}>
                      {circle.status}
                    </span>
                  </div>
                  <div className={styles.circleMembers}>
                    {circle.members.map((member) => (
                      <div key={member.id} className={styles.circleMemberAvatar}>
                        {getInitials(member.displayName, member.email)}
                      </div>
                    ))}
                  </div>
                  <div className={styles.circleMeta}>
                    <span>{circle.members.length} members</span>
                    {circle.rotationDate && (
                      <span>Rotates: {new Date(circle.rotationDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>○</div>
              <p className={styles.emptyTitle}>No circles yet</p>
              <p className={styles.emptyText}>You'll be invited to a circle once matches are confirmed.</p>
            </div>
          )}
        </section>
          </>
        )}
      </main>

      {/* Activity Panel */}
      <aside className={styles.activityPanel}>
        <header className={styles.activityHeader}>
          <h2 className={styles.activityTitle}>Recent Activity</h2>
        </header>

        <div className={styles.activityList}>
          {activity.length > 0 ? (
            activity.map((item) => (
              <div key={item.id} className={styles.activityItem}>
                <p className={styles.activityContent}>{item.content}</p>
                <span className={styles.activityTime}>{formatRelativeTime(item.createdAt)}</span>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No recent activity</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Navigation */}
      <nav className={styles.mobileNav}>
        <button
          className={`${styles.mobileNavItem} ${activeNav === "home" ? styles.mobileNavItemActive : ""}`}
          onClick={() => setActiveNav("home")}
        >
          <span className={styles.mobileNavIcon}>◇</span>
          <span className={styles.mobileNavLabel}>Home</span>
        </button>
        <button
          className={`${styles.mobileNavItem} ${activeNav === "matches" ? styles.mobileNavItemActive : ""}`}
          onClick={() => setActiveNav("matches")}
        >
          <span className={styles.mobileNavIcon}>⟷</span>
          <span className={styles.mobileNavLabel}>Matches</span>
        </button>
        <button
          className={`${styles.mobileNavItem} ${activeNav === "circles" ? styles.mobileNavItemActive : ""}`}
          onClick={() => setActiveNav("circles")}
        >
          <span className={styles.mobileNavIcon}>○</span>
          <span className={styles.mobileNavLabel}>Circles</span>
        </button>
        <button
          className={`${styles.mobileNavItem} ${activeNav === "profile" ? styles.mobileNavItemActive : ""}`}
          onClick={() => setActiveNav("profile")}
        >
          <span className={styles.mobileNavIcon}>◎</span>
          <span className={styles.mobileNavLabel}>Profile</span>
        </button>
      </nav>
    </div>
  );
}
