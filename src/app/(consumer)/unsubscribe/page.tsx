"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft, Mail, Loader2, Check } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");
  const emailParam = searchParams.get("email") || "";

  const [resubscribing, setResubscribing] = useState(false);
  const [resubscribed, setResubscribed] = useState(false);
  const [manualEmail, setManualEmail] = useState(emailParam);
  const [manualStatus, setManualStatus] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setManualEmail(emailParam);
    }
  }, [emailParam]);

  // If unsubscribe succeeded, remove subscriber email from localStorage
  useEffect(() => {
    if (success) {
      try {
        localStorage.removeItem("fn_subscriber_email");
        window.dispatchEvent(new Event("fn:subscriber_changed"));
      } catch {}
    }
  }, [success]);

  const handleResubscribe = async (emailToSub: string) => {
    if (!emailToSub) return;
    setResubscribing(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSub }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        try {
          localStorage.setItem("fn_subscriber_email", emailToSub.trim().toLowerCase());
          window.dispatchEvent(new Event("fn:subscriber_changed"));
        } catch {}
        setResubscribed(true);
      } else {
        setManualStatus(data.error || "Failed to resubscribe. Please try again.");
      }
    } catch {
      setManualStatus("Network error. Please try again.");
    } finally {
      setResubscribing(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "4rem 1rem",
        minHeight: "60vh",
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "2.5rem 2rem",
          textAlign: "center",
          borderRadius: "16px",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-card)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}
      >
        {resubscribed ? (
          <div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.12)",
                color: "var(--color-success, #10b981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <Check size={28} />
            </div>
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                marginBottom: "0.75rem",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Welcome back!
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
                marginBottom: "2rem",
              }}
            >
              You're resubscribed to the <strong>Founders North Daily Briefing</strong>. You will receive the next briefing at 7:30 AM ET.
            </p>
            <Link
              href="/"
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={15} /> Return to Homepage
            </Link>
          </div>
        ) : success ? (
          <div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(100, 116, 139, 0.12)",
                color: "var(--color-text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                marginBottom: "0.75rem",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              You have been unsubscribed
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              {emailParam ? (
                <>
                  <strong>{emailParam}</strong> has been removed from our active daily briefing list.
                </>
              ) : (
                "You will no longer receive the Founders North Daily Briefing newsletter."
              )}
            </p>

            <div
              style={{
                background: "var(--color-bg-secondary)",
                borderRadius: "12px",
                padding: "1.25rem",
                marginBottom: "1.75rem",
                border: "1px solid var(--color-border)",
              }}
            >
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.75rem",
                }}
              >
                Unsubscribed by accident?
              </p>
              {emailParam ? (
                <button
                  className="btn btn-outline"
                  onClick={() => handleResubscribe(emailParam)}
                  disabled={resubscribing}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.85rem",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  {resubscribing ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                  Resubscribe {emailParam}
                </button>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="email"
                    className="input"
                    placeholder="Enter email to resubscribe"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    style={{ fontSize: "0.85rem", flex: 1 }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleResubscribe(manualEmail)}
                    disabled={resubscribing || !manualEmail}
                    style={{ fontSize: "0.85rem" }}
                  >
                    {resubscribing ? <Loader2 size={14} className="animate-spin" /> : "Rejoin"}
                  </button>
                </div>
              )}
            </div>

            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.85rem",
                color: "var(--color-accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} /> Back to Founders North Home
            </Link>
          </div>
        ) : (
          <div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.12)",
                color: "var(--color-danger, #ef4444)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <AlertCircle size={28} />
            </div>
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                marginBottom: "0.75rem",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Unsubscribe Link Invalid
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
                marginBottom: "1.75rem",
              }}
            >
              {error === "missing_token"
                ? "No unsubscribe token was provided in the link."
                : "The link you followed may be invalid or has already been processed."}
            </p>

            <Link
              href="/"
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={15} /> Return to Homepage
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-accent)" }} />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
