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
  "تم التسليم"
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

function CaseCard({ c }) {
  const sc = STATUS_COLORS[c.status] || STATUS_COLORS["تمام ✅"];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #f0f0f8",
        padding: "18px 20px",
        direction: "rtl",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
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

        <div style={{ fontSize: 11, color: "#9ca3af" }}>
          {c.eta}
        </div>
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
    </div>
  );
}

function AddCaseModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    patient: "",
    file: "",
    teeth: "",
    type: "",
    shade: "",
    eta: "",
  });

  const set = (k, v) =>
    setForm((f) => ({
      ...f,
      [k]: v,
    }));

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    fontSize: 13,
    background: "#fafafa",
    direction: "rtl",
    boxSizing: "border-box",
  };

  const handleAdd = () => {
    if (!form.patient || !form.file) return;

    onAdd({
      patient: form.patient,
      file: form.file,
      teeth: Number(form.teeth) || 1,
      type: form.type,
      shade: form.shade,
      eta: form.eta,
      sentdate: new Date().toISOString().split("T")[0],
      stage: 0,
      technote: "",
      status: "تمام ✅",
      notes: "",
    });

    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 28,
          width: 340,
          direction: "rtl",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 20 }}>
          إضافة حالة جديدة
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            style={inputStyle}
            placeholder="اسم المريض"
            value={form.patient}
            onChange={(e) => set("patient", e.target.value)}
          />

          <input
            style={inputStyle}
            placeholder="رقم الملف"
            value={form.file}
            onChange={(e) => set("file", e.target.value)}
          />

          <input
            style={inputStyle}
            placeholder="عدد الأسنان"
            type="number"
            value={form.teeth}
            onChange={(e) => set("teeth", e.target.value)}
          />

          <input
            style={inputStyle}
            placeholder="نوع التركيبة"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          />

          <input
            style={inputStyle}
            placeholder="اللون"
            value={form.shade}
            onChange={(e) => set("shade", e.target.value)}
          />

          <input
            style={inputStyle}
            type="date"
            value={form.eta}
            onChange={(e) => set("eta", e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            onClick={handleAdd}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 12,
              border: "none",
              background: "#1a1a2e",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            إضافة
          </button>

          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [cases, setCases] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const loadCases = async () => {
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .order("id", { ascending: false });

    console.log("LOAD:", data, error);

    if (!error) {
      setCases(data || []);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const addCase = async (c) => {
    console.log("INSERTING:", c);

    const { data, error } = await supabase
      .from("cases")
      .insert([c])
      .select()
      .single();

    console.log("RESULT:", data, error);

    if (error) {
      alert("ما قدرنا نحفظ الحالة في Supabase");
      return;
    }

    setCases((cs) => [data, ...cs]);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f8fc",
        fontFamily: "Segoe UI",
        direction: "rtl",
      }}
    >
      <div
        style={{
          background: "#1a1a2e",
          padding: "20px",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              🦷 متابعة المعمل
            </div>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {cases.length} حالة
            </div>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            + حالة جديدة
          </button>
        </div>
      </div>

      <div
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {cases.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af" }}>
            لا توجد حالات
          </div>
        ) : (
          cases.map((c) => <CaseCard key={c.id} c={c} />)
        )}
      </div>

      {showAdd && (
        <AddCaseModal
          onAdd={addCase}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}