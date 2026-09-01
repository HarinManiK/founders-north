"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Menu, X, Home, BookOpen, Newspaper, Shield } from "lucide-react";

export default function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("fn-theme");
    if (saved === "dark") {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  // Close mobile drawer upon route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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
    { href: "/", label: "Home", icon: Home },
    { href: "/digests", label: "Daily Digests", icon: BookOpen },
    { href: "/categories", label: "Articles", icon: Newspaper },
  ];

  return (
    <>
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
            height: "64px",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
              textDecoration: "none",
            }}
          >
            <img
              src="/logo.png"
              alt="Founders North Logo"
              width={28}
              height={28}
              style={{ objectFit: "contain", borderRadius: "4px" }}
            />
            <span>Founders North</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hide-on-mobile" style={{ alignItems: "center", gap: "1.5rem" }}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

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

          {/* Mobile Actions (Theme Toggle + Hamburger) */}
          <div className="show-on-mobile" style={{ alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={toggleTheme}
              className="btn-ghost"
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-ghost"
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-overlay ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Slide-out Drawer */}
      <aside className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`} aria-label="Mobile Navigation">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/logo.png" alt="Logo" width={26} height={26} style={{ objectFit: "contain", borderRadius: "4px" }} />
            <span style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Founders North</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="btn-ghost"
            style={{ padding: "0.4rem", borderRadius: "8px", cursor: "pointer" }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-drawer-link ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div style={{ margin: "1.5rem 0", height: "1px", background: "var(--color-border-light)" }} />

          <Link href="/admin" className="mobile-drawer-link" style={{ fontSize: "0.9rem" }}>
            <Shield size={18} />
            <span>Admin Portal</span>
          </Link>
        </nav>

        {/* Theme switcher footer */}
        <div
          style={{
            paddingTop: "1rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Theme</span>
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
