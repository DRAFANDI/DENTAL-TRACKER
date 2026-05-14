import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const STAGES = ["استلام المقاس", "عند المعمل", "قيد التصنيع", "جاهز للتسليم", "تم التسليم"];
const STATUSES = ["تمام ✅", "ملاحظة ⚠️", "مشكلة ❌"];

function App() {
  const [cases, setCases] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const loadCases = async () => {
    const { data, error } = await supabase.from("cases").select("*").order("id", { ascending: false });
    if (error) console.error(error);
    else setCases(data || []);
  };

  useEffect(() => {
    loadCases();
  }, []);

  const addCase = async (c) => {
    const { data, error } = await supabase.from("cases").insert([c]).select().single();
    if (error) {
      console.error(error);
      alert("فشل حفظ الحالة");
      return;
    }
    setCases((old) => [data, ...old]);
  };

  const updateCase = async (id, patch) => {
    const { error } = await supabase.from("cases").update(patch).eq("id", id);
    if (error) {
      console.error(error);
      alert("فشل التعديل");
      return;
    }
    setCases((old) => old.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const deleteCase = async (id) => {
    if (!confirm("هل تريد حذف هذه الحالة؟")) return;
    const { error } = await supabase.from("cases").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("فشل الحذف");
      return;
    }
    setCases((old) => old.filter((c) => c.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8fc", direction: "rtl", fontFamily: "Segoe UI, Tahoma" }}>
      <header style={{ background: "#1a1a2e", color: "#fff", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>🦷 متابعة المعمل</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{cases.length} حالة</div>
          </div>
          <button onClick={() => setShowAdd(true)} style={primaryBtn}>+ حالة جديدة</button>
        </div>
      </header>

      <main style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {cases.length === 0 ? (
          <div style={{ textAlign: "center", color: "#999", marginTop: 40 }}>لا توجد حالات</div>
        ) : (
          cases.map((c) => (
            <CaseCard key={c.id} c={c} onUpdate={updateCase} onDelete={deleteCase} />
          ))
        )}
      </main>

      {showAdd && <AddCaseModal onAdd={addCase} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function CaseCard({ c, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(c.notes || "");
  const [technote, setTechnote] = useState(c.technote || "");

  const saveNotes = () => {
    onUpdate(c.id, { notes, technote });
  };

  return (
    <div style={card}>
      <div onClick={() => setOpen(!open)} style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{c.patient}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {c.file} · {c.type} · {c.teeth} أسنان · {c.shade}
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={statusBadge(c.status)}>{c.status}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>{c.eta}</div>
          </div>
        </div>

        <StageBar stage={c.stage || 0} />

        {c.technote && <div style={noteBox}>💬 ملاحظة الفني: {c.technote}</div>}
        {c.notes && <div style={noteBox}>📝 ملاحظات: {c.notes}</div>}
      </div>

      {open && (
        <div style={{ marginTop: 14, borderTop: "1px solid #eee", paddingTop: 14 }}>
          <div style={sectionTitle}>تغيير المرحلة</div>
          <div style={grid2}>
            {STAGES.map((s, i) => (
              <button key={s} onClick={() => onUpdate(c.id, { stage: i })} style={c.stage === i ? activeBtn : lightBtn}>
                {s}
              </button>
            ))}
          </div>

          <div style={sectionTitle}>الحالة</div>
          <div style={grid3}>
            {STATUSES.map((s) => (
              <button key={s} onClick={() => onUpdate(c.id, { status: s })} style={c.status === s ? activeBtn : lightBtn}>
                {s}
              </button>
            ))}
          </div>

          <textarea value={technote} onChange={(e) => setTechnote(e.target.value)} placeholder="ملاحظة الفني" style={textarea} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات داخلية" style={textarea} />

          <button onClick={saveNotes} style={primaryWide}>حفظ الملاحظات</button>
          <button onClick={() => onDelete(c.id)} style={dangerWide}>حذف الحالة</button>
        </div>
      )}
    </div>
  );
}

function StageBar({ stage }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
      {STAGES.map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STAGES.length - 1 ? 1 : "none" }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: i <= stage ? "#1a1a2e" : "#e5e7eb",
            color: i <= stage ? "#fff" : "#9ca3af",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 800
          }}>
            {i < stage ? "✓" : i + 1}
          </div>
          {i < STAGES.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < stage ? "#1a1a2e" : "#e5e7eb" }} />
          )}
        </div>
      ))}
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

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.patient || !form.file) return alert("اكتب اسم المريض ورقم الملف");

    onAdd({
      id: Date.now(),
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
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>إضافة حالة جديدة</h3>

        <input style={input} placeholder="اسم المريض" value={form.patient} onChange={(e) => set("patient", e.target.value)} />
        <input style={input} placeholder="رقم الملف" value={form.file} onChange={(e) => set("file", e.target.value)} />
        <input style={input} placeholder="عدد الأسنان" type="number" value={form.teeth} onChange={(e) => set("teeth", e.target.value)} />
        <input style={input} placeholder="نوع التركيبة" value={form.type} onChange={(e) => set("type", e.target.value)} />
        <input style={input} placeholder="اللون" value={form.shade} onChange={(e) => set("shade", e.target.value)} />
        <input style={input} type="date" value={form.eta} onChange={(e) => set("eta", e.target.value)} />

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={submit} style={primaryWide}>إضافة</button>
          <button onClick={onClose} style={lightWide}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

const card = {
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #f0f0f8",
  padding: "18px 20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const primaryBtn = {
  background: "#6366f1",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "9px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const primaryWide = {
  width: "100%",
  background: "#6366f1",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: 11,
  marginTop: 8,
  fontWeight: 800,
  cursor: "pointer",
};

const dangerWide = {
  width: "100%",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: 11,
  marginTop: 8,
  fontWeight: 800,
  cursor: "pointer",
};

const lightWide = {
  width: "100%",
  background: "#fff",
  color: "#374151",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 11,
  marginTop: 8,
  fontWeight: 700,
  cursor: "pointer",
};

const lightBtn = {
  padding: 9,
  borderRadius: 10,
  border: "none",
  background: "#f3f4f6",
  color: "#374151",
  fontWeight: 700,
  cursor: "pointer",
};

const activeBtn = {
  padding: 9,
  borderRadius: 10,
  border: "none",
  background: "#1a1a2e",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 };

const sectionTitle = { fontSize: 12, fontWeight: 800, margin: "12px 0 8px" };

const textarea = {
  width: "100%",
  minHeight: 65,
  marginTop: 8,
  padding: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  resize: "vertical",
  direction: "rtl",
  boxSizing: "border-box",
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 13,
  background: "#fafafa",
  direction: "rtl",
  boxSizing: "border-box",
  marginBottom: 8,
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

const modal = {
  background: "#fff",
  borderRadius: 20,
  padding: 24,
  width: 340,
  direction: "rtl",
};

const noteBox = {
  marginTop: 8,
  padding: "8px 12px",
  borderRadius: 10,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  fontSize: 12,
  color: "#374151",
};

function statusBadge(status) {
  const map = {
    "تمام ✅": { bg: "#d1fae5", color: "#065f46" },
    "ملاحظة ⚠️": { bg: "#fef3c7", color: "#92400e" },
    "مشكلة ❌": { bg: "#fee2e2", color: "#991b1b" },
  };

  const s = map[status] || map["تمام ✅"];

  return {
    fontSize: 11,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 20,
    background: s.bg,
    color: s.color,
  };
}

export default App;