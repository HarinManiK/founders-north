"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";

export default function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("fn-theme");
    if (saved === "dark") {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("fn-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("fn-theme", "light");
    }
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="container-main"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "1.3rem",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
            textDecoration: "none",
          }}
        >
          Founders North
        </Link>

        {/* Navigation & Single Theme Toggle */}
        <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link
            href="/"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            Home
          </Link>
          <Link
            href="/digests"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            Daily Digests
          </Link>
          <Link
            href="/categories"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            Articles
          </Link>

          <button
            onClick={toggleTheme}
            className="btn-ghost"
            style={{
              padding: "0.45rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Toggle theme"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
