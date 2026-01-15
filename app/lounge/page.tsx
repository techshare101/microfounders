"use client";

import { useState } from "react";
import styles from "./lounge.module.css";

type NavSection = "home" | "matches" | "circles" | "profile";

export default function LoungePage() {
  const [activeNav, setActiveNav] = useState<NavSection>("home");

  // Mock data for demonstration
  const mockMatches = [
    {
      id: "1",
      name: "Sarah Chen",
      initials: "SC",
      project: "AI-powered design tool",
      score: 87,
      reasons: ["Complementary skills", "Same timezone", "Both building"],
    },
    {
      id: "2",
      name: "Marcus Johnson",
      initials: "MJ",
      project: "Developer productivity SaaS",
      score: 82,
      reasons: ["Needs your expertise", "Similar stage"],
    },
  ];

  const mockCircles = [
    {
      id: "1",
      name: "Forge Circle 7A2B",
      status: "active",
      members: ["SC", "MJ", "AK", "LP"],
      nextMeeting: "Tomorrow, 2pm",
      rotationDate: "Mar 15",
    },
  ];

  const mockActivity = [
    { id: "1", content: "Sarah accepted your match request", time: "2 hours ago" },
    { id: "2", content: "New circle forming — you're invited", time: "Yesterday" },
    { id: "3", content: "Marcus shared feedback on your project", time: "2 days ago" },
  ];

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
            <div className={styles.userAvatar}>VV</div>
            <div>
              <div className={styles.userName}>Vodoua-Viagbo</div>
              <div className={styles.userStatus}>Founding Member</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.greeting}>Good evening, Vodoua-Viagbo</h1>
          <p className={styles.subGreeting}>Your network is quiet and intentional.</p>
        </header>

        {/* Match Queue */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Suggested Matches</h2>
            <button className={styles.sectionAction}>View all</button>
          </div>

          {mockMatches.length > 0 ? (
            <div className={styles.matchQueue}>
              {mockMatches.map((match) => (
                <div key={match.id} className={styles.matchCard}>
                  <div className={styles.matchHeader}>
                    <div className={styles.matchAvatar}>{match.initials}</div>
                    <div className={styles.matchInfo}>
                      <p className={styles.matchName}>{match.name}</p>
                      <p className={styles.matchProject}>{match.project}</p>
                    </div>
                    <div className={styles.matchScore}>{match.score}%</div>
                  </div>
                  <div className={styles.matchReasons}>
                    {match.reasons.map((reason, i) => (
                      <span key={i} className={styles.matchReason}>{reason}</span>
                    ))}
                  </div>
                  <div className={styles.matchActions}>
                    <button className={`${styles.matchBtn} ${styles.matchBtnAccept}`}>
                      Connect
                    </button>
                    <button className={`${styles.matchBtn} ${styles.matchBtnDecline}`}>
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

          {mockCircles.length > 0 ? (
            <div className={styles.circlesList}>
              {mockCircles.map((circle) => (
                <div key={circle.id} className={styles.circleCard}>
                  <div className={styles.circleHeader}>
                    <h3 className={styles.circleName}>{circle.name}</h3>
                    <span className={`${styles.circleStatus} ${styles.circleStatusActive}`}>
                      {circle.status}
                    </span>
                  </div>
                  <div className={styles.circleMembers}>
                    {circle.members.map((member, i) => (
                      <div key={i} className={styles.circleMemberAvatar}>{member}</div>
                    ))}
                  </div>
                  <div className={styles.circleMeta}>
                    <span>Next: {circle.nextMeeting}</span>
                    <span>Rotates: {circle.rotationDate}</span>
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
      </main>

      {/* Activity Panel */}
      <aside className={styles.activityPanel}>
        <header className={styles.activityHeader}>
          <h2 className={styles.activityTitle}>Recent Activity</h2>
        </header>

        <div className={styles.activityList}>
          {mockActivity.map((item) => (
            <div key={item.id} className={styles.activityItem}>
              <p className={styles.activityContent}>{item.content}</p>
              <span className={styles.activityTime}>{item.time}</span>
            </div>
          ))}
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
