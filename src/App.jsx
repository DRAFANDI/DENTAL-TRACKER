import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const STAGES = ["استلام المقاس", "عند المعمل", "قيد التصنيع", "جاهز للتسليم", "تم التسليم"];
const CONTACTS = ["لم يتم التواصل", "تم التواصل", "تم حجز موعد التسليم", "لم يرد"];

function daysLeft(eta) {
  if (!eta) return null;

  const today = new Date();
  const target = new Date(eta + "T00:00:00");

  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  return Math.round((targetDate - todayDate) / 86400000);
}

function hasAnyNote(c) {
  return !!(
    String(c.notes || "").trim() ||
    String(c.technote || "").trim() ||
    String(c.doctornote || "").trim()
  );
}

function getAutoStatus(c) {
  return hasAnyNote(c) ? "ملاحظة ⚠️" : "تمام ✅";
}

function needsContact(c) {
  return !c.contact || c.contact === "لم يتم التواصل" || c.contact === "لم يرد";
}

function App() {
  const [cases, setCases] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("الكل");
  const [search, setSearch] = useState("");

  const loadCases = async () => {
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .order("id", { ascending: false });

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
    const ok = confirm("⚠️ هل أنت متأكد من حذف هذه الحالة؟ لا يمكن التراجع عن الحذف.");
    if (!ok) return;

    const { error } = await supabase.from("cases").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("فشل حذف الحالة");
      return;
    }

    setCases((old) => old.filter((c) => c.id !== id));
  };

  const stats = {
    lab: cases.filter((c) => [0, 1, 2].includes(c.stage)).length,
    ready: cases.filter((c) => c.stage === 3).length,
    delivered: cases.filter((c) => c.stage === 4).length,
    notes: cases.filter(hasAnyNote).length,
    noContact: cases.filter(needsContact).length,
    late: cases.filter((c) => {
      const d = daysLeft(c.eta);
      return d !== null && d < 0 && c.stage !== 4;
    }).length,
    today: cases.filter((c) => {
      const d = daysLeft(c.eta);
      return d === 0 && c.stage !== 4;
    }).length,
    soon: cases.filter((c) => {
      const d = daysLeft(c.eta);
      return d !== null && d >= 0 && d <= 2 && c.stage !== 4;
    }).length,
    readyNoContact: cases.filter((c) => c.stage === 3 && needsContact(c)).length,
  };

  const filteredCases = cases.filter((c) => {
    const q = search.trim().toLowerCase();

    const matchSearch =
      !q ||
      String(c.patient || "").toLowerCase().includes(q) ||
      String(c.file || "").toLowerCase().includes(q) ||
      String(c.phone || "").toLowerCase().includes(q);

    if (!matchSearch) return false;

    const d = daysLeft(c.eta);

    if (filter === "داخل المعمل") return [0, 1, 2].includes(c.stage);
    if (filter === "جاهز للتسليم") return c.stage === 3;
    if (filter === "تم التسليم") return c.stage === 4;
    if (filter === "متأخر") return d !== null && d < 0 && c.stage !== 4;
    if (filter === "تسليم اليوم") return d === 0 && c.stage !== 4;
    if (filter === "تسليم قريب") return d !== null && d >= 0 && d <= 2 && c.stage !== 4;
    if (filter === "ملاحظات") return hasAnyNote(c);
    if (filter === "لم يتم التواصل") return needsContact(c);
    if (filter === "جاهز ولم يتم التواصل") return c.stage === 3 && needsContact(c);

    return true;
  });

  return (
    <div style={page}>
      <header style={header}>
        <div style={headerTop}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🦷 متابعة المعمل</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{cases.length} حالة نشطة</div>
          </div>

          <button onClick={() => setShowAdd(true)} style={primaryBtn}>
            + حالة جديدة
          </button>
        </div>

        <div style={statsGrid}>
          <Stat label="داخل المعمل" value={stats.lab} />
          <Stat label="جاهز" value={stats.ready} />
          <Stat label="متأخر" value={stats.late} danger />
          <Stat label="ملاحظات" value={stats.notes} />
          <Stat label="لم يتم التواصل" value={stats.noContact} />
          <Stat label="تم التسليم" value={stats.delivered} />
        </div>
      </header>

      <div style={{ padding: 16 }}>
        <NotificationCenter stats={stats} setFilter={setFilter} />

        <input
          style={searchInput}
          placeholder="بحث باسم المريض أو رقم الملف أو الجوال..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={filtersRow}>
          {["الكل", "داخل المعمل", "جاهز للتسليم", "تسليم اليوم", "تسليم قريب", "متأخر", "تم التسليم", "ملاحظات", "لم يتم التواصل", "جاهز ولم يتم التواصل"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={filter === f ? activeFilter : filterBtn}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <main style={main}>
        {filteredCases.length === 0 ? (
          <div style={{ textAlign: "center", color: "#999", marginTop: 40 }}>لا توجد حالات</div>
        ) : (
          filteredCases.map((c) => (
            <CaseCard key={c.id} c={c} onUpdate={updateCase} onDelete={deleteCase} />
          ))
        )}
      </main>

      {showAdd && <AddCaseModal onAdd={addCase} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function NotificationCenter({ stats, setFilter }) {
  const alerts = [
    { label: "حالات متأخرة", value: stats.late, filter: "متأخر", danger: true },
    { label: "تسليم اليوم", value: stats.today, filter: "تسليم اليوم" },
    { label: "تسليم خلال يومين", value: stats.soon, filter: "تسليم قريب" },
    { label: "فيها ملاحظات", value: stats.notes, filter: "ملاحظات" },
    { label: "جاهزة ولم يتم التواصل", value: stats.readyNoContact, filter: "جاهز ولم يتم التواصل", danger: true },
  ].filter((a) => a.value > 0);

  if (alerts.length === 0) {
    return <div style={alertBox}>✅ لا توجد تنبيهات مهمة حالياً</div>;
  }

  return (
    <div style={alertBox}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>🔔 تنبيهات اليوم</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {alerts.map((a) => (
          <button
            key={a.label}
            onClick={() => setFilter(a.filter)}
            style={a.danger ? alertBtnDanger : alertBtn}
          >
            {a.value} {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, danger }) {
  return (
    <div style={statBox}>
      <div style={{ fontSize: 22, fontWeight: 900, color: danger ? "#f87171" : "#a5b4fc" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#cbd5e1" }}>{label}</div>
    </div>
  );
}

function CaseCard({ c, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(c.notes || "");
  const [technote, setTechnote] = useState(c.technote || "");
  const [doctornote, setDoctornote] = useState(c.doctornote || "");

  const d = daysLeft(c.eta);

  const timeText =
    d === null
      ? "بدون تاريخ تسليم"
      : d < 0
      ? `متأخر ${Math.abs(d)} يوم`
      : d === 0
      ? "تسليم اليوم"
      : d === 1
      ? "متبقي يوم"
      : `متبقي ${d} يوم`;

  const missing = !c.eta || !c.shade || !c.teeth || !c.phone;
  const autoStatus = getAutoStatus(c);

  const cleanPhone = String(c.phone || "").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `مرحباً ${c.patient || ""}، نود إبلاغك بخصوص تركيبتك / حالتك الخاصة برقم الملف ${c.file || ""}.`
  );
  const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${whatsappMessage}` : null;

  const priority = getPriority(c);

  const saveNotes = () => {
    const nextCase = { ...c, notes, technote, doctornote };
    const nextStatus = getAutoStatus(nextCase);

    onUpdate(c.id, {
      notes,
      technote,
      doctornote,
      status: nextStatus,
    });
  };

  return (
    <div style={card}>
      <div style={{ ...priorityBar, background: priority.color }} />

      <div onClick={() => setOpen(!open)} style={{ cursor: "pointer" }}>
        {priority.text && <div style={{ ...priorityLabel, color: priority.color }}>{priority.text}</div>}

        <div style={cardTop}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{c.patient}</div>

            <div style={smallText}>
              ملف {c.file} · {c.type || "بدون نوع"} · {c.teeth} أسنان · {c.shade || "بدون لون"}
            </div>

            <div style={smallText}>
              📞 {c.phone || "لا يوجد جوال"} · التواصل: {c.contact || "لم يتم التواصل"}
            </div>
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={statusBadge(autoStatus)}>{autoStatus}</div>

            <div style={{ fontSize: 11, color: d < 0 ? "#dc2626" : "#6b7280", marginTop: 5, fontWeight: 900 }}>
              {timeText}
            </div>

            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              التسليم: {c.eta || "-"}
            </div>
          </div>
        </div>

        <StageBar stage={c.stage || 0} />

        <div style={miniBadgesRow}>
          <span style={miniBadge}>التواصل: {c.contact || "لم يتم التواصل"}</span>
          {hasAnyNote(c) && <span style={miniBadgeWarn}>يوجد ملاحظات</span>}
          {missing && <span style={miniBadgeWarn}>بيانات ناقصة</span>}
        </div>

        {c.technote && <div style={noteBox}>💬 فني: {c.technote}</div>}
        {c.doctornote && <div style={noteBox}>🦷 طبيب: {c.doctornote}</div>}
        {c.notes && <div style={noteBox}>📝 منسقة/داخلي: {c.notes}</div>}
      </div>

      {open && (
        <div style={expanded}>
          <div style={sectionTitle}>تغيير المرحلة</div>

          <div style={grid2}>
            {STAGES.map((s, i) => (
              <button
                key={s}
                onClick={() => onUpdate(c.id, { stage: i })}
                style={c.stage === i ? activeBtn : lightBtn}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={sectionTitle}>حالة التواصل</div>

          <div style={grid2}>
            {CONTACTS.map((s) => (
              <button
                key={s}
                onClick={() => onUpdate(c.id, { contact: s })}
                style={c.contact === s ? activeBtn : lightBtn}
              >
                {s}
              </button>
            ))}
          </div>

          {whatsappLink && (
            <>
              <a href={whatsappLink} target="_blank" rel="noreferrer" style={whatsappBtn}>
                فتح واتساب برسالة جاهزة
              </a>

              <button
                onClick={() => onUpdate(c.id, { contact: "تم التواصل" })}
                style={successWide}
              >
                تم التواصل
              </button>
            </>
          )}

          <textarea value={technote} onChange={(e) => setTechnote(e.target.value)} placeholder="ملاحظة الفني" style={textarea} />
          <textarea value={doctornote} onChange={(e) => setDoctornote(e.target.value)} placeholder="ملاحظة الطبيب" style={textarea} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات المنسقة / داخلية" style={textarea} />

          <button onClick={saveNotes} style={primaryWide}>
            حفظ الملاحظات
          </button>

          <button onClick={() => onDelete(c.id)} style={dangerWide}>
            حذف الحالة
          </button>
        </div>
      )}
    </div>
  );
}

function getPriority(c) {
  const d = daysLeft(c.eta);

  if (c.stage !== 4 && d !== null && d < 0) {
    return { text: "متأخر", color: "#dc2626" };
  }

  if (c.stage !== 4 && d === 0) {
    return { text: "تسليم اليوم", color: "#f59e0b" };
  }

  if (c.stage === 3 && needsContact(c)) {
    return { text: "جاهز ولم يتم التواصل", color: "#ea580c" };
  }

  return { text: "", color: "transparent" };
}

function StageBar({ stage }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
      {STAGES.map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STAGES.length - 1 ? 1 : "none" }}>
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
              fontWeight: 900,
            }}
          >
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
    phone: "",
    file: "",
    teeth: "",
    type: "",
    shade: "",
    eta: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.patient || !form.file) {
      alert("اكتب اسم المريض ورقم الملف");
      return;
    }

    onAdd({
      id: Date.now(),
      patient: form.patient,
      phone: form.phone,
      file: form.file,
      teeth: Number(form.teeth) || 1,
      type: form.type,
      shade: form.shade,
      eta: form.eta,
      sentdate: new Date().toISOString().split("T")[0],
      stage: 0,
      technote: "",
      doctornote: "",
      status: "تمام ✅",
      contact: "لم يتم التواصل",
      notes: "",
    });

    onClose();
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>إضافة حالة جديدة</h3>

        <input style={input} placeholder="اسم المريض" value={form.patient} onChange={(e) => set("patient", e.target.value)} />
        <input style={input} placeholder="رقم الجوال مثل 9665xxxxxxxx" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
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

const page = { minHeight: "100vh", background: "#f8f8fc", direction: "rtl", fontFamily: "Segoe UI, Tahoma" };
const header = { background: "#1a1a2e", color: "#fff", padding: 20 };
const headerTop = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginTop: 14 };
const statBox = { background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: 10, textAlign: "center" };
const main = { padding: "0 16px 32px", display: "flex", flexDirection: "column", gap: 12 };
const card = { background: "#fff", borderRadius: 16, border: "1px solid #f0f0f8", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", position: "relative", overflow: "hidden" };
const priorityBar = { position: "absolute", top: 0, right: 0, left: 0, height: 5 };
const priorityLabel = { fontSize: 12, fontWeight: 900, marginBottom: 8 };
const cardTop = { display: "flex", justifyContent: "space-between", gap: 10 };
const smallText = { fontSize: 12, color: "#6b7280", marginTop: 4 };
const primaryBtn = { background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, padding: "9px 16px", fontWeight: 800, cursor: "pointer" };
const searchInput = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", boxSizing: "border-box", direction: "rtl" };
const filtersRow = { display: "flex", gap: 8, overflowX: "auto", marginTop: 10, paddingBottom: 4 };
const filterBtn = { padding: "7px 14px", borderRadius: 20, border: "none", background: "#fff", color: "#374151", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer" };
const activeFilter = { ...filterBtn, background: "#1a1a2e", color: "#fff" };
const expanded = { marginTop: 14, borderTop: "1px solid #eee", paddingTop: 14 };
const primaryWide = { width: "100%", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: 11, marginTop: 8, fontWeight: 900, cursor: "pointer" };
const successWide = { width: "100%", background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, padding: 11, marginTop: 8, fontWeight: 900, cursor: "pointer" };
const dangerWide = { width: "100%", background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, padding: 11, marginTop: 8, fontWeight: 900, cursor: "pointer" };
const lightWide = { width: "100%", background: "#fff", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 10, padding: 11, marginTop: 8, fontWeight: 800, cursor: "pointer" };
const lightBtn = { padding: 9, borderRadius: 10, border: "none", background: "#f3f4f6", color: "#374151", fontWeight: 800, cursor: "pointer" };
const activeBtn = { padding: 9, borderRadius: 10, border: "none", background: "#1a1a2e", color: "#fff", fontWeight: 900, cursor: "pointer" };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
const sectionTitle = { fontSize: 12, fontWeight: 900, margin: "12px 0 8px" };
const textarea = { width: "100%", minHeight: 65, marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", resize: "vertical", direction: "rtl", boxSizing: "border-box" };
const input = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13, background: "#fafafa", direction: "rtl", boxSizing: "border-box", marginBottom: 8 };
const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
const modal = { background: "#fff", borderRadius: 20, padding: 24, width: 340, direction: "rtl" };
const noteBox = { marginTop: 8, padding: "8px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e5e7eb", fontSize: 12, color: "#374151" };
const whatsappBtn = { display: "block", textAlign: "center", textDecoration: "none", background: "#22c55e", color: "#fff", borderRadius: 10, padding: 11, marginTop: 10, fontWeight: 900 };
const miniBadgesRow = { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 };
const miniBadge = { fontSize: 11, background: "#eef2ff", color: "#3730a3", padding: "4px 8px", borderRadius: 20, fontWeight: 800 };
const miniBadgeWarn = { fontSize: 11, background: "#fff7ed", color: "#9a3412", padding: "4px 8px", borderRadius: 20, fontWeight: 800 };
const alertBox = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 14, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };
const alertBtn = { border: "none", background: "#eef2ff", color: "#3730a3", borderRadius: 20, padding: "7px 12px", fontWeight: 900, cursor: "pointer" };
const alertBtnDanger = { ...alertBtn, background: "#fee2e2", color: "#991b1b" };

function statusBadge(status) {
  const map = {
    "تمام ✅": { bg: "#d1fae5", color: "#065f46" },
    "ملاحظة ⚠️": { bg: "#fef3c7", color: "#92400e" },
  };

  const s = map[status] || map["تمام ✅"];

  return {
    fontSize: 11,
    fontWeight: 900,
    padding: "4px 10px",
    borderRadius: 20,
    background: s.bg,
    color: s.color,
  };
}

export default App;