"use client";

import { useState, useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";

export default function DebugPage() {
  const { data: session, isPending, error: sessionError } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [apiDebug, setApiDebug] = useState<string>("");

  const log = (msg: string) => {
    const ts = new Date().toISOString().slice(11, 23);
    setLogs((prev) => [...prev, `[${ts}] ${msg}`]);
  };

  useEffect(() => {
    log("Page loaded");
    log(`URL: ${window.location.href}`);
    log(`Cookies: ${document.cookie || "(none visible to JS)"}`);
    log(`Session pending: ${isPending}`);

    if (session) {
      log(`Session found: ${JSON.stringify(session.user)}`);
    } else if (!isPending) {
      log("No session (not pending)");
    }

    if (sessionError) {
      log(`Session error: ${JSON.stringify(sessionError)}`);
    }

    // Fetch server-side debug
    fetch("/api/debug")
      .then((r) => r.json())
      .then((data) => {
        const formatted = JSON.stringify(data, null, 2);
        setApiDebug(formatted);
        log(`Server debug fetched (${formatted.length} chars)`);
      })
      .catch((e) => log(`Server debug error: ${e.message}`));
  }, [session, isPending, sessionError]);

  const testSocialLogin = async (provider: "google" | "github") => {
    log(`--- Starting ${provider} social login ---`);
    log(`callbackURL will be: ${window.location.origin}/debug`);

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin + "/debug",
      });
      log(`signIn.social result: ${JSON.stringify(result)}`);

      const url = result?.data?.url as string | undefined;
      if (url) {
        log(`Redirect URL: ${url}`);
        log("Redirecting in 1 second...");
        setTimeout(() => {
          window.location.href = url;
        }, 1000);
      } else if (result?.error) {
        log(`Error: ${JSON.stringify(result.error)}`);
      } else {
        log(`Unexpected result shape: ${JSON.stringify(result)}`);
      }
    } catch (e: unknown) {
      log(`Exception: ${e}`);
    }
  };

  const copyLogs = () => {
    const text = [
      "=== Client Logs ===",
      ...logs,
      "",
      "=== Server Debug (/api/debug) ===",
      apiDebug,
    ].join("\n");
    navigator.clipboard.writeText(text);
    log("Logs copied to clipboard!");
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "20px auto",
        padding: 20,
        fontFamily: "monospace",
        fontSize: 13,
      }}
    >
      <h2>Auth Debug Page</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => testSocialLogin("google")}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Test Google Login
        </button>
        <button
          onClick={() => testSocialLogin("github")}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Test GitHub Login
        </button>
        <button
          onClick={copyLogs}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 4,
          }}
        >
          Copy All Logs
        </button>
      </div>

      <h3>Client Session</h3>
      <pre
        style={{
          background: "#1e293b",
          color: "#e2e8f0",
          padding: 12,
          borderRadius: 6,
          overflow: "auto",
        }}
      >
        {isPending
          ? "Loading..."
          : session
            ? JSON.stringify(session, null, 2)
            : "No session"}
      </pre>

      <h3>Client Logs</h3>
      <pre
        style={{
          background: "#1e293b",
          color: "#4ade80",
          padding: 12,
          borderRadius: 6,
          overflow: "auto",
          maxHeight: 300,
        }}
      >
        {logs.join("\n") || "No logs yet"}
      </pre>

      <h3>Server Debug (/api/debug)</h3>
      <pre
        style={{
          background: "#1e293b",
          color: "#fbbf24",
          padding: 12,
          borderRadius: 6,
          overflow: "auto",
          maxHeight: 400,
        }}
      >
        {apiDebug || "Loading..."}
      </pre>
    </div>
  );
}
