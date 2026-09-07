"use client";

import { useState } from "react";
import { Mail, Check, ArrowRight, Loader2 } from "lucide-react";

interface SubscribeBoxProps {
  variant?: "strip" | "compact";
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function SubscribeBox({
  variant = "strip",
  title = "Get this briefing in your inbox every morning (7:30 AM ET)",
  subtitle = "Free daily briefing, unsubscribe anytime",
  className = "",
}: SubscribeBoxProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedbackType, setFeedbackType] = useState<"new" | "already" | "reactivated">("new");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        if (data.alreadySubscribed) {
          setFeedbackType("already");
        } else if (data.reactivated) {
          setFeedbackType("reactivated");
        } else {
          setFeedbackType("new");
        }
        setMessage(data.message || "You're subscribed! Welcome to Founders North.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Unable to subscribe. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success Feedback
  if (status === "success") {
    return (
      <div
        className={`animate-fade-in ${className}`}
        style={{
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)",
          border: "1px solid rgba(37, 99, 235, 0.25)",
          borderRadius: "12px",
          padding: "0.85rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Check size={18} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: "0.92rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "inline-block",
              marginRight: "0.5rem",
            }}
          >
            {feedbackType === "already"
              ? "You're already a subscriber!"
              : feedbackType === "reactivated"
              ? "Welcome back!"
              : "You're on the list!"}
          </span>
          <span
            style={{
              fontSize: "0.82rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.4,
            }}
          >
            {message}
          </span>
        </div>
      </div>
    );
  }

  // Compact Form for Footers
  if (variant === "compact") {
    return (
      <div className={`subscribe-compact ${className}`}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 180px" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="input"
              disabled={loading}
              style={{
                fontSize: "0.85rem",
                height: "38px",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !email}
            style={{
              height: "38px",
              padding: "0 1.15rem",
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              flexShrink: 0,
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <>Send Daily <ArrowRight size={13} /></>}
          </button>
        </form>
        {status === "error" && (
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "var(--color-danger, #ef4444)" }}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // Default: Sleek Strip Bar (Homepage & Articles)
  return (
    <div
      className={`subscribe-bar-strip ${className}`}
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "0.75rem 1.15rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem 1.25rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Left: Headline & Clearly Visible Subtitle */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: "260px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(37, 99, 235, 0.1)",
            color: "var(--color-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Mail size={16} />
        </div>
        <div>
          <div
            style={{
              fontSize: "0.92rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              marginTop: "2px",
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      {/* Right: Inline Input & "Send Daily" Button */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          flex: "1 1 300px",
          maxWidth: "440px",
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address..."
          className="input"
          disabled={loading}
          style={{
            height: "38px",
            fontSize: "0.85rem",
            padding: "0 0.85rem",
            flex: 1,
            minWidth: 0,
            boxSizing: "border-box",
          }}
          required
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{
            height: "38px",
            padding: "0 1.15rem",
            fontSize: "0.84rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Sending...
            </>
          ) : (
            <>
              Send Daily <ArrowRight size={13} />
            </>
          )}
        </button>
      </form>

      {status === "error" && (
        <div style={{ width: "100%", margin: "-0.25rem 0 0", fontSize: "0.78rem", color: "var(--color-danger, #ef4444)" }}>
          {message}
        </div>
      )}
    </div>
  );
}
