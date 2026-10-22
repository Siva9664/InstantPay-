"use client";

/**
 * app/page.tsx
 * InstantPay AI – Premium Fintech Chat Interface
 *
 * Features
 * ─────────
 * • Natural-language job-completion chat powered by OpenAI
 * • Structured PayPal payout confirmation + trigger
 * • Live payout history sidebar with stats
 * • Light / Dark mode toggle (class-based, persisted to localStorage)
 * • Fully accessible (ARIA labels, keyboard nav, live regions)
 * • Mobile responsive
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import { Message, Payout, PendingPayout, AIResponse } from "@/types";

// ─── Utility helpers ───────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const HINT_EXAMPLES = [
  "Job done for Ravi – Food Delivery – ₹720",
  "Tutoring Ananya, 2 hrs, ₹900",
  "Plumbing fixed for Sharma ji – ₹1,500",
  "Grocery delivery for Priya – ₹350",
];

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "👋 Hey! I'm your InstantPay assistant.\n\nTell me about a completed job and I'll process your PayPal payout right away.\n\n💡 Example: \"Job done for Ravi – Food Delivery – ₹720\"",
  timestamp: new Date(),
};

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Animated 3-dot typing indicator */
function TypingIndicator() {
  return (
    <div className="typing-wrap" aria-label="AI is typing" role="status">
      <div className="avatar ai">⚡</div>
      <div className="typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

/** Confirmation card rendered inside the AI bubble */
interface ConfirmCardProps {
  data: PendingPayout;
  onConfirm(): void;
  onCancel(): void;
  loading: boolean;
}

function ConfirmCard({ data, onConfirm, onCancel, loading }: ConfirmCardProps) {
  return (
    <div className="confirm-card" role="region" aria-label="Payout confirmation">
      <div className="confirm-card-header">
        <span style={{ fontSize: 15 }}>📋</span>
        <span className="confirm-card-title">Review Payout Details</span>
      </div>

      <div className="confirm-card-body">
        {[
          { label: "👤 Client", value: data.client_name },
          { label: "💼 Job Type", value: data.job_type },
          { label: "🏦 Via", value: "PayPal Sandbox" },
        ].map((r) => (
          <div key={r.label} className="confirm-row">
            <span className="confirm-label">{r.label}</span>
            <span className="confirm-value">{r.value}</span>
          </div>
        ))}
        <div className="confirm-row">
          <span className="confirm-label">💰 Amount</span>
          <span className="confirm-value amount">
            {formatINR(data.amount)}
          </span>
        </div>
      </div>

      <div className="confirm-actions">
        <button
          id="confirm-payout-btn"
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              Processing…
            </>
          ) : (
            "✅ Confirm & Send"
          )}
        </button>
        <button
          id="cancel-payout-btn"
          className="btn btn-danger"
          onClick={onCancel}
          disabled={loading}
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  );
}

/** Success card shown after payout completes */
function SuccessCard({ payout }: { payout: Payout }) {
  return (
    <div className="success-card" role="status" aria-live="polite">
      <div className="success-banner">
        <div className="success-banner-icon">✅</div>
        <div>
          <div className="success-banner-title">Payment Sent!</div>
          <div className="success-banner-sub">
            {formatINR(payout.amount)} → {payout.receiver_email}
          </div>
        </div>
      </div>
      <div className="success-txn">
        <div className="txn-label">Transaction ID</div>
        <div id="transaction-id-display" className="txn-id">
          {payout.transaction_id}
        </div>
      </div>
    </div>
  );
}

/** A single chat message row */
interface MsgBubbleProps {
  msg: Message;
  /** Non-null when this message is the active pending-payout host */
  pendingPayout: PendingPayout | null;
  completedPayout: Payout | null;
  onConfirm(): void;
  onCancel(): void;
  payoutLoading: boolean;
}

function MsgBubble({
  msg,
  pendingPayout,
  completedPayout,
  onConfirm,
  onCancel,
  payoutLoading,
}: MsgBubbleProps) {
  const isUser = msg.role === "user";
  return (
    <div className={`msg-row ${isUser ? "user" : ""}`}>
      <div className={`avatar ${isUser ? "user" : "ai"}`}>
        {isUser ? "👤" : "⚡"}
      </div>
      <div className="bubble-wrap">
        {/* Preserve newlines in bubble text */}
        <div className={`bubble ${isUser ? "user" : "ai"}`}>
          {msg.content.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < msg.content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>

        {/* Confirmation card — only on the matching AI message */}
        {!isUser && pendingPayout && !completedPayout && (
          <ConfirmCard
            data={pendingPayout}
            onConfirm={onConfirm}
            onCancel={onCancel}
            loading={payoutLoading}
          />
        )}

        {/* Success card after payout completes */}
        {!isUser && completedPayout && (
          <SuccessCard payout={completedPayout} />
        )}

        <div className="msg-time">{formatTime(msg.timestamp)}</div>
      </div>
    </div>
  );
}

/** Single history sidebar item */
function HistoryItem({ p }: { p: Payout }) {
  return (
    <div className="history-item" role="listitem">
      <div className="hi-top">
        <span className="hi-client">{p.client_name}</span>
        <span className="hi-amount">{formatINR(p.amount)}</span>
      </div>
      <div className="hi-job">💼 {p.job_type}</div>
      <div className="hi-txn">🔑 {p.transaction_id}</div>
      <div className="hi-footer">
        <span className="hi-time">{formatRelative(p.created_at)}</span>
        <span className={`status-pill ${p.status.toLowerCase()}`}>
          {p.status}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  // ── Theme ────────────────────────────────────────────────────────────────────
  const [dark, setDark] = useState(false);

  // Init theme from localStorage (client-only)
  useEffect(() => {
    const stored = localStorage.getItem("ip-theme");
    const prefersDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("ip-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  // ── Chat State ───────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ── Payout State ─────────────────────────────────────────────────────────────
  /** ID of the AI message that holds the active confirm card */
  const [pendingMsgId, setPendingMsgId] = useState<string | null>(null);
  const [pendingPayout, setPendingPayout] = useState<PendingPayout | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [completedPayout, setCompletedPayout] = useState<Payout | null>(null);

  // ── History State ────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<Payout[]>([]);
  const [stats, setStats] = useState({
    totalPayouts: 0,
    totalAmount: 0,
    successCount: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiLoading]);

  // ── Fetch history ─────────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.success) {
        setHistory(data.data ?? []);
        setStats(
          data.stats ?? { totalPayouts: 0, totalAmount: 0, successCount: 0 }
        );
      }
    } catch (e) {
      console.error("History load failed:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Add message helper ────────────────────────────────────────────────────────
  const pushMsg = useCallback(
    (partial: Omit<Message, "id" | "timestamp">): string => {
      const id = uid();
      setMessages((prev) => [
        ...prev,
        { ...partial, id, timestamp: new Date() },
      ]);
      return id;
    },
    []
  );

  // ── Trigger PayPal payout ─────────────────────────────────────────────────────
  const triggerPayout = useCallback(async () => {
    if (!pendingPayout || payoutLoading) return;
    setPayoutLoading(true);
    try {
      const res = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingPayout),
      });
      const data = await res.json();

      if (data.success && data.payout) {
        setCompletedPayout(data.payout);
        setPendingPayout(null);
        pushMsg({
          role: "assistant",
          content: `🎉 Done! ${formatINR(data.payout.amount)} has been sent to your PayPal.\n\nReady for your next job?`,
        });
        await loadHistory();
      } else {
        pushMsg({
          role: "assistant",
          content: `❌ Payout failed: ${data.error ?? "Unknown error"}. Please try again.`,
        });
        setPendingPayout(null);
      }
    } catch (e) {
      console.error("Payout error:", e);
      pushMsg({
        role: "assistant",
        content:
          "❌ Could not connect to PayPal. Check your credentials and try again.",
      });
    } finally {
      setPayoutLoading(false);
    }
  }, [pendingPayout, payoutLoading, pushMsg, loadHistory]);

  // ── Cancel payout ─────────────────────────────────────────────────────────────
  const handleCancelPayout = useCallback(() => {
    setPendingPayout(null);
    setPendingMsgId(null);
    pushMsg({
      role: "assistant",
      content: "❌ Payout cancelled. No money was sent. Let me know when you're ready!",
    });
  }, [pushMsg]);

  // ── Send message ──────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || aiLoading) return;

    setInput("");
    inputRef.current?.focus();
    pushMsg({ role: "user", content: text });
    setAiLoading(true);

    try {
      // Build rolling context (last 8 turns, skip welcome)
      const ctx = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: ctx }),
      });

      const data = await res.json();
      const ai: AIResponse = data.aiResponse;

      if (!data.success || !ai) {
        pushMsg({
          role: "assistant",
          content: "⚠️ Something went wrong. Please try again.",
        });
        return;
      }

      if (
        ai.intent === "create_payout" &&
        ai.client_name &&
        ai.job_type &&
        ai.amount
      ) {
        // New payout detected — reset previous
        setCompletedPayout(null);
        const pd: PendingPayout = {
          client_name: ai.client_name,
          job_type: ai.job_type,
          amount: ai.amount,
          currency: ai.currency ?? "INR",
        };
        setPendingPayout(pd);
        const msgId = pushMsg({
          role: "assistant",
          content: ai.message,
          payoutData: pd,
        });
        setPendingMsgId(msgId);
      } else if (ai.intent === "confirm" && pendingPayout) {
        // Text-based confirmation (e.g. user typed "yes")
        pushMsg({ role: "assistant", content: ai.message });
        await triggerPayout();
      } else {
        pushMsg({ role: "assistant", content: ai.message });
        if (ai.intent === "confirm" && !pendingPayout) {
          pushMsg({
            role: "assistant",
            content:
              "ℹ️ No pending payout to confirm. Tell me about a completed job first!",
          });
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      pushMsg({
        role: "assistant",
        content: "❌ Connection error. Please check your network.",
      });
    } finally {
      setAiLoading(false);
    }
  }, [input, aiLoading, messages, pendingPayout, pushMsg, triggerPayout]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main className="app-shell">
      {/* ═══════════════════════════════════════════════
          CHAT PANEL
          ═══════════════════════════════════════════════ */}
      <section
        className="chat-panel"
        aria-label="InstantPay AI chat"
        style={{ display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <header className="app-header">
          <div className="header-brand">
            <div className="header-logo" aria-hidden>⚡</div>
            <div>
              <div className="header-name">
                Instant<span>Pay</span> AI
              </div>
              <div className="header-tag">Gig Payout Agent</div>
            </div>
          </div>

          <div className="header-right">
            <div className="online-badge" role="status">
              <span className="online-dot" aria-hidden />
              AI Online
            </div>

            {/* Theme toggle */}
            <button
              id="theme-toggle-btn"
              className="theme-btn"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Light mode" : "Dark mode"}
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div
          className="message-area"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {/* Welcome screen (only when no messages beyond the greeting) */}
          {messages.length === 1 && (
            <div className="welcome-screen">
              <div className="welcome-icon" aria-hidden>⚡</div>
              <h1 className="welcome-title">
                Instant<span>Pay</span> AI
              </h1>
              <p className="welcome-sub">
                Chat with the AI, describe a completed job, and receive your
                payment via PayPal — instantly.
              </p>
              <div className="feature-grid">
                {[
                  ["🤖", "AI Powered"],
                  ["⚡", "Instant Payout"],
                  ["🔒", "PayPal Sandbox"],
                  ["📊", "History Tracking"],
                ].map(([icon, label]) => (
                  <div key={label} className="feature-chip">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <MsgBubble
              key={msg.id}
              msg={msg}
              pendingPayout={
                msg.id === pendingMsgId && msg.payoutData ? pendingPayout : null
              }
              completedPayout={
                msg.id === pendingMsgId ? completedPayout : null
              }
              onConfirm={triggerPayout}
              onCancel={handleCancelPayout}
              payoutLoading={payoutLoading}
            />
          ))}

          {/* Typing indicator */}
          {aiLoading && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-section">
          {/* Quick-start hint chips */}
          <div className="hint-row" role="group" aria-label="Example messages">
            {HINT_EXAMPLES.map((h) => (
              <button
                key={h}
                className="hint-chip"
                onClick={() => {
                  setInput(h);
                  inputRef.current?.focus();
                }}
                title={h}
              >
                {h.length > 36 ? h.slice(0, 36) + "…" : h}
              </button>
            ))}
          </div>

          <div className="input-row">
            <div className="input-box">
              <textarea
                ref={inputRef}
                id="chat-input"
                className="chat-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='e.g. "Job done for Ravi – Food Delivery – ₹720"'
                rows={1}
                disabled={aiLoading || payoutLoading}
                aria-label="Chat message input"
              />
            </div>
            <button
              id="send-message-btn"
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || aiLoading || payoutLoading}
              aria-label="Send message"
              title="Send (Enter)"
            >
              {aiLoading ? (
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin .7s linear infinite",
                    display: "inline-block",
                  }}
                />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>

          <div className="input-footer">
            <span className="input-hint">
              <span className="kbd">Enter</span> to send ·{" "}
              <span className="kbd">Shift+Enter</span> for new line
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HISTORY SIDEBAR
          ═══════════════════════════════════════════════ */}
      <aside className="history-sidebar" aria-label="Payout history">
        <div className="sidebar-head">
          <div className="sidebar-title">
            <div className="sidebar-title-icon" aria-hidden>📊</div>
            Payout History
          </div>

          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-label">Total Payouts</div>
              <div className="stat-val">{stats.totalPayouts}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Total Earned</div>
              <div className="stat-val green">
                {formatINR(stats.totalAmount)}
              </div>
            </div>
          </div>
        </div>

        <div className="history-list" role="list" aria-label="Past payouts">
          {historyLoading ? (
            // Skeleton loading state
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "4px 0",
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "14px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div className="skeleton" style={{ width: "60%", height: 13 }} />
                  <div className="skeleton" style={{ width: "40%", height: 11 }} />
                  <div className="skeleton" style={{ width: "80%", height: 10 }} />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">📭</div>
              <p className="history-empty-text">
                No payouts yet. Complete your first job to see it here!
              </p>
            </div>
          ) : (
            history.map((p) => <HistoryItem key={p.id} p={p} />)
          )}
        </div>
      </aside>
    </main>
  );
}
