"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  variant?: "subtle" | "pill" | "icon";
}

export default function ShareButton({
  title,
  text,
  url,
  variant = "subtle",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const shareData = {
      title,
      text: text || title,
      url: shareUrl,
    };

    // Detect mobile device for native share sheet
    const isMobile =
      typeof window !== "undefined" &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth <= 800));

    if (isMobile && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    // Desktop: Direct 1-click clipboard copy with instant feedback
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        className="btn-ghost"
        style={{
          padding: "0.35rem",
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: copied ? "var(--color-success)" : "var(--color-text-tertiary)",
          transition: "all 0.2s ease",
        }}
        title={copied ? "Link Copied!" : "Share"}
        aria-label="Share story"
      >
        {copied ? <Check size={14} /> : <Share2 size={14} />}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="btn btn-secondary btn-sm"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.35rem 0.75rem",
        fontSize: "0.8rem",
        fontWeight: 600,
        borderRadius: "8px",
        cursor: "pointer",
        color: copied ? "var(--color-success)" : "var(--color-text-secondary)",
        borderColor: copied ? "rgba(16, 185, 129, 0.3)" : "var(--color-border)",
        background: copied ? "rgba(16, 185, 129, 0.08)" : "var(--color-bg-secondary)",
        transition: "all 0.2s ease",
      }}
      title="Share story"
      aria-label="Share"
    >
      {copied ? (
        <>
          <Check size={13} style={{ color: "var(--color-success)" }} />
          <span>Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={13} />
          <span>Share</span>
        </>
      )}
    </button>
  );
}
