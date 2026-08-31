"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon, Menu, X } from "lucide-react";

export default function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="container-main" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
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

        {/* Desktop Navigation */}
        <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="desktop-nav">
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
            Categories
          </Link>
          <button
            onClick={toggleTheme}
            className="btn-ghost"
            style={{
              padding: "0.4rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="mobile-nav">
          <button
            onClick={toggleTheme}
            className="btn-ghost"
            style={{ padding: "0.4rem", borderRadius: "8px", display: "flex" }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="btn-ghost"
            style={{ padding: "0.4rem", borderRadius: "8px", display: "flex" }}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "64px",
            left: 0,
            right: 0,
            background: "var(--color-bg-card)",
            borderBottom: "1px solid var(--color-border)",
            padding: "1rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            boxShadow: "var(--shadow-lg)",
          }}
          className="animate-fade-in"
        >
          <Link href="/" onClick={() => setMenuOpen(false)} style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--color-text-primary)", textDecoration: "none", padding: "0.5rem 0" }}>
            Home
          </Link>
          <Link href="/digests" onClick={() => setMenuOpen(false)} style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--color-text-primary)", textDecoration: "none", padding: "0.5rem 0" }}>
            Daily Digests
          </Link>
          <Link href="/categories" onClick={() => setMenuOpen(false)} style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--color-text-primary)", textDecoration: "none", padding: "0.5rem 0" }}>
            Categories
          </Link>
        </div>
      )}

      <style jsx>{`
        .desktop-nav { display: flex; }
        .mobile-nav { display: none; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
