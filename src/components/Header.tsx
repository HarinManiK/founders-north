"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";

export default function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pathname = usePathname();

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

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/digests", label: "Digests" },
    { href: "/categories", label: "Articles" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        width: "100%",
        maxWidth: "100vw",
        overflow: "hidden",
      }}
    >
      <div
        className="container-main"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "56px",
          gap: "0.25rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
            textDecoration: "none",
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <img
            src="/logo.png"
            alt="Founders North"
            width={24}
            height={24}
            style={{ objectFit: "contain", borderRadius: "4px" }}
          />
          <span className="brand-title">Founders North</span>
        </Link>

        {/* Direct Navigation Links (Visible on all devices) */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            flexShrink: 0,
          }}
        >
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link-pill ${isActive ? "active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost"
            style={{
              padding: "0.35rem",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Toggle theme"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
