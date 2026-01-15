"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import styles from "./login.module.css";

/**
 * MicroFounder Network — Magic Link Only Access
 * 
 * This page is intentionally minimal. Users receive access via:
 * 1. Admin approval → magic link email
 * 2. Direct magic link for returning members
 * 
 * No self-service signup. No public discovery.
 */

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/lounge";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for an access link.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>◆</div>
        <h1 className={styles.title}>MicroFounder Network</h1>
        <p className={styles.subtitle}>
          Enter your email to receive an access link
        </p>

        <form onSubmit={handleMagicLink} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.message}>{message}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Access Link"}
          </button>
        </form>

        <p className={styles.accessNote}>
          Access is by invitation only.<br />
          If you've been approved, enter your email above.
        </p>
      </div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>◆</div>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
