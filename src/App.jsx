import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const STAGES = [
  "استلام المقاس",
  "عند المعمل",
  "قيد التصنيع",
  "جاهز للتسليم",
  "تم التسليم",
];

const STATUS_COLORS = {
  "تمام ✅": { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  "ملاحظة ⚠️": { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  "مشكلة ❌": { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
};

function StageBar({ stage }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
      {STAGES.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            flex: i < STAGES.length - 1 ? 1 : "none",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: i <= stage ? "#1a1a2e" : "#e5e7eb",
              color: i <= stage ? "#fff" : "#9ca3af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {i < stage ? "✓" : i + 1}
          </div>

          {i < STAGES.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: i < stage ? "#1a1a2e" : "#e5e7eb",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function CaseCard({ c, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(c.notes || "");
  const [technote, setTechnote] = useState(c.technote || "");

  const sc = STATUS_COLORS[c.status] || STATUS_COLORS["تمام ✅"];

  const saveNotes = () => {
    onUpdate(c.id, { notes, technote });
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #f0f0f8",
        padding: "18px 20px",
        direction: "rtl",
        boxShadow: expanded
          ? "0 8px 28px rgba(0,0,0,0.08)"
          : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{ cursor: "pointer" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#1a1a2e",
                }}
              >
                {c.patient}
              </span>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: sc.bg,
                  color: sc.text,
                }}
              >
                {c.status}
              </span>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
                marginTop: 3,
              }}
            >
              {c.file} · {c.type} · {c.teeth} أسنان · {c.shade}
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#9ca3af" }}>{c.eta}</div>
        </div>

        <StageBar stage={c.stage} />

        {c.technote && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              borderRadius: 10,
              background: "#fef9ec",
              border: "1px solid #fde68a",
              fontSize: 12,
              color: "#92400e",
            }}
          >
            💬 ملاحظة الفني: {c.technote}
          </div>
        )}

        {c.notes && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              borderRadius: 10,
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              fontSize: 12,
              color: "#374151",
            }}
          >
            📝 ملاحظة: {c.notes}
          </div>
        )}
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            تغيير المرحلة
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {STAGES.map((s, i) => (
              <button
                key={i}
                onClick={() => onUpdate(c.id, { stage: i })}
                style={{
                  padding: "9px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  background: c.stage === i ? "#1a1a2e" : "#f3f4f6",
                  color: c.stage === i ? "#fff" : "#374151",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, margin: "14px 0 8px" }}>
            الحالة
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {Object.keys(STATUS_COLORS).map((status) => (
              <button
                key={status}
                onClick={() => onUpdate(c.id, { status })}
                style={{
                  padding: "9px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  background:
                    c.status === status ? STATUS_COLORS[status].text : STATUS_COLORS[status].bg,
                  color: c.status === status ? "#fff" : STATUS_COLORS[status].text,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <textarea
              value={technote}
              onChange={(e) => setTechnote(e.target.value)}
              placeholder="ملاحظة الفني"
              style={{
                width: "100%",
                minHeight: 60,
                padding: 10,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                resize: "vertical",
                direction: "rtl",
                boxSizing: "border-box",
              }}
            />

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات داخلية"
              style={{
                width: "100%",
                minHeight: 70,
                padding: 10,
                marginTop: 8,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                resize: "vertical",
                direction: "rtl",
                boxSizing: "border-box",
              }}
            />

            <button
              onClick={saveNotes}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "10px",
                borderRadius: 10,
                border: "none",
                background: "#6366f1",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              حفظ الملاحظات
            </button>

            <button
              onClick={() => onDelete(c.id)}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "10px",
                borderRadius: