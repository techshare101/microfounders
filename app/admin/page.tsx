"use client";

import { useEffect, useState } from "react";
import { getInviteRequests, updateInviteStatus, createPassportFromInvite } from "./actions";
import type { InviteRequest, InviteStatus, MembershipTier } from "../../lib/types/passport";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const [requests, setRequests] = useState<InviteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InviteStatus | "all">("pending");
  const [selectedRequest, setSelectedRequest] = useState<InviteRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [tierAssigned, setTierAssigned] = useState<MembershipTier>("member");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  async function loadRequests() {
    setLoading(true);
    const data = await getInviteRequests(filter === "all" ? undefined : filter);
    setRequests(data);
    setLoading(false);
  }

  async function handleApprove() {
    if (!selectedRequest) return;
    setProcessing(true);
    
    await updateInviteStatus(selectedRequest.id, "approved", {
      review_notes: reviewNotes,
      tier_assigned: tierAssigned,
    });
    
    await createPassportFromInvite(selectedRequest.id);
    
    setSelectedRequest(null);
    setReviewNotes("");
    await loadRequests();
    setProcessing(false);
  }

  async function handleDecline() {
    if (!selectedRequest) return;
    setProcessing(true);
    
    await updateInviteStatus(selectedRequest.id, "declined", {
      review_notes: reviewNotes,
    });
    
    setSelectedRequest(null);
    setReviewNotes("");
    await loadRequests();
    setProcessing(false);
  }

  async function handleWaitlist() {
    if (!selectedRequest) return;
    setProcessing(true);
    
    await updateInviteStatus(selectedRequest.id, "waitlisted", {
      review_notes: reviewNotes,
    });
    
    setSelectedRequest(null);
    setReviewNotes("");
    await loadRequests();
    setProcessing(false);
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Invite Review</h1>
        <p className={styles.subtitle}>MicroFounder Network · Admin</p>
      </header>

      <div className={styles.filters}>
        {(["all", "pending", "reviewing", "approved", "declined", "waitlisted"] as const).map((status) => (
          <button
            key={status}
            className={`${styles.filterBtn} ${filter === status ? styles.filterActive : ""}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.requestList}>
          {loading ? (
            <p className={styles.loading}>Loading...</p>
          ) : requests.length === 0 ? (
            <p className={styles.empty}>No requests found</p>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className={`${styles.requestCard} ${selectedRequest?.id === req.id ? styles.requestSelected : ""}`}
                onClick={() => {
                  setSelectedRequest(req);
                  setReviewNotes(req.review_notes || "");
                  setTierAssigned((req.tier_assigned as MembershipTier) || "member");
                }}
              >
                <div className={styles.requestHeader}>
                  <span className={styles.requestEmail}>{req.email}</span>
                  <span className={`${styles.requestStatus} ${styles[`status${req.status.charAt(0).toUpperCase() + req.status.slice(1)}`]}`}>
                    {req.status}
                  </span>
                </div>
                {req.what_building && (
                  <p className={styles.requestBuilding}>{req.what_building}</p>
                )}
                <div className={styles.requestMeta}>
                  <span>{formatDate(req.created_at)}</span>
                  {req.signal_score > 0 && (
                    <span className={styles.signalScore}>Signal: {req.signal_score}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.reviewPanel}>
          {selectedRequest ? (
            <>
              <h2 className={styles.panelTitle}>Review Application</h2>
              
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <p className={styles.value}>{selectedRequest.email}</p>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>What they're building</label>
                <p className={styles.value}>{selectedRequest.what_building || "Not specified"}</p>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Applied</label>
                <p className={styles.value}>{formatDate(selectedRequest.created_at)}</p>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Assign Tier</label>
                <select
                  className={styles.select}
                  value={tierAssigned}
                  onChange={(e) => setTierAssigned(e.target.value as MembershipTier)}
                >
                  <option value="founding">Founding Member</option>
                  <option value="member">Member</option>
                  <option value="resident">Resident</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Review Notes</label>
                <textarea
                  className={styles.textarea}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Internal notes about this applicant..."
                  rows={4}
                />
              </div>

              <div className={styles.actions}>
                <button
                  className={`${styles.actionBtn} ${styles.approveBtn}`}
                  onClick={handleApprove}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Approve"}
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.waitlistBtn}`}
                  onClick={handleWaitlist}
                  disabled={processing}
                >
                  Waitlist
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.declineBtn}`}
                  onClick={handleDecline}
                  disabled={processing}
                >
                  Decline
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <p>Select a request to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
