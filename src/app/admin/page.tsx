"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DEFAULT_PROMPTS, PROMPT_LABELS, type PromptKey } from "@/lib/prompts";
import {
  Play,
  Settings,
  FileText,
  BookOpen,
  FolderOpen,
  LogOut,
  Loader2,
  RefreshCw,
  Save,
  RotateCcw,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  ChevronRight,
  Activity,
  Info,
  X,
} from "lucide-react";
import type {
  AppSettings,
  Article,
  DailyDigest,
  Category,
  PipelineRun,
  RunLogMessage,
} from "@/types";
import {
  formatISTDateTime,
  formatISTDateMedium,
  formatISTTime,
} from "@/lib/timezone";

type Tab = "pipeline" | "settings" | "prompts" | "articles" | "digests" | "categories";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((data) => {
        setAuthed(data.authenticated);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setLoginError("Invalid password");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
    setPassword("");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--color-accent)" }} />
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <div className="card animate-fade-in" style={{ maxWidth: "380px", width: "100%", padding: "2rem" }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.25rem" }}>
            Founders North
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)", marginBottom: "1.5rem" }}>Admin Panel</p>
          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          {loginError && (
            <p style={{ fontSize: "0.85rem", color: "var(--color-error)", marginBottom: "0.75rem" }}>{loginError}</p>
          )}
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleLogin}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

// ============================================================================
// Admin Dashboard
// ============================================================================

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [pipelineResetKey, setPipelineResetKey] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "pipeline", label: "Runs", icon: <Play size={15} /> },
    { id: "settings", label: "Settings", icon: <Settings size={15} /> },
    { id: "prompts", label: "Prompts", icon: <FileText size={15} /> },
    { id: "articles", label: "Articles", icon: <BookOpen size={15} /> },
    { id: "digests", label: "Daily Digests", icon: <BookOpen size={15} /> },
    { id: "categories", label: "Categories", icon: <FolderOpen size={15} /> },
  ];

  const handleTabClick = (tabId: Tab) => {
    if (tabId === "pipeline") {
      // Reset PipelineTab back to the list of runs
      setPipelineResetKey((k) => k + 1);
    }
    setActiveTab(tabId);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-card)", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "56px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <img
              src="/logo.png"
              alt="Founders North Logo"
              width={26}
              height={26}
              style={{ objectFit: "contain", borderRadius: "4px" }}
            />
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.1rem", fontWeight: 800 }}>
              Founders North <span style={{ fontWeight: 500, color: "var(--color-text-tertiary)", fontSize: "0.85rem" }}>Admin</span>
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowGuide(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "var(--color-accent)" }}
            >
              <Info size={14} /> Rules Guide
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-card)", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div className="tab-list">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-item ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => handleTabClick(tab.id)}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Standalone, Distinct Rules & Cascade Guide Button */}
            <button
              onClick={() => setShowGuide(true)}
              title="Admin Rules & Cascade Guide"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(99, 102, 241, 0.12)",
                color: "var(--color-accent)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.25)";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.12)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Info size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Admin Rules & Cascade Guide Modal */}
      {showGuide && <AdminGuideModal onClose={() => setShowGuide(false)} />}

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
        {activeTab === "pipeline" && <PipelineTab resetKey={pipelineResetKey} />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "prompts" && <PromptsTab />}
        {activeTab === "articles" && <ArticlesTab />}
        {activeTab === "digests" && <DigestsTab />}
        {activeTab === "categories" && <CategoriesTab onOpenGuide={() => setShowGuide(true)} />}
      </div>
    </div>
  );
}

// ============================================================================
// Pipeline Tab
// ============================================================================

function PipelineTab({ resetKey = 0 }: { resetKey?: number }) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);
  const [recentRuns, setRecentRuns] = useState<PipelineRun[]>([]);
  const [activeRunningRun, setActiveRunningRun] = useState<PipelineRun | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [copied, setCopied] = useState(false);

  const consoleRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stageLabels: Record<string, string> = {
    queued: "Queued",
    fetching_emails: "Fetching Emails",
    filtering_topics: "Filtering & Extracting Topics",
    scraping_sources: "Scraping Source URLs",
    writing_articles: "Writing Articles",
    categorizing: "Categorizing Articles",
    compiling_digest: "Compiling Daily Digest",
    publishing: "Publishing",
    done: "Complete",
    failed: "Failed",
    cancelled: "Stopped & Rolled Back",
  };

  // Reset to list view when resetKey changes (user clicks Pipeline tab at top left)
  useEffect(() => {
    setSelectedRunId(null);
    setSelectedRun(null);
  }, [resetKey]);

  // Load all runs and identify active running ones
  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/runs");
      if (res.ok) {
        const data: PipelineRun[] = await res.json();
        setRecentRuns(data);
        const active = data.find((r) => r.status === "running" || r.status === "queued") || null;
        setActiveRunningRun(active);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Polling for selected run or active run
  useEffect(() => {
    const targetId = selectedRunId || activeRunningRun?.id;
    if (!targetId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/runs?id=${targetId}`);
        if (res.ok) {
          const run: PipelineRun = await res.json();
          if (selectedRunId === targetId) {
            setSelectedRun(run);
          }
          if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
            loadRuns();
          } else {
            setActiveRunningRun(run);
          }

          if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
          }
        }
      } catch {
        // ignore
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedRunId, activeRunningRun?.id, loadRuns]);

  // Trigger a new run
  const triggerRun = async () => {
    setTriggering(true);
    try {
      const res = await fetch("/api/admin/pipeline/trigger", { method: "POST" });
      const data = await res.json();
      if (data.runId) {
        setSelectedRunId(data.runId);
        setSelectedRun(null);
        loadRuns();
      } else {
        alert(data.error || "Failed to trigger pipeline");
      }
    } catch {
      alert("Failed to trigger pipeline");
    } finally {
      setTriggering(false);
    }
  };

  // Stop a run and initiate immediate rollback
  const stopRun = async (runIdToStop: string) => {
    if (!confirm("Are you sure you want to stop this run immediately and undo any created articles/digests?")) return;
    setStopping(true);
    try {
      const res = await fetch("/api/admin/pipeline/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: runIdToStop }),
      });
      const data = await res.json();
      if (data.success) {
        await loadRuns();
        if (selectedRunId === runIdToStop) {
          const runRes = await fetch(`/api/admin/runs?id=${runIdToStop}`);
          if (runRes.ok) setSelectedRun(await runRes.json());
        }
      } else {
        alert(data.error || "Failed to stop run");
      }
    } catch {
      alert("Failed to stop run");
    } finally {
      setStopping(false);
    }
  };

  const copyLogs = () => {
    if (!selectedRun?.logs) return;
    const text = (selectedRun.logs as RunLogMessage[])
      .map((l) => `[${formatISTTime(l.timestamp)}] [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isCurrentRunActive = selectedRun?.status === "running" || selectedRun?.status === "queued";

  // =========================================================================
  // VIEW 1: Isolated Run Detail View
  // =========================================================================
  if (selectedRunId) {
    return (
      <div className="animate-fade-in">
        {/* Back Button and Actions Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSelectedRunId(null);
                setSelectedRun(null);
                loadRuns();
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem", paddingLeft: 0 }}
            >
              <ArrowLeft size={15} /> Back to Runs
            </button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              Run Details: <span style={{ fontFamily: "monospace", fontSize: "1.05rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>{selectedRunId}</span>
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
              {selectedRun?.startedAt ? `Started on ${formatISTDateTime(selectedRun.startedAt)} (IST)` : "Loading run information..."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {isCurrentRunActive ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => stopRun(selectedRunId)}
                disabled={stopping}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-error)", borderColor: "rgba(220, 38, 38, 0.3)" }}
              >
                {stopping ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                {stopping ? "Stopping..." : "Stop Run"}
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={triggerRun}
                disabled={triggering || !!activeRunningRun}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                {triggering ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                Run Pipeline
              </button>
            )}
          </div>
        </div>

        {/* Selected Run Status Card */}
        {selectedRun && (
          <div className="card" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Status:</span>
                <RunStatusBadge status={selectedRun.status} />
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                  Stage: <strong>{stageLabels[selectedRun.currentStage] || selectedRun.currentStage}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)", flexWrap: "wrap" }}>
              <span>📥 Emails: <strong>{selectedRun.emailsProcessed || 0}</strong></span>
              <span>📰 Topics: <strong>{selectedRun.newslettersIdentified || 0}</strong></span>
              <span>✍️ Articles: <strong>{selectedRun.articlesGenerated || 0}</strong></span>
            </div>

            {selectedRun.error && (
              <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", background: "rgba(220, 38, 38, 0.1)", border: "1px solid var(--color-error)", borderRadius: "8px", color: "var(--color-error)", fontSize: "0.85rem" }}>
                <strong>Error:</strong> {selectedRun.error}
              </div>
            )}
          </div>
        )}

        {/* Live Execution Console for this Run */}
        {selectedRun?.logs && selectedRun.logs.length > 0 ? (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>Execution Logs</h3>
                {isCurrentRunActive && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-success)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-success)" }} className="animate-pulse" />
                    Streaming Live
                  </span>
                )}
                {!isCurrentRunActive && selectedRun.status === "completed" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-success)",
                      background: "rgba(16, 185, 129, 0.1)",
                      padding: "0.15rem 0.55rem",
                      borderRadius: "9999px",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    <CheckCircle size={11} /> Published
                  </span>
                )}
                {!isCurrentRunActive && selectedRun.status === "failed" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-error)",
                      background: "rgba(239, 68, 68, 0.1)",
                      padding: "0.15rem 0.55rem",
                      borderRadius: "9999px",
                    }}
                  >
                    <XCircle size={11} /> Failed
                  </span>
                )}
                {!isCurrentRunActive && selectedRun.status === "cancelled" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-warning)",
                      background: "rgba(245, 158, 11, 0.1)",
                      padding: "0.15rem 0.55rem",
                      borderRadius: "9999px",
                    }}
                  >
                    <XCircle size={11} /> Rolled Back
                  </span>
                )}
              </div>
              <div>
                <button className="btn btn-secondary btn-sm" onClick={copyLogs} style={{ fontSize: "0.75rem" }}>
                  {copied ? "✓ Copied!" : "Copy Logs"}
                </button>
              </div>
            </div>

            {/* Finished & Published Highlight Banner */}
            {!isCurrentRunActive && selectedRun.status === "completed" && (
              <div
                style={{
                  marginBottom: "0.75rem",
                  padding: "0.65rem 1rem",
                  background: "rgba(16, 185, 129, 0.06)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle size={15} style={{ color: "var(--color-success)" }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-success)" }}>
                    Done: Run finished and {selectedRun.articlesGenerated || 0} {selectedRun.articlesGenerated === 1 ? "article" : "articles"} published
                  </span>
                </div>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  View Live Site <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div
              className="admin-console"
              ref={consoleRef}
              style={{
                maxHeight: "560px",
                fontSize: "0.82rem",
                lineHeight: 1.6,
              }}
            >
              {(selectedRun.logs as RunLogMessage[]).map((log, i) => {
                const time = formatISTTime(log.timestamp);
                return (
                  <div key={i} className={`log-${log.level}`} style={{ marginBottom: "0.25rem", wordBreak: "break-word" }}>
                    <span style={{ opacity: 0.45, marginRight: "0.5rem" }}>[{time}]</span>
                    <span>{log.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: "0 auto 0.75rem", color: "var(--color-accent)" }} />
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>Initializing pipeline and streaming logs...</p>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: All Runs Stack / List View
  // =========================================================================
  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Runs</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
            Trigger new AI pipelines and inspect past execution logs.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {activeRunningRun && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => stopRun(activeRunningRun.id)}
              disabled={stopping}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-error)", borderColor: "rgba(220, 38, 38, 0.3)" }}
            >
              {stopping ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
              {stopping ? "Stopping..." : "Stop Active Run"}
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={triggerRun}
            disabled={triggering || !!activeRunningRun}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            {triggering ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
            {activeRunningRun ? "Running..." : "Run Pipeline"}
          </button>
        </div>
      </div>

      {/* Recent Runs Stack */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>Execution History</h3>
          <button className="btn btn-ghost btn-sm" onClick={loadRuns} title="Refresh runs list">
            <RefreshCw size={13} />
          </button>
        </div>

        {recentRuns.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
            <Play size={36} style={{ color: "var(--color-text-tertiary)", margin: "0 auto 0.75rem" }} />
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>No pipeline runs recorded yet.</p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
              Click <strong>&quot;Run Pipeline&quot;</strong> above to start your first execution.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {recentRuns.map((run) => {
              const start = new Date(run.startedAt);
              const duration = run.completedAt
                ? Math.round((new Date(run.completedAt).getTime() - start.getTime()) / 1000)
                : null;

              return (
                <div
                  key={run.id}
                  className="card card-interactive"
                  style={{ padding: "0.9rem 1.25rem", cursor: "pointer" }}
                  onClick={() => {
                    setSelectedRunId(run.id);
                    setSelectedRun(run);
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <RunStatusBadge status={run.status} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {formatISTDateTime(start)}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
                        ({stageLabels[run.currentStage] || run.currentStage})
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                      <span>📥 {run.emailsProcessed || 0} emails</span>
                      <span>📰 {run.newslettersIdentified || 0} topics</span>
                      <span>✍️ {run.articlesGenerated || 0} articles</span>
                      {duration !== null && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Clock size={12} /> {duration}s
                        </span>
                      )}
                      <ChevronRight size={16} style={{ color: "var(--color-text-tertiary)" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
    queued: { icon: <Clock size={12} />, className: "badge-warning", label: "Queued" },
    running: { icon: <Loader2 className="animate-spin" size={12} />, className: "badge-warning", label: "Running" },
    completed: { icon: <CheckCircle size={12} />, className: "badge-success", label: "Completed" },
    failed: { icon: <XCircle size={12} />, className: "badge-error", label: "Failed" },
    cancelled: { icon: <XCircle size={12} />, className: "badge-warning", label: "Cancelled & Rolled Back" },
  };
  const c = config[status] || config.queued;
  return (
    <span className={c.className} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 }}>
      {c.icon} {c.label}
    </span>
  );
}

function PublishBadge({ status }: { status?: string }) {
  if (status === "draft") {
    return (
      <span className="badge" style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)" }}>
        Draft
      </span>
    );
  }
  return (
    <span
      className="badge-success"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        fontSize: "0.7rem",
        padding: "0.15rem 0.5rem",
        borderRadius: "9999px",
        fontWeight: 600,
      }}
    >
      <CheckCircle size={10} /> Published
    </span>
  );
}

// ============================================================================
// Settings Tab
// ============================================================================

function SettingsTab() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imap: settings.imap,
          openrouter: settings.openrouter,
          automation: settings.automation,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save settings");
    }
    setSaving(false);
  };

  if (!settings) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Loader2 className="animate-spin" size={24} /></div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1050px" }}>
      {/* Top Header with Save Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Settings</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
            Configure your AI provider, newsletter mailbox, and daily automated schedule.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            Save Settings
          </button>
          {saved && (
            <span style={{ fontSize: "0.85rem", color: "var(--color-success)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <CheckCircle size={14} /> Saved
            </span>
          )}
        </div>
      </div>

      {/* 2-Column Responsive Grid */}
      <div className="settings-grid">
        {/* Row 1 Left: OpenRouter API */}
        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", height: "100%" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>OpenRouter API</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", padding: "0.5rem 0.75rem", background: "var(--color-accent-light)", borderRadius: "8px", fontSize: "0.8rem" }}>
            <AlertCircle size={14} style={{ color: "var(--color-accent)" }} />
            <span style={{ color: "var(--color-text-secondary)" }}>
              Get your API key from{" "}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
                openrouter.ai/keys <ExternalLink size={11} style={{ display: "inline", verticalAlign: "middle" }} />
              </a>
            </span>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label className="label">API Key</label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showApiKey ? "text" : "password"}
                value={settings.openrouter.apiKey}
                onChange={(e) => setSettings({ ...settings, openrouter: { ...settings.openrouter, apiKey: e.target.value } })}
                placeholder="sk-or-v1-..."
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                className="btn-ghost"
                style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", padding: "0.25rem" }}
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Model</label>
            <input
              className="input"
              value={settings.openrouter.model}
              onChange={(e) => setSettings({ ...settings, openrouter: { ...settings.openrouter, model: e.target.value } })}
              placeholder="google/gemini-3.5-flash-lite"
            />
          </div>
        </div>

        {/* Row 1 Right: IMAP Mailbox */}
        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", height: "100%" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>IMAP Mailbox</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", padding: "0.5rem 0.75rem", background: "var(--color-accent-light)", borderRadius: "8px", fontSize: "0.8rem" }}>
            <AlertCircle size={14} style={{ color: "var(--color-accent)" }} />
            <span style={{ color: "var(--color-text-secondary)" }}>
              For Gmail, use an App Password:{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
                Get App Password <ExternalLink size={11} style={{ display: "inline", verticalAlign: "middle" }} />
              </a>
            </span>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Email Address</label>
            <input className="input" type="email" value={settings.imap.user} onChange={(e) => setSettings({ ...settings, imap: { ...settings.imap, user: e.target.value } })} placeholder="your@gmail.com" />
          </div>
          <div>
            <label className="label">App Password / IMAP Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPass ? "text" : "password"}
                value={settings.imap.pass}
                onChange={(e) => setSettings({ ...settings, imap: { ...settings.imap, pass: e.target.value } })}
                placeholder="xxxx xxxx xxxx xxxx"
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                className="btn-ghost"
                style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", padding: "0.25rem" }}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2 Left: Automated Scheduled Runs */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Automated Scheduled Runs</h3>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={settings.automation?.enabled ?? false}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    automation: {
                      ...(settings.automation || {
                        time: "07:30",
                        timezone: "Asia/Kolkata",
                        githubToken: "",
                        githubRepo: "HarinManiK/founders-north",
                      }),
                      enabled: e.target.checked,
                    },
                  })
                }
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              {settings.automation?.enabled ? "Enabled" : "Disabled"}
            </label>
          </div>

          <div>
            <label className="label">Scheduled Run Time (IST)</label>
            <input
              className="input"
              type="time"
              value={settings.automation?.time || "07:30"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  automation: {
                    ...(settings.automation || {
                      enabled: false,
                      timezone: "Asia/Kolkata",
                      githubToken: "",
                      githubRepo: "HarinManiK/founders-north",
                    }),
                    time: e.target.value,
                  },
                })
              }
              style={{ maxWidth: "160px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Prompts Tab
// ============================================================================

function PromptsTab() {
  const [prompts, setPrompts] = useState<Record<PromptKey, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((s: AppSettings) => setPrompts(s.prompts))
      .catch(() => setPrompts({ ...DEFAULT_PROMPTS }));
  }, []);

  const save = async () => {
    if (!prompts) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save prompts");
    }
    setSaving(false);
  };

  const resetPrompt = (key: PromptKey) => {
    if (!prompts) return;
    setPrompts({ ...prompts, [key]: DEFAULT_PROMPTS[key] });
  };

  if (!prompts) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Loader2 className="animate-spin" size={24} /></div>;
  }

  const keys: PromptKey[] = ["filterPrompt", "articlePrompt", "categoryPrompt", "digestPrompt"];

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Prompt Studio</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
            Customize the AI prompts for each pipeline stage.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            Save All Prompts
          </button>
          {saved && (
            <span style={{ fontSize: "0.85rem", color: "var(--color-success)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <CheckCircle size={14} /> Saved
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {keys.map((key) => (
          <div key={key} className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{PROMPT_LABELS[key]}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => resetPrompt(key)} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <RotateCcw size={12} /> Reset to Default
              </button>
            </div>
            <textarea
              className="textarea"
              value={prompts[key]}
              onChange={(e) => setPrompts({ ...prompts, [key]: e.target.value })}
              rows={12}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Status Badge Component (1-Click Toggle)
// ============================================================================

function StatusBadge({
  status,
  onToggle,
  disabled = false,
}: {
  status: "published" | "draft";
  onToggle?: () => void;
  disabled?: boolean;
}) {
  const isPublished = status === "published";
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggle && !disabled) onToggle();
      }}
      disabled={disabled || !onToggle}
      className={`badge ${isPublished ? "badge-success" : "badge-warning"}`}
      style={{
        fontSize: "0.7rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        cursor: onToggle && !disabled ? "pointer" : "default",
        border: "none",
        padding: "0.2rem 0.6rem",
        borderRadius: "6px",
        fontWeight: 600,
        background: isPublished ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
        color: isPublished ? "var(--color-success)" : "var(--color-warning)",
        transition: "all 0.2s ease",
      }}
      title={onToggle ? `Click to switch to ${isPublished ? "Draft" : "Published"}` : undefined}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: isPublished ? "var(--color-success)" : "var(--color-warning)",
        }}
      />
      {isPublished ? "Published" : "Draft"}
    </button>
  );
}

// ============================================================================


// ============================================================================
// Articles Tab
// ============================================================================

function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles");
      if (res.ok) setArticles(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (article: Article) => {
    setEditingId(article.id);
    setEditForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      categoryName: article.categoryName,
      status: article.status,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await fetch(`/api/admin/articles/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      load();
    } catch {
      alert("Failed to save changes");
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article? It will be permanently removed from its Daily Digest, and empty categories will be cleaned up.")) return;
    try {
      await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      load();
    } catch {
      alert("Failed to delete article");
    }
  };

  const toggleStatus = async (article: Article) => {
    setUpdatingId(article.id);
    const newStatus = article.status === "published" ? "draft" : "published";
    try {
      await fetch(`/api/admin/articles/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await load();
    } catch {
      alert("Failed to update status");
    }
    setUpdatingId(null);
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Loader2 className="animate-spin" size={24} /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Articles ({articles.length})</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
            Manage, edit, publish/draft, and delete intelligence stories.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh"><RefreshCw size={13} /></button>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
          <div className="card animate-fade-in" style={{ maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Edit Article</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label className="label">Title</label>
                <input className="input" value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Excerpt</label>
                <textarea className="textarea" rows={2} value={editForm.excerpt || ""} onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })} />
              </div>
              <div>
                <label className="label">Content (Markdown)</label>
                <textarea className="textarea" rows={12} value={editForm.content || ""} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Category</label>
                  <input className="input" value={editForm.categoryName || ""} onChange={(e) => setEditForm({ ...editForm, categoryName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editForm.status || "published"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "published" | "draft" })}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>No articles yet. Run the pipeline to generate articles.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {articles.map((article) => (
            <div key={article.id} className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                  <span className="badge" style={{ fontSize: "0.7rem" }}>{article.categoryName}</span>
                  <StatusBadge
                    status={article.status}
                    onToggle={() => toggleStatus(article)}
                    disabled={updatingId === article.id}
                  />
                </div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.2rem" }}>{article.title}</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
                  {formatISTDateMedium(article.createdAt)} - {article.readTimeMinutes} min read
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(article)} title="Edit Article">
                  <Edit3 size={14} />
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteArticle(article.id)} title="Delete Article" style={{ color: "var(--color-error)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Digests Tab
// ============================================================================

function DigestsTab() {
  const [digests, setDigests] = useState<DailyDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DailyDigest>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/digests");
      if (res.ok) setDigests(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (digest: DailyDigest) => {
    setEditingId(digest.id);
    setEditForm({ title: digest.title, summary: digest.summary, status: digest.status });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await fetch(`/api/admin/digests/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      load();
    } catch {
      alert("Failed to save digest");
    }
  };

  const toggleStatus = async (digest: DailyDigest) => {
    setUpdatingId(digest.id);
    const newStatus = digest.status === "published" ? "draft" : "published";
    try {
      await fetch(`/api/admin/digests/${digest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await load();
    } catch {
      alert("Failed to update status");
    }
    setUpdatingId(null);
  };

  const deleteDigest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Daily Digest? Deleting this digest will cascade-delete all linked articles and clean up empty categories.")) return;
    try {
      const res = await fetch(`/api/admin/digests/${id}`, { method: "DELETE" });
      if (res.ok) {
        load();
      } else {
        alert("Failed to delete digest");
      }
    } catch {
      alert("Failed to delete digest");
    }
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Loader2 className="animate-spin" size={24} /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Daily Digests ({digests.length})</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
            View, edit, publish/draft, and manage daily executive briefings.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh"><RefreshCw size={13} /></button>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
          <div className="card animate-fade-in" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Edit Digest</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label className="label">Title</label>
                <input className="input" value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Summary</label>
                <textarea className="textarea" rows={8} value={editForm.summary || ""} onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={editForm.status || "published"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "published" | "draft" })}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {digests.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>No digests yet. Run the pipeline to generate your first daily digest.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {digests.map((digest) => (
            <div key={digest.id} className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <StatusBadge
                    status={digest.status}
                    onToggle={() => toggleStatus(digest)}
                    disabled={updatingId === digest.id}
                  />
                </div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.2rem" }}>{digest.title}</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
                  {digest.date} - {digest.highlights?.length || 0} stories
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(digest)} title="Edit Digest">
                  <Edit3 size={14} />
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteDigest(digest.id)} title="Delete Digest" style={{ color: "var(--color-error)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Categories Tab
// ============================================================================

function CategoriesTab({ onOpenGuide }: { onOpenGuide?: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) setCategories(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCategory = async () => {
    if (!newName.trim()) return;
    try {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newName.trim() }),
      });
      setNewName("");
      load();
    } catch {
      alert("Failed to create category");
    }
  };

  const startRename = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveRename = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      const res = await fetch(`/api/admin/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        setEditingId(null);
        load();
      } else {
        alert("Failed to rename category");
      }
    } catch {
      alert("Failed to rename category");
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Deleting this category will cascade-delete ALL articles in it and update associated Daily Digests.`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        load();
      } else {
        alert("Failed to delete category");
      }
    } catch {
      alert("Failed to delete category");
    }
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Loader2 className="animate-spin" size={24} /></div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "650px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Categories ({categories.length})</h2>
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                title="View Category & Cascade Rules Guide"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "rgba(99, 102, 241, 0.18)",
                  color: "var(--color-accent)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}
              >
                i
              </button>
            )}
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
            Manage categories, rename topics, and review published story counts.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh"><RefreshCw size={13} /></button>
      </div>

      {/* Add Category */}
      <div className="card" style={{ padding: "1rem", marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
        <input
          className="input"
          placeholder="New category name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
        />
        <button className="btn btn-primary btn-sm" onClick={addCategory}>Add</button>
      </div>

      {/* Rename Modal */}
      {editingId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
          <div className="card animate-fade-in" style={{ maxWidth: "450px", width: "100%", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Rename Category</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
              Renaming will automatically update all existing articles and Daily Digest highlights in this category.
            </p>
            <input
              className="input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveRename()}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.25rem" }}>
              <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveRename}>Save</button>
            </div>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>No categories yet. They will be auto-created by the pipeline.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {categories.map((cat) => (
            <div key={cat.id} className="card" style={{ padding: "0.85rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{cat.name}</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
                  {cat.articleCount ?? 0} published stories • /{cat.slug}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => startRename(cat)} title="Rename Category">
                  <Edit3 size={14} />
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteCategory(cat.id, cat.name)} title="Delete Category" style={{ color: "var(--color-error)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Admin Rules & Cascade Guide Modal
// ============================================================================

function AdminGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{
          maxWidth: "680px",
          width: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          padding: "1.75rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--color-border-light)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Info size={18} style={{ color: "var(--color-accent)" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Admin Rules &amp; Cascade Guide</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Section 1: Articles */}
          <div style={{ padding: "1rem", borderRadius: "8px", background: "var(--color-bg)", border: "1px solid var(--color-border-light)" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-accent)", marginBottom: "0.4rem" }}>
              📰 Articles
            </h4>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.83rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              <li><strong>Draft:</strong> Decreases category count (hides category card on site if count drops to 0). Hides story highlight in Daily Digest. If all stories in a digest are drafted, digest auto-drafts.</li>
              <li><strong>Publish:</strong> Increases category count (re-appears on site). Story highlight re-appears in Daily Digest and restores digest to Published.</li>
              <li><strong>Change Category:</strong> Decreases old category count and increases new category count automatically.</li>
              <li><strong>Delete:</strong> Permanently removes story from Daily Digest (auto-deletes digest if 0 stories remain) and auto-deletes category from database if 0 articles remain.</li>
            </ul>
          </div>

          {/* Section 2: Daily Digests */}
          <div style={{ padding: "1rem", borderRadius: "8px", background: "var(--color-bg)", border: "1px solid var(--color-border-light)" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-warning)", marginBottom: "0.4rem" }}>
              📑 Daily Digests
            </h4>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.83rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              <li><strong>Draft:</strong> Automatically sets <em>all linked articles</em> in that digest to Draft and updates category counts.</li>
              <li><strong>Publish:</strong> Automatically restores <em>all linked articles</em> to Published and updates category counts.</li>
              <li><strong>Delete:</strong> Cascade-deletes all underlying articles and cleans up empty categories.</li>
            </ul>
          </div>

          {/* Section 3: Categories */}
          <div style={{ padding: "1rem", borderRadius: "8px", background: "var(--color-bg)", border: "1px solid var(--color-border-light)" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-success)", marginBottom: "0.4rem" }}>
              📂 Categories
            </h4>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.83rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              <li><strong>Rename:</strong> Automatically updates category name across <em>all existing articles</em> and Daily Digest story highlights.</li>
              <li><strong>Delete:</strong> Cascade-deletes all articles under that category and cleans up Daily Digests.</li>
              <li><strong>Add:</strong> Created in Admin; stays hidden from the public site until at least 1 article is published under it.</li>
            </ul>
          </div>

          {/* Section 4: Batch & Safety */}
          <div style={{ padding: "1rem", borderRadius: "8px", background: "var(--color-bg)", border: "1px solid var(--color-border-light)" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.4rem" }}>
              ⚡ Batch &amp; Safety Guarantees
            </h4>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.83rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              <li><strong>Draft All:</strong> Public site displays graceful empty state; 100% of data is preserved in Admin and instantly restored upon publishing.</li>
              <li><strong>Delete All:</strong> Purges all articles, digests, and categories, leaving Firestore in a pristine zero-orphan state.</li>
              <li><strong>Automatic Cascade:</strong> Every individual action immediately cascades and keeps categories, articles, and digests in sync in real time.</li>
            </ul>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}


