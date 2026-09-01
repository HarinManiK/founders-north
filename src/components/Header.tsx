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
      }}
    >
      <div
        className="container-main"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "60px",
          gap: "0.5rem",
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "1.1rem",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.png"
            alt="Founders North"
            width={26}
            height={26}
            style={{ objectFit: "contain", borderRadius: "4px" }}
          />
          <span className="brand-title">Founders North</span>
        </Link>

        {/* Direct Navigation Links (Visible on all devices) */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
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
              padding: "0.4rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Toggle theme"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
