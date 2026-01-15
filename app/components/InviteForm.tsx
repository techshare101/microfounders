"use client";

import { useState } from "react";
import { submitInviteRequest } from "../actions";
import styles from "./InviteForm.module.css";

export default function InviteForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    const result = await submitInviteRequest(formData);
    
    if (result.success) {
      setStatus("success");
      setMessage(result.message || "You're on the list.");
    } else {
      setStatus("error");
      setMessage(result.error || "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.success}>
        <p className={styles.successMessage}>{message}</p>
        <p className={styles.successNote}>We'll reach out when there's room.</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          required
          className="mf-input"
          disabled={status === "loading"}
        />
      </div>
      <div className={styles.field}>
        <textarea
          name="whatBuilding"
          placeholder="What are you building? (optional)"
          rows={2}
          className="mf-input"
          disabled={status === "loading"}
        />
      </div>
      {status === "error" && (
        <p className={styles.error}>{message}</p>
      )}
      <button 
        type="submit" 
        className={styles.button}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Sending..." : "Request an invite"}
      </button>
    </form>
  );
}
