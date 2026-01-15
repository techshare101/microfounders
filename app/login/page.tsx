"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import styles from "./login.module.css";

type AuthMode = "login" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/lounge";

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          router.push(redirect);
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
          },
        });

        if (error) {
          setError(error.message);
        } else {
          setMessage("Check your email for a confirmation link.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
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
        setMessage("Check your email for a magic link.");
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
          {mode === "login" ? "Welcome back" : "Join the network"}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
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

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
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
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <button
          type="button"
          className={styles.magicBtn}
          onClick={handleMagicLink}
          disabled={loading}
        >
          Send Magic Link
        </button>

        <p className={styles.switchMode}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                className={styles.switchBtn}
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className={styles.switchBtn}
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
            </>
          )}
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
