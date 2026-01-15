"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { hasFounderOverride } from "../../lib/auth/founder-override";
import styles from "./onboarding.module.css";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasPassport, setHasPassport] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login?redirect=/onboarding");
      return;
    }

    setUserEmail(user.email || null);

    // Founder override - go directly to lounge
    if (hasFounderOverride(user.email)) {
      router.push("/lounge");
      return;
    }

    // Check if user already has a passport
    const { data: passport } = await supabase
      .from("mf_founder_passports")
      .select("id, status, onboarding_completed")
      .eq("email", user.email)
      .single();

    if (passport) {
      setHasPassport(true);
      
      if (passport.onboarding_completed) {
        // Fully onboarded - go to lounge
        router.push("/lounge");
        return;
      }
      
      // Has passport but not completed onboarding - show continue button
      setOnboardingComplete(false);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // If user has passport, show continue onboarding
  if (hasPassport) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>◆</div>
          <h1 className={styles.title}>Complete Your Profile</h1>
          <p className={styles.subtitle}>
            You've been approved! Let's set up your Founder Passport.
          </p>

          <div className={styles.status}>
            <div className={styles.statusIcon}>✓</div>
            <h2 className={styles.statusTitle} style={{ color: "#4caf50" }}>Approved</h2>
            <p className={styles.statusText}>
              Welcome, <strong>{userEmail}</strong>. Complete your profile to access the Lounge.
            </p>
          </div>

          <button
            className={styles.continueBtn}
            onClick={() => router.push("/onboarding/stepper")}
          >
            Complete Profile →
          </button>

          <button
            className={styles.signOutBtn}
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/");
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // No passport - pending review
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>◆</div>
        <h1 className={styles.title}>Welcome to MicroFounder</h1>
        <p className={styles.subtitle}>
          Your application is being reviewed.
        </p>

        <div className={styles.status}>
          <div className={styles.statusIcon}>⏳</div>
          <h2 className={styles.statusTitle}>Pending Review</h2>
          <p className={styles.statusText}>
            We're reviewing your application for <strong>{userEmail}</strong>.
            You'll receive an email once you're approved.
          </p>
        </div>

        <div className={styles.info}>
          <h3 className={styles.infoTitle}>What happens next?</h3>
          <ul className={styles.infoList}>
            <li>Our team reviews your application</li>
            <li>You'll receive an approval email</li>
            <li>Complete your Founder Passport</li>
            <li>Access the Lounge and start connecting</li>
          </ul>
        </div>

        <button
          className={styles.signOutBtn}
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
