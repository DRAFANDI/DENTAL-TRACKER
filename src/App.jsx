import { useState } from "react";

const STAGES = ["استلام المقاس", "عند المعمل", "قيد التصنيع", "جاهز للتسليم", "تم التسليم"];

const STATUS_COLORS = {
  "تمام ✅": { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  "ملاحظة ⚠️": { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  "مشكلة ❌": { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
};

const initialCases = [];

function StageBar({ stage }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 8 }}>
      {STAGES.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STAGES.length - 1 ? 1 : "none" }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: i <= stage ? "#1a1a2e" : "#e5e7eb",
            border: i === stage ? "2px solid #6366f1" : "2px solid transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: i <= stage ? "#fff" : "#9ca3af",
            fontWeight: 700, flexShrink: 0,
            boxShadow: i === stage ? "0 0 0 3px #e0e7ff" : "none",
            transition: "all 0.3s"
          }}>
            {i < stage ? "✓" : i + 1}
          </div>
          {i < STAGES.length - 1 && (
            <div style={{
              flex: 1, height: 2,
              background: i < stage ? "#1a1a2e" : "#e5e7eb",
              transition: "background 0.3s"
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

function CaseCard({ c, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_COLORS[c.status] || STATUS_COLORS["تمام ✅"];
  const daysLeft = Math.ceil((new Date(c.eta) - new Date()) / 86400000);
  const isLate = daysLeft < 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 2;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #f0f0f8",
      boxShadow: expanded ? "0 8px 32px rgba(99,102,241,0.10)" : "0 2px 8px rgba(0,0,0,0.04)",
      padding: "18px 20px",
      transition: "all 0.25s",
      cursor: "pointer",
      direction: "rtl"
    }} onClick={() => setExpanded(e => !e)}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", fontFamily: "Georgia, serif" }}>
              {c.patient}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
              background: sc.bg, color: sc.text,
              display: "flex", alignItems: "center", gap: 4
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
              {c.status}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
            {c.file} · {c.type} · {c.teeth} أسنان · {c.shade}
          </div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{
            fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: isLate ? "#fee2e2" : isUrgent ? "#fef3c7" : "#f0fdf4",
            color: isLate ? "#991b1b" : isUrgent ? "#92400e" : "#166534"
          }}>
            {isLate ? `متأخر ${Math.abs(daysLeft)} يوم` : isUrgent ? `${daysLeft} أيام` : `${daysLeft} يوم`}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, textAlign: "center" }}>
            {c.eta}
          </div>
        </div>
      </div>

      {/* Stage Bar */}
      <StageBar stage={c.stage} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {STAGES.map((s, i) => (
          <span key={i} style={{
            fontSize: 9, color: i === c.stage ? "#6366f1" : "#d1d5db",
            fontWeight: i === c.stage ? 700 : 400,
            flex: 1, textAlign: i === 0 ? "right" : i === STAGES.length - 1 ? "left" : "center"
          }}>{s}</span>
        ))}
      </div>

      {/* Tech Note */}
      {c.techNote && (
        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 10,
          background: "#fef9ec", border: "1px solid #fde68a",
          fontSize: 12, color: "#92400e"
        }}>
          💬 ملاحظة الفني: {c.techNote}
        </div>
      )}

      {/* Expanded Actions */}
      {expanded && (
        <div style={{ marginTop: 14, borderTop: "1px solid #f3f4f6", paddingTop: 14 }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {STAGES.map((s, i) => (
              <button key={i} onClick={() => onUpdate(c.id, { stage: i })}
                style={{
                  padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  background: c.stage === i ? "#1a1a2e" : "#f9fafb",
                  color: c.stage === i ? "#fff" : "#374151",
                  fontSize: 12, fontWeight: 600, transition: "all 0.2s"
                }}>
                {s}
              </button>
            ))}
            <button onClick={() => onUpdate(c.id, { status: "تمام ✅" })}
              style={{
                padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
                background: "#d1fae5", color: "#065f46", fontSize: 12, fontWeight: 600
              }}>تمام ✅</button>
            <button onClick={() => onUpdate(c.id, { status: "ملاحظة ⚠️" })}
              style={{
                padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
                background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 600
              }}>ملاحظة ⚠️</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddCaseModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    patient: "", file: "", teeth: "", type: "", shade: "", eta: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.patient || !form.file) return;
    onAdd({
      id: Date.now().toString(),
      ...form,
      teeth: Number(form.teeth) || 1,
      sentDate: new Date().toISOString().split("T")[0],
      stage: 0,
      techNote: "",
      status: "تمام ✅",
      notes: "",
    });
    onClose();
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb",
    fontSize: 13, fontFamily: "inherit", background: "#fafafa", direction: "rtl",
    outline: "none", boxSizing: "border-box"
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 28, width: 340,
        direction: "rtl", boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>
          إضافة حالة جديدة
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inputStyle} placeholder="اسم المريض *" value={form.patient} onChange={e => set("patient", e.target.value)} />
          <input style={inputStyle} placeholder="رقم الملف *" value={form.file} onChange={e => set("file", e.target.value)} />
          <input style={inputStyle} placeholder="عدد الأسنان" type="number" value={form.teeth} onChange={e => set("teeth", e.target.value)} />
          <input style={inputStyle} placeholder="نوع التركيبة" value={form.type} onChange={e => set("type", e.target.value)} />
          <input style={inputStyle} placeholder="اللون / Shade" value={form.shade} onChange={e => set("shade", e.target.value)} />
          <input style={inputStyle} type="date" value={form.eta} onChange={e => set("eta", e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button onClick={handleAdd} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            background: "#1a1a2e", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer"
          }}>إضافة</button>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #e5e7eb",
            background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [cases, setCases] = useState(initialCases);
  const [filter, setFilter] = useState("الكل");
  const [showAdd, setShowAdd] = useState(false);

  const updateCase = (id, patch) => {
    setCases(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const addCase = (c) => setCases(cs => [c, ...cs]);

  const filters = ["الكل", "ملاحظة ⚠️", "جاهز للتسليم", "متأخر"];

  const filtered = cases.filter(c => {
    if (filter === "الكل") return true;
    if (filter === "ملاحظة ⚠️") return c.status === "ملاحظة ⚠️";
    if (filter === "جاهز للتسليم") return c.stage === 3;
    if (filter === "متأخر") return Math.ceil((new Date(c.eta) - new Date()) / 86400000) < 0;
    return true;
  });

  const stats = {
    total: cases.length,
    notes: cases.filter(c => c.status === "ملاحظة ⚠️").length,
    ready: cases.filter(c => c.stage === 3).length,
    late: cases.filter(c => Math.ceil((new Date(c.eta) - new Date()) / 86400000) < 0).length,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f8fc",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      direction: "rtl"
    }}>
      {/* Header */}
      <div style={{
        background: "#1a1a2e", padding: "20px 20px 16px",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
              🦷 متابعة المعمل
            </div>
            <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>
              {cases.length} حالة نشطة
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{
            background: "#6366f1", color: "#fff", border: "none",
            borderRadius: 12, padding: "8px 16px", fontSize: 13,
            fontWeight: 700, cursor: "pointer"
          }}>+ حالة جديدة</button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
          {[
            { label: "إجمالي", value: stats.total, color: "#818cf8" },
            { label: "ملاحظات", value: stats.notes, color: "#fbbf24" },
            { label: "جاهز", value: stats.ready, color: "#34d399" },
            { label: "متأخر", value: stats.late, color: "#f87171" },
          ].map(s => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.07)", borderRadius: 10,
              padding: "8px 6px", textAlign: "center"
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "14px 16px 0", display: "flex", gap: 8, overflowX: "auto" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            background: filter === f ? "#1a1a2e" : "#fff",
            color: filter === f ? "#fff" : "#6b7280",
            fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
          }}>{f}</button>
        ))}
      </div>

      {/* Cases */}
      <div style={{ padding: "12px 16px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: 14 }}>
            لا توجد حالات
          </div>
        ) : filtered.map(c => (
          <CaseCard key={c.id} c={c} onUpdate={updateCase} />
        ))}
      </div>

      {showAdd && <AddCaseModal onAdd={addCase} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
