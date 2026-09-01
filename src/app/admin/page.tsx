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
} from "lucide-react";
import type {
  AppSettings,
  Article,
  DailyDigest,
  Category,
  PipelineRun,
  RunLogMessage,
} from "@/types";

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
          <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-card)", padding: "0 1.5rem" }}>
        <div className="tab-list" style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
        {activeTab === "pipeline" && <PipelineTab resetKey={pipelineResetKey} />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "prompts" && <PromptsTab />}
        {activeTab === "articles" && <ArticlesTab />}
        {activeTab === "digests" && <DigestsTab />}
        {activeTab === "categories" && <CategoriesTab />}
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
      .map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.message}`)
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
              {selectedRun?.startedAt ? `Started on ${new Date(selectedRun.startedAt).toLocaleString()}` : "Loading run information..."}
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
                <StatusBadge status={selectedRun.status} />
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
                const time = new Date(log.timestamp).toLocaleTimeString();
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
                      <StatusBadge status={run.status} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {start.toLocaleString()}
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

function StatusBadge({ status }: { status: string }) {
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
  const [testingTrigger, setTestingTrigger] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const testConnection = async () => {
    setTestingTrigger(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/pipeline/trigger-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: data.message || "✓ GitHub Actions connected & ready!" });
      } else {
        setTestResult({ success: false, message: `Error: ${data.error || "Connection failed"}` });
      }
    } catch (e: unknown) {
      setTestResult({ success: false, message: `Error: ${e instanceof Error ? e.message : "Network failure"}` });
    }
    setTestingTrigger(false);
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.5rem" }}>
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

          <div style={{ marginBottom: "1.25rem" }}>
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

          {/* Test Connection Button */}
          <div style={{ paddingTop: "0.85rem", borderTop: "1px solid var(--color-border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={testConnection}
              disabled={testingTrigger}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              {testingTrigger ? <Loader2 className="animate-spin" size={14} /> : <Activity size={14} />}
              {testingTrigger ? "Testing..." : "Test Connection"}
            </button>
            {testResult && (
              <span style={{ fontSize: "0.8rem", color: testResult.success ? "var(--color-success)" : "var(--color-error)" }}>
                {testResult.message}
              </span>
            )}
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
// Articles Tab
// ============================================================================

function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});

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
      alert("Failed to save");
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      load();
    } catch {
      alert("Failed to delete");
    }
  };

  const toggleStatus = async (article: Article) => {
    const newStatus = article.status === "published" ? "draft" : "published";
    try {
      await fetch(`/api/admin/articles/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      load();
    } catch {
      alert("Failed to update");
    }
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Loader2 className="animate-spin" size={24} /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Articles ({articles.length})</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>Manage, edit, and control published articles.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
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
                <textarea className="textarea" rows={15} value={editForm.content || ""} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
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
                  <PublishBadge status={article.status} />
                </div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.2rem" }}>{article.title}</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
                  {new Date(article.createdAt).toLocaleDateString()} - {article.readTimeMinutes} min read
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(article)} title="Edit Article">
                  <Edit3 size={14} />
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteArticle(article.id)} title="Delete" style={{ color: "var(--color-error)" }}>
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
      alert("Failed to save");
    }
  };

  const deleteDigest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this daily digest?")) return;
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
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>View, edit, and manage daily briefings.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
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
                  <PublishBadge status={digest.status} />
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

function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

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

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Articles in it won't be deleted but will lose their category.")) return;
    try {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      load();
    } catch {
      alert("Failed to delete category");
    }
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Loader2 className="animate-spin" size={24} /></div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "600px" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Categories ({categories.length})</h2>

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

      {categories.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>No categories yet. They will be auto-created by the pipeline.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {categories.map((cat) => (
            <div key={cat.id} className="card" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600 }}>{cat.name}</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
                  {cat.articleCount} articles - /{cat.slug}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteCategory(cat.id)} style={{ color: "var(--color-error)" }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
