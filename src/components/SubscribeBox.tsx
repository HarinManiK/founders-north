"use client";

import { useState } from "react";
import { Mail, Check, ArrowRight, Loader2, Sparkles } from "lucide-react";

interface SubscribeBoxProps {
  variant?: "card" | "compact" | "hero";
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function SubscribeBox({
  variant = "card",
  title = "Get the Daily Briefing in your inbox",
  subtitle = "Join founders, investors, and business leaders receiving our curated intelligence every morning at 7:30 AM ET. Zero spam, 1-click unsubscribe.",
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

  if (status === "success") {
    return (
      <div
        className={`subscribe-success-card animate-fade-in ${className}`}
        style={{
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)",
          border: "1px solid rgba(37, 99, 235, 0.25)",
          borderRadius: "14px",
          padding: variant === "compact" ? "1.25rem 1.5rem" : "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Check size={22} strokeWidth={2.5} />
        </div>
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {feedbackType === "already"
              ? "You're already a subscriber!"
              : feedbackType === "reactivated"
              ? "Welcome back!"
              : "You're on the list!"}
          </h4>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.85rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`subscribe-compact ${className}`}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <Mail
              size={15}
              style={{
                position: "absolute",
                left: "0.85rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-tertiary)",
              }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="input"
              disabled={loading}
              style={{
                paddingLeft: "2.3rem",
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
              padding: "0 1.25rem",
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              flexShrink: 0,
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Subscribe"}
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

  return (
    <div
      className={`subscribe-box-card ${className}`}
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "16px",
        padding: variant === "hero" ? "2.25rem 2rem" : "1.75rem",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "3px 10px",
          borderRadius: "20px",
          background: "rgba(37, 99, 235, 0.1)",
          color: "var(--color-accent)",
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "0.75rem",
        }}
      >
        <Sparkles size={12} />
        Free Daily Briefing
      </div>

      <h3
        style={{
          margin: "0 0 0.5rem",
          fontSize: variant === "hero" ? "1.4rem" : "1.15rem",
          fontWeight: 800,
          letterSpacing: "-0.01em",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "var(--color-text-primary)",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "0 0 1.25rem",
          fontSize: "0.88rem",
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
          maxWidth: "600px",
        }}
      >
        {subtitle}
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: "520px" }}>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Mail
              size={16}
              style={{
                position: "absolute",
                left: "0.9rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-tertiary)",
              }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email..."
              className="input"
              disabled={loading}
              style={{
                paddingLeft: "2.4rem",
                fontSize: "0.9rem",
                height: "44px",
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "8px",
              }}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              height: "44px",
              padding: "0 1.5rem",
              fontSize: "0.88rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Subscribing...
              </>
            ) : (
              <>
                Subscribe <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {status === "error" && (
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--color-danger, #ef4444)" }}>
            {message}
          </p>
        )}

        <p
          style={{
            margin: "0.75rem 0 0",
            fontSize: "0.74rem",
            color: "var(--color-text-tertiary)",
            letterSpacing: "0.01em",
          }}
        >
          Delivered every morning at 7:30 AM ET. No promotional spam. Unsubscribe in one click anytime.
        </p>
      </form>
    </div>
  );
}
