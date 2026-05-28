"use client";
import { useState, useRef } from "react";
import ConceptMapStudyTool from "../components/ConceptMapStudyTool";

const ACCEPTED = ["application/pdf", "text/plain"];
const isValid = (f) => ACCEPTED.includes(f.type) || f.name.endsWith(".txt") || f.name.endsWith(".pdf");

export default function Home() {
  const [stage, setStage] = useState("upload");
  const [mapData, setMapData] = useState(null);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]); // multiple files
  const [text, setText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const hasInput = files.length > 0 || text.trim();

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(isValid);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !existing.has(f.name))];
    });
  };

  const removeFile = (name) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleGenerate = async () => {
    if (!hasInput) return;
    setStage("loading");
    setError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    if (text.trim()) formData.append("text", text.trim());

    try {
      const res = await fetch("/api/generate-map", { method: "POST", body: formData });
      if (!res.ok) {
        let errMsg = `Request failed (${res.status})`;
        try { const err = await res.json(); errMsg = err.error || errMsg; } catch { errMsg = await res.text().catch(() => errMsg); }
        throw new Error(errMsg);
      }
      const data = await res.json();
      setMapData(data);
      setStage("map");
    } catch (err) {
      setError(err.message);
      setStage("upload");
    }
  };

  const handleReset = () => {
    setStage("upload");
    setMapData(null);
    setFiles([]);
    setText("");
    setError(null);
  };

  if (stage === "map") {
    return (
      <ConceptMapStudyTool
        nodes={mapData?.nodes}
        edges={mapData?.edges}
        title={mapData?.title}
        subtitle={mapData?.subtitle}
        onReset={handleReset}
      />
    );
  }

  const isLoading = stage === "loading";

  return (
    <div style={{
      minHeight: "100vh", background: "#FAF8F5",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#9CA3AF",
            fontFamily: "'DM Mono', monospace", marginBottom: 10,
          }}>
            CS188 — Concept Map Study Tool
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: "0 0 10px" }}>
            Upload your lecture material
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0, lineHeight: 1.65 }}>
            Drop PDFs or paste your notes. We'll generate an interactive concept map
            so you can see what you know—and what you don't.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "white", borderRadius: 16,
          border: "1px solid #E5E7EB", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "28px 24px",
              borderBottom: files.length > 0 ? "none" : "1px solid #F3F4F6",
              textAlign: "center", cursor: "pointer",
              background: dragOver ? "#EEF2FF" : "white",
              transition: "background 0.2s ease",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,text/plain,application/pdf"
              multiple
              style={{ display: "none" }}
              onChange={(e) => addFiles(e.target.files)}
            />
            <div style={{ fontSize: 32, marginBottom: 8 }}>☁️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
              {dragOver ? "Drop to add files" : "Drop PDFs or text files here"}
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              or click to browse — multiple files supported
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ padding: "8px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {files.map((f) => (
                  <div key={f.name} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 8,
                    background: "#F9FAFB", border: "1px solid #E5E7EB",
                  }}>
                    <span style={{ fontSize: 16 }}>{f.name.endsWith(".pdf") ? "📄" : "📝"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                        {(f.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                      style={{
                        width: 22, height: 22, borderRadius: "50%", border: "1px solid #E5E7EB",
                        background: "white", cursor: "pointer", fontSize: 12, color: "#9CA3AF",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                style={{
                  marginTop: 8, background: "none", border: "none",
                  color: "#6366F1", fontSize: 12, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500, padding: 0,
                }}
              >
                + Add more files
              </button>
            </div>
          )}

          {/* Paste area */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#9CA3AF", marginBottom: 8,
            }}>
              Or paste notes directly
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste lecture notes, slide text, or any study material here…"
              style={{
                width: "100%", minHeight: 100, border: "1px solid #E5E7EB",
                borderRadius: 8, padding: "10px 12px", fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", color: "#374151",
                resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5,
              }}
              onFocus={(e) => { e.target.style.borderColor = "#6366F1"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "12px 24px", background: "#FEF2F2", borderBottom: "1px solid #FECACA" }}>
              <span style={{ fontSize: 13, color: "#991B1B" }}>⚠ {error}</span>
            </div>
          )}

          {/* Generate button */}
          <div style={{ padding: "16px 24px" }}>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !hasInput}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                background: (!hasInput || isLoading) ? "#E5E7EB" : "linear-gradient(135deg, #6366F1, #818CF8)",
                color: (!hasInput || isLoading) ? "#9CA3AF" : "white",
                fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                cursor: (!hasInput || isLoading) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "white", borderRadius: "50%",
                    display: "inline-block", animation: "spin 0.8s linear infinite",
                  }} />
                  Generating your map…
                </>
              ) : `Generate Concept Map${files.length > 1 ? ` from ${files.length} files` : ""} →`}
            </button>
          </div>
        </div>

        {/* Demo link */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => setStage("map")}
            style={{
              background: "none", border: "none", color: "#9CA3AF",
              fontSize: 12, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", textDecoration: "underline",
            }}
          >
            Try the demo (Cognitive Load Theory)
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
