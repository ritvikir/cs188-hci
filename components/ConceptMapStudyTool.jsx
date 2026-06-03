"use client";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";

// ─── Demo Data (used when no props are passed) ────────────────────────────────
const DEMO_NODES = [
  { id: "clt", label: "Cognitive Load\nTheory", def: "A theory by John Sweller (1988) proposing that learning is constrained by the limited capacity of working memory. Effective instruction design minimizes unnecessary load while maximizing schema formation.", source: "Slide 2 · Sweller (1988)", x: 420, y: 260, resources: [
    { title: "Cognitive load theory (Wikipedia)", url: "https://en.wikipedia.org/wiki/Cognitive_load", type: "article", free: true },
    { title: "Sweller — Cognitive Load During Problem Solving", url: "https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog1202_4", type: "docs", free: false },
    { title: "Cognitive Load Theory explained (video)", url: "https://www.youtube.com/watch?v=Y6Sgp7y178k", type: "video", free: true },
  ] },
  { id: "wm", label: "Working\nMemory", def: "The cognitive system responsible for temporarily holding and processing information. It has limited capacity (~4 chunks) and duration, forming the bottleneck that CLT addresses.", source: "Slide 3", x: 140, y: 110, resources: [
    { title: "Working memory (Wikipedia)", url: "https://en.wikipedia.org/wiki/Working_memory", type: "article", free: true },
    { title: "Miller — The Magical Number Seven", url: "https://en.wikipedia.org/wiki/The_Magical_Number_Seven,_Plus_or_Minus_Two", type: "article", free: true },
  ] },
  { id: "ltm", label: "Long-term\nMemory", def: "Virtually unlimited store of knowledge organized as schemas. Learning = transferring organized info from working memory to long-term memory.", source: "Slide 3", x: 620, y: 100, resources: [
    { title: "Long-term memory (Wikipedia)", url: "https://en.wikipedia.org/wiki/Long-term_memory", type: "article", free: true },
    { title: "Memory — Simply Psychology", url: "https://www.simplypsychology.org/memory.html", type: "article", free: true },
  ] },
  { id: "dct", label: "Dual-Channel\nTheory", def: "Baddeley's model proposing that working memory has separate channels for visual/spatial and auditory/verbal information. Instruction can leverage both channels to increase effective capacity.", source: "Slide 8", x: 820, y: 100, resources: [
    { title: "Baddeley's model of working memory", url: "https://en.wikipedia.org/wiki/Baddeley%27s_model_of_working_memory", type: "article", free: true },
    { title: "Dual-coding theory (Wikipedia)", url: "https://en.wikipedia.org/wiki/Dual-coding_theory", type: "article", free: true },
  ] },
  { id: "il", label: "Intrinsic\nLoad", def: "The inherent complexity of the material being learned, determined by element interactivity. Cannot be reduced by instruction design — it's a property of the content itself relative to the learner's expertise.", source: "Slide 5", x: 180, y: 400, resources: [
    { title: "Element interactivity & intrinsic load", url: "https://en.wikipedia.org/wiki/Cognitive_load#Intrinsic", type: "article", free: true },
  ] },
  { id: "el", label: "Extraneous\nLoad", def: "Unnecessary cognitive load caused by poor instructional design — irrelevant visuals, split sources of info, redundant text. This is the load instructors should minimize.", source: "Slide 6", x: 370, y: 490, resources: [
    { title: "Extraneous load (Wikipedia)", url: "https://en.wikipedia.org/wiki/Cognitive_load#Extraneous", type: "article", free: true },
  ] },
  { id: "gl", label: "Germane\nLoad", def: "Cognitive effort dedicated to building and automating schemas. Unlike extraneous load, germane load is productive — it's the 'good' cognitive work of actually learning.", source: "Slide 7", x: 560, y: 490, resources: [
    { title: "Germane load (Wikipedia)", url: "https://en.wikipedia.org/wiki/Cognitive_load#Germane", type: "article", free: true },
  ] },
  { id: "schema", label: "Schema", def: "An organized knowledge structure in long-term memory that allows complex information to be treated as a single element in working memory. Expertise = having rich, automated schemas.", source: "Slide 4", x: 680, y: 330, resources: [
    { title: "Schema (psychology) — Wikipedia", url: "https://en.wikipedia.org/wiki/Schema_(psychology)", type: "article", free: true },
    { title: "Schema theory — Simply Psychology", url: "https://www.simplypsychology.org/what-is-a-schema.html", type: "article", free: true },
  ] },
  { id: "ere", label: "Expertise\nReversal Effect", def: "Instructional techniques that help novices (like worked examples) can actually harm experts by imposing redundant information. Instruction should adapt to the learner's level.", source: "Slide 12", x: 850, y: 310, resources: [
    { title: "Expertise reversal effect (Wikipedia)", url: "https://en.wikipedia.org/wiki/Expertise_reversal_effect", type: "article", free: true },
  ] },
  { id: "sae", label: "Split-Attention\nEffect", def: "When learners must mentally integrate multiple sources of information (e.g., a diagram and separate text), extraneous load increases. Solution: physically integrate related information.", source: "Slide 9", x: 130, y: 560, resources: [
    { title: "Split attention effect (Wikipedia)", url: "https://en.wikipedia.org/wiki/Split_attention_effect", type: "article", free: true },
  ] },
  { id: "re", label: "Redundancy\nEffect", def: "When the same information is presented in multiple unnecessary forms (e.g., identical text read aloud and displayed), it increases extraneous load rather than helping.", source: "Slide 10", x: 370, y: 620, resources: [
    { title: "Redundancy effect (Wikipedia)", url: "https://en.wikipedia.org/wiki/Redundancy_(information_theory)", type: "article", free: true },
  ] },
  { id: "we", label: "Worked\nExamples", def: "Step-by-step demonstrations of how to solve problems. Reduces extraneous load for novices by showing the solution path rather than requiring them to search for it.", source: "Slide 11", x: 740, y: 470, resources: [
    { title: "Worked-example effect (Wikipedia)", url: "https://en.wikipedia.org/wiki/Worked-example_effect", type: "article", free: true },
  ] },
];

const DEMO_EDGES = [
  { from: "wm", to: "ltm", label: "encodes to" },
  { from: "ltm", to: "wm", label: "informs" },
  { from: "wm", to: "clt", label: "constrains" },
  { from: "ltm", to: "clt", label: "interacts with" },
  { from: "clt", to: "il", label: "comprises" },
  { from: "clt", to: "el", label: "comprises" },
  { from: "clt", to: "gl", label: "comprises" },
  { from: "il", to: "clt", label: "element interactivity shapes" },
  { from: "ltm", to: "schema", label: "stored in" },
  { from: "gl", to: "schema", label: "builds" },
  { from: "schema", to: "we", label: "promotes" },
  { from: "we", to: "ere", label: "limits effect of" },
  { from: "el", to: "re", label: "increases" },
  { from: "el", to: "sae", label: "increases" },
  { from: "ltm", to: "dct", label: "related" },
];

const TAG_COLORS = {
  clear: { bg: "#D1FAE5", border: "#34D399", text: "#065F46", dot: "#10B981" },
  shaky: { bg: "#FEF3C7", border: "#FBBF24", text: "#92400E", dot: "#F59E0B" },
  needs_work: { bg: "#FEE2E2", border: "#F87171", text: "#991B1B", dot: "#EF4444" },
};

const RESOURCE_TYPES = {
  article: { label: "Article", bg: "#EEF2FF", text: "#4338CA" },
  video: { label: "Video", bg: "#FEF2F2", text: "#B91C1C" },
  course: { label: "Course", bg: "#ECFDF5", text: "#047857" },
  docs: { label: "Docs", bg: "#F5F3FF", text: "#6D28D9" },
  tool: { label: "Tool", bg: "#FFF7ED", text: "#C2410C" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getNodeById(nodes, id) { return nodes.find((n) => n.id === id); }

function getConnected(edges, nodeId) {
  const connected = new Set();
  const edgeSet = new Set();
  edges.forEach((e, i) => {
    if (e.from === nodeId || e.to === nodeId) {
      connected.add(e.from);
      connected.add(e.to);
      edgeSet.add(i);
    }
  });
  return { nodes: connected, edges: edgeSet };
}

function getPrereqs(edges, nodeId) {
  return edges.filter((e) => e.to === nodeId).map((e) => e.from);
}

// Flatten the resources across a set of nodes, deduped by URL.
function mergeResources(nodes) {
  const seen = new Set();
  const merged = [];
  nodes.forEach((n) => {
    (n.resources || []).forEach((r) => {
      if (r && r.url && !seen.has(r.url)) {
        seen.add(r.url);
        merged.push(r);
      }
    });
  });
  return merged;
}

// A single resource link row (roadmap.sh-style: type badge + title link).
function ResourceRow({ resource }) {
  const t = RESOURCE_TYPES[resource.type] || RESOURCE_TYPES.article;
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
        borderRadius: 8, background: "#F9FAFB", border: "1px solid #F3F4F6",
        textDecoration: "none", transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#F3F4F6"; }}
    >
      <span style={{
        fontSize: 9.5, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase",
        padding: "2px 6px", borderRadius: 5, background: t.bg, color: t.text, flexShrink: 0,
      }}>{t.label}</span>
      <span style={{ flex: 1, fontSize: 12.5, color: "#374151", fontWeight: 500, lineHeight: 1.35 }}>
        {resource.title}
      </span>
      {resource.free && (
        <span style={{ fontSize: 9.5, fontWeight: 600, color: "#059669", flexShrink: 0 }}>Free</span>
      )}
      <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>↗</span>
    </a>
  );
}

function computeStudyPath(nodes, edges, tags) {
  const tagged = Object.keys(tags);
  if (tagged.length < 4) return null;

  const needsWork = tagged.filter((id) => tags[id] === "needs_work");
  const shaky = tagged.filter((id) => tags[id] === "shaky");
  const path = [];
  const added = new Set();

  needsWork.forEach((nw) => {
    getPrereqs(edges, nw).forEach((p) => {
      if (!added.has(p) && tags[p] && tags[p] !== "clear") {
        path.push({ id: p, reason: `Prerequisite for ${getNodeById(nodes, nw)?.label.replace("\n", " ")}` });
        added.add(p);
      }
    });
    if (!added.has(nw)) {
      path.push({ id: nw, reason: "Marked as Needs Work" });
      added.add(nw);
    }
  });

  shaky.forEach((s) => {
    if (!added.has(s)) {
      path.push({ id: s, reason: "Marked as Shaky" });
      added.add(s);
    }
  });

  return path.length > 0 ? path : null;
}

function edgePath(from, to, idx, edges) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const hasReverse = edges.some((e, i) => i !== idx && e.from === edges[idx].to && e.to === edges[idx].from);
  const curvature = hasReverse ? 0.15 : 0.02;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const nx = -dy / dist;
  const ny = dx / dist;
  const cx = mx + nx * dist * curvature;
  const cy = my + ny * dist * curvature;
  return { path: `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`, cx, cy };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ProgressBar({ tags, totalNodes }) {
  const clear = Object.values(tags).filter((t) => t === "clear").length;
  const shaky = Object.values(tags).filter((t) => t === "shaky").length;
  const needsWork = Object.values(tags).filter((t) => t === "needs_work").length;
  const untagged = totalNodes - clear - shaky - needsWork;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
      <div style={{ flex: 1, height: 10, borderRadius: 5, overflow: "hidden", display: "flex", background: "#E5E5E5" }}>
        {clear > 0 && <div style={{ width: `${(clear / totalNodes) * 100}%`, background: "linear-gradient(90deg, #34D399, #6EE7B7)", transition: "width 0.5s ease" }} />}
        {shaky > 0 && <div style={{ width: `${(shaky / totalNodes) * 100}%`, background: "linear-gradient(90deg, #FBBF24, #FCD34D)", transition: "width 0.5s ease" }} />}
        {needsWork > 0 && <div style={{ width: `${(needsWork / totalNodes) * 100}%`, background: "linear-gradient(90deg, #F87171, #FCA5A5)", transition: "width 0.5s ease" }} />}
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#6B7280", whiteSpace: "nowrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />{clear} Clear</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />{shaky} Shaky</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />{needsWork} Needs Work</span>
        {untagged > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D1D5DB", display: "inline-block" }} />{untagged} Untagged</span>}
      </div>
    </div>
  );
}

function StudyPath({ path, nodes, onNodeClick, expanded, onToggle }) {
  if (!path) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg, #FFF7ED, #FFFBEB)",
      border: "1px solid #FDE68A", borderRadius: 12,
      padding: expanded ? "14px 18px" : "10px 18px",
      marginTop: 10, transition: "all 0.3s ease",
    }}>
      <div onClick={onToggle} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🧭</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "#92400E" }}>Suggested Study Path</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#B45309", background: "#FEF3C7", padding: "2px 8px", borderRadius: 10 }}>
            {path.length} concepts
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#B45309", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {path.map((item, i) => {
            const node = getNodeById(nodes, item.id);
            return (
              <div
                key={item.id}
                onClick={() => onNodeClick(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  borderRadius: 8, cursor: "pointer", background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(251,191,36,0.2)", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#FBBF24"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.2)"; }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", background: "#F59E0B", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
                }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 600, color: "#1F2937" }}>
                    {node?.label.replace("\n", " ")}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10.5, color: "#92400E", marginTop: 1 }}>
                    {item.reason}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "#D97706" }}>→</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidePanel({ node, nodes, edges, tags, onTag, notes, onNote, onClose, onNavigate, subgraphNodes, synthesis, knowledgeLoading }) {
  if (!node) return null;
  const tag = tags[node.id];
  const related = [];
  edges.forEach((e) => {
    if (e.from === node.id && !related.find((r) => r.id === e.to))
      related.push({ id: e.to, label: getNodeById(nodes, e.to)?.label.replace("\n", " "), rel: e.label });
    if (e.to === node.id && !related.find((r) => r.id === e.from))
      related.push({ id: e.from, label: getNodeById(nodes, e.from)?.label.replace("\n", " "), rel: e.label });
  });

  const nodeResources = node.resources || [];
  const mergedResources = mergeResources(subgraphNodes || [node]);
  const labelStyle = { fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 8 };

  return (
    <div style={{
      width: 320, minWidth: 320, height: "100%", background: "#FFFFFE",
      borderLeft: "1px solid #E5E7EB", padding: "24px 20px", overflowY: "auto",
      fontFamily: "'DM Sans', sans-serif", position: "relative",
      boxShadow: "-4px 0 24px rgba(0,0,0,0.04)",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 16, width: 28, height: 28, borderRadius: "50%",
        border: "1px solid #E5E7EB", background: "white", cursor: "pointer",
        fontSize: 14, color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center",
      }}>×</button>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 12, paddingRight: 30, lineHeight: 1.3 }}>
        {node.label.replace("\n", " ")}
      </h2>

      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "#374151", marginBottom: 20 }}>{node.def}</p>

      {/* Confidence tags */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 8 }}>
          How well do you know this?
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["clear", "Clear"], ["shaky", "Shaky"], ["needs_work", "Needs Work"]].map(([key, label]) => {
            const active = tag === key;
            const c = TAG_COLORS[key];
            return (
              <button
                key={key}
                onClick={() => onTag(node.id, key)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s ease",
                  border: active ? `2px solid ${c.border}` : "2px solid #E5E7EB",
                  background: active ? c.bg : "white",
                  color: active ? c.text : "#6B7280",
                  transform: active ? "scale(1.03)" : "scale(1)",
                }}
              >{label}</button>
            );
          })}
        </div>
      </div>

      {/* Resources for this concept */}
      {nodeResources.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={labelStyle}>Resources</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {nodeResources.map((r) => <ResourceRow key={r.url} resource={r} />)}
          </div>
        </div>
      )}

      {/* Related */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 8 }}>
          Related Concepts
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {related.map((r) => (
            <button
              key={r.id}
              onClick={() => onNavigate(r.id)}
              title={r.rel}
              style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#374151",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#E5E7EB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F3F4F6"; }}
            >{r.label}</button>
          ))}
        </div>
      </div>

      {/* Connected Knowledge — the grand knowledge view for the selected subgraph */}
      {subgraphNodes && subgraphNodes.length > 1 && (
        <div style={{ marginBottom: 22, paddingTop: 18, borderTop: "1px solid #E5E7EB" }}>
          <div style={{ ...labelStyle, color: "#6366F1" }}>
            Connected Knowledge · {subgraphNodes.length} concepts
          </div>
          {knowledgeLoading ? (
            <div style={{ fontSize: 12.5, color: "#9CA3AF", lineHeight: 1.6, marginBottom: 12 }}>
              Synthesizing how these concepts connect…
            </div>
          ) : synthesis ? (
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#374151", marginTop: 0, marginBottom: 14 }}>
              {synthesis}
            </p>
          ) : null}
          {mergedResources.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", marginBottom: 8 }}>
                {mergedResources.length} resources across this neighborhood
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {mergedResources.map((r) => <ResourceRow key={r.url} resource={r} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* My Note */}
      <div style={{ marginBottom: 22 }}>
        <div style={labelStyle}>My Note</div>
        <textarea
          value={notes[node.id] || ""}
          onChange={(e) => onNote(node.id, e.target.value)}
          placeholder="Add a note for this concept…"
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 60,
            padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
            background: "#F9FAFB", fontSize: 12.5, lineHeight: 1.5, color: "#374151",
            fontFamily: "'DM Sans', sans-serif", outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.background = "white"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#F9FAFB"; }}
        />
      </div>

      {/* Source */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 8 }}>
          Source Material
        </div>
        <div style={{ padding: "10px 12px", borderRadius: 8, background: "#F9FAFB", border: "1px solid #F3F4F6", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
          {node.source}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ConceptMapStudyTool({
  nodes: propNodes,
  edges: propEdges,
  title: propTitle,
  subtitle: propSubtitle,
  onReset,
}) {
  const NODES = propNodes || DEMO_NODES;
  const EDGES = propEdges || DEMO_EDGES;
  const mapTitle = propTitle || "Introduction to Cognitive Load Theory";
  const mapSubtitle = propSubtitle || "PSYCH 142 — Week 4 — Concept Map";

  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [tags, setTags] = useState({});
  const [notes, setNotes] = useState({}); // { [nodeId]: noteText }
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [pathExpanded, setPathExpanded] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [knowledge, setKnowledge] = useState({}); // { [nodeId]: { synthesis } } cache
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);

  useEffect(() => {
    // Reset tags + cached subgraph syntheses when the map data changes
    setSelected(null);
    setTags({});
    setNotes({});
    setKnowledge({});
  }, [propNodes]);

  useEffect(() => {
    const interval = setInterval(() => setPulsePhase((p) => (p + 1) % 60), 50);
    return () => clearInterval(interval);
  }, []);

  const connected = useMemo(
    () => (selected ? getConnected(EDGES, selected) : { nodes: new Set(), edges: new Set() }),
    [selected, EDGES]
  );
  const studyPath = useMemo(() => computeStudyPath(NODES, EDGES, tags), [NODES, EDGES, tags]);

  const handleTag = useCallback((nodeId, tag) => {
    setTags((prev) => {
      if (prev[nodeId] === tag) { const next = { ...prev }; delete next[nodeId]; return next; }
      return { ...prev, [nodeId]: tag };
    });
  }, []);

  const handleNote = useCallback((nodeId, text) => {
    setNotes((prev) => ({ ...prev, [nodeId]: text }));
  }, []);

  const handleSelectNode = useCallback((id) => {
    setSelected((prev) => (prev === id ? null : id));
  }, []);

  const selectedNode = selected ? getNodeById(NODES, selected) : null;
  const hoveredNode = hovered ? getNodeById(NODES, hovered) : null;

  // The "subgraph" for the grand-knowledge view is the existing highlight set:
  // the selected node plus its directly-connected neighbors.
  const subgraphNodes = useMemo(() => {
    if (!selectedNode) return null;
    const ids = new Set(connected.nodes);
    ids.add(selectedNode.id);
    return NODES.filter((n) => ids.has(n.id));
  }, [selectedNode, connected, NODES]);

  // Fetch the AI synthesis for the selected node's subgraph on demand, cached per node.
  useEffect(() => {
    if (!selectedNode || !subgraphNodes || subgraphNodes.length < 2) return;
    if (knowledge[selectedNode.id]) return;

    let cancelled = false;
    setKnowledgeLoading(true);
    fetch("/api/subgraph-knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: selectedNode.label.replace("\n", " "),
        nodes: subgraphNodes.map((n) => ({ label: n.label, def: n.def })),
        edges: EDGES.filter((e) => connected.nodes.has(e.from) && connected.nodes.has(e.to)),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setKnowledge((prev) => ({ ...prev, [selectedNode.id]: { synthesis: data.synthesis || null } }));
      })
      .catch(() => {
        if (!cancelled) setKnowledge((prev) => ({ ...prev, [selectedNode.id]: { synthesis: null } }));
      })
      .finally(() => { if (!cancelled) setKnowledgeLoading(false); });

    return () => { cancelled = true; };
  }, [selectedNode, subgraphNodes, connected, EDGES, knowledge]);

  const bg = darkMode ? "#1A1A1F" : "#FAF8F5";
  const cardBg = darkMode ? "#25252B" : "#FFFFFF";
  const textPrimary = darkMode ? "#F3F4F6" : "#111827";
  const textSecondary = darkMode ? "#9CA3AF" : "#6B7280";
  const borderColor = darkMode ? "#374151" : "#E5E7EB";
  const svgBg = darkMode ? "#1F1F25" : "#FEFDFB";
  const pulseVal = Math.sin(pulsePhase * 0.1) * 0.5 + 0.5;

  // Compute SVG viewBox to fit all nodes
  const xs = NODES.map((n) => n.x);
  const ys = NODES.map((n) => n.y);
  const minX = Math.max(0, Math.min(...xs) - 100);
  const minY = Math.max(0, Math.min(...ys) - 80);
  const maxX = Math.max(...xs) + 100;
  const maxY = Math.max(...ys) + 80;
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: bg, fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      {/* Top Bar */}
      <div style={{
        padding: "14px 24px", borderBottom: `1px solid ${borderColor}`, background: cardBg,
        display: "flex", flexDirection: "column", gap: 10, flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: textSecondary, fontFamily: "'DM Mono', monospace" }}>
              {mapSubtitle}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: textPrimary, marginTop: 2 }}>
              {mapTitle}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: textSecondary }}>{NODES.length} concepts</span>
            {onReset && (
              <button
                onClick={onReset}
                style={{
                  padding: "6px 12px", borderRadius: 8, border: `1px solid ${borderColor}`,
                  background: cardBg, cursor: "pointer", fontSize: 12, color: textSecondary,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                ← New Map
              </button>
            )}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              style={{
                padding: "6px 12px", borderRadius: 8, border: `1px solid ${borderColor}`,
                background: cardBg, cursor: "pointer", fontSize: 12, color: textSecondary,
                fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              ⚙ Tweaks
            </button>
          </div>
        </div>

        <ProgressBar tags={tags} totalNodes={NODES.length} />

        {settingsOpen && (
          <div style={{ display: "flex", gap: 20, padding: "8px 0", fontSize: 12, color: textSecondary }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={showEdgeLabels} onChange={(e) => setShowEdgeLabels(e.target.checked)} />
              Edge Labels
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
              Dark Mode
            </label>
          </div>
        )}

        <StudyPath
          path={studyPath}
          nodes={NODES}
          onNodeClick={handleSelectNode}
          expanded={pathExpanded}
          onToggle={() => setPathExpanded(!pathExpanded)}
        />
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <svg
            viewBox={viewBox}
            style={{ width: "100%", height: "100%", background: svgBg }}
          >
            <defs>
              <marker id="arrow" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
                <polygon points="0 0, 10 3.5, 0 7" fill={darkMode ? "#4B5563" : "#BFBFBF"} />
              </marker>
              <marker id="arrow-hi" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" />
              </marker>
              <filter id="glow-red">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.06" />
              </filter>
            </defs>

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const from = getNodeById(NODES, edge.from);
              const to = getNodeById(NODES, edge.to);
              if (!from || !to) return null;
              const { path, cx, cy } = edgePath(from, to, i, EDGES);
              const isHighlighted = selected && connected.edges.has(i);
              const isDimmed = selected && !isHighlighted;

              return (
                <g key={i} style={{ transition: "opacity 0.3s ease" }} opacity={isDimmed ? 0.12 : 1}>
                  <path
                    d={path} fill="none"
                    stroke={isHighlighted ? "#6366F1" : (darkMode ? "#374151" : "#D1D5DB")}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    markerEnd={isHighlighted ? "url(#arrow-hi)" : "url(#arrow)"}
                    style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
                  />
                  {showEdgeLabels && (
                    <text
                      x={cx} y={cy - 6} textAnchor="middle"
                      style={{
                        fontSize: 9.5, fill: isHighlighted ? "#6366F1" : (darkMode ? "#6B7280" : "#9CA3AF"),
                        fontFamily: "'DM Sans', sans-serif", fontWeight: isHighlighted ? 600 : 400,
                        transition: "fill 0.3s ease",
                      }}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((node) => {
              const tag = tags[node.id];
              const isSelected = selected === node.id;
              const isConnected = selected && connected.nodes.has(node.id);
              const isDimmed = selected && !isSelected && !isConnected;
              const isNeedsWork = tag === "needs_work";

              let fill = cardBg;
              let stroke = darkMode ? "#374151" : "#D1D5DB";
              let strokeW = 1.5;
              let filterAttr = "url(#shadow)";

              if (tag === "clear") { fill = darkMode ? "#1A2E1A" : "#ECFDF5"; stroke = "#34D399"; strokeW = 2; }
              else if (tag === "shaky") { fill = darkMode ? "#2E2A1A" : "#FFFBEB"; stroke = "#FBBF24"; strokeW = 2; }
              else if (isNeedsWork) {
                fill = darkMode ? "#2E1A1A" : "#FFF1F2";
                stroke = `rgba(248, 113, 113, ${0.6 + pulseVal * 0.4})`;
                strokeW = 2.5 + pulseVal;
                filterAttr = "url(#glow-red)";
              }
              if (isSelected) { stroke = "#6366F1"; strokeW = 3; }
              else if (isConnected) { stroke = "#818CF8"; strokeW = 2.5; }

              const lines = node.label.split("\n");
              const w = lines.some((l) => l.length > 10) ? 140 : (lines.length > 1 ? 120 : 100);
              const h = lines.length > 1 ? 48 : 36;

              return (
                <g
                  key={node.id}
                  style={{ cursor: "pointer", transition: "opacity 0.3s ease" }}
                  opacity={isDimmed ? 0.15 : (tag === "clear" && !isSelected && !isConnected ? 0.55 : 1)}
                  onClick={() => handleSelectNode(node.id)}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <rect
                    x={node.x - w / 2} y={node.y - h / 2}
                    width={w} height={h} rx={10} ry={10}
                    fill={fill} stroke={stroke} strokeWidth={strokeW}
                    filter={filterAttr}
                    style={{ transition: "fill 0.3s ease, stroke 0.3s ease, stroke-width 0.15s ease" }}
                  />
                  {lines.map((line, li) => (
                    <text
                      key={li}
                      x={node.x}
                      y={node.y + (li - (lines.length - 1) / 2) * 15 + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      style={{
                        fontSize: 11, fontWeight: 600,
                        fill: isSelected ? "#6366F1" : textPrimary,
                        fontFamily: "'DM Sans', sans-serif",
                        pointerEvents: "none", transition: "fill 0.3s ease",
                      }}
                    >{line}</text>
                  ))}
                  {tag && (
                    <circle
                      cx={node.x + w / 2 - 6} cy={node.y - h / 2 + 6}
                      r={5} fill={TAG_COLORS[tag].dot}
                      stroke={fill} strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredNode && !selected && (
            <div style={{
              position: "absolute", left: "50%", bottom: 20, transform: "translateX(-50%)",
              background: darkMode ? "#25252B" : "white", border: `1px solid ${borderColor}`,
              borderRadius: 10, padding: "10px 16px", maxWidth: 340, pointerEvents: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: textPrimary, marginBottom: 4 }}>
                {hoveredNode.label.replace("\n", " ")}
              </div>
              <div style={{ fontSize: 12, color: textSecondary, lineHeight: 1.5 }}>
                {hoveredNode.def.slice(0, 120)}…
              </div>
            </div>
          )}
        </div>

        {selectedNode && (
          <SidePanel
            node={selectedNode}
            nodes={NODES}
            edges={EDGES}
            tags={tags}
            onTag={handleTag}
            notes={notes}
            onNote={handleNote}
            onClose={() => setSelected(null)}
            onNavigate={handleSelectNode}
            subgraphNodes={subgraphNodes}
            synthesis={knowledge[selected]?.synthesis}
            knowledgeLoading={knowledgeLoading && !knowledge[selected]}
          />
        )}
      </div>
    </div>
  );
}
