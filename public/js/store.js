(function () {
  const KEY = "mba-data-v1";

  const empty = () => ({
    teacherName: "Математикийн багш",
    classes: [],
    students: [],
    materials: [],
    assignments: [],
    submissions: [],
    attempts: [],
    currentStudentId: null,
  });

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw || typeof raw !== "object") return empty();
      return { ...empty(), ...raw };
    } catch {
      return empty();
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    if (window.Cloud && typeof window.Cloud.push === "function") window.Cloud.push(data);
  }

  function update(fn) {
    const data = load();
    const result = fn(data);
    save(data);
    return result;
  }

  const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    const s = parts.slice(0, 2).map((p) => p[0].toLocaleUpperCase("mn")).join("");
    return s || "?";
  }

  function mnDate(d = new Date()) {
    return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()}`;
  }

  function shortDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function dueLabel(due) {
    if (!due) return { label: "Хугацаагүй", urgent: false, overdue: false };
    const d = new Date(`${due}T00:00:00`);
    if (Number.isNaN(d.getTime())) return { label: due, urgent: false, overdue: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (days < 0) return { label: `${Math.abs(days)} хоног хоцорсон`, urgent: true, overdue: true };
    if (days === 0) return { label: "Өнөөдөр", urgent: true, overdue: false };
    if (days === 1) return { label: "Маргааш", urgent: true, overdue: false };
    return { label: `${days} хоног үлдсэн`, urgent: days <= 3, overdue: false };
  }

  function scoreClass(p) {
    if (p == null) return "pill-muted";
    if (p >= 85) return "pill-green";
    if (p >= 70) return "pill-yellow";
    return "pill-red";
  }

  function avg(list) {
    const vals = list.filter((v) => typeof v === "number" && Number.isFinite(v));
    if (!vals.length) return null;
    return Math.round(vals.reduce((t, v) => t + v, 0) / vals.length);
  }

  function studentScores(data, studentId) {
    return [
      ...data.submissions.filter((s) => s.studentId === studentId).map((s) => s.percent),
      ...data.attempts.filter((a) => a.studentId === studentId && a.kind !== "battle").map((a) => a.percent),
    ];
  }

  function lastActivity(data, studentId) {
    const times = [
      ...data.submissions.filter((s) => s.studentId === studentId).map((s) => s.at),
      ...data.attempts.filter((a) => a.studentId === studentId).map((a) => a.at),
    ].map((t) => new Date(t).getTime()).filter(Number.isFinite);
    return times.length ? Math.max(...times) : null;
  }

  function toast(message, kind = "ok") {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      host.setAttribute("aria-live", "polite");
      document.body.append(host);
    }
    const el = document.createElement("div");
    el.className = `toast toast-${kind}`;
    el.textContent = message;
    host.append(el);
    setTimeout(() => el.remove(), 3200);
  }

  function formatTimer(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function onExternalChange(fn) {
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) fn();
    });
  }

  window.Store = {
    load,
    save,
    update,
    uid,
    escapeHtml,
    initials,
    mnDate,
    shortDate,
    dueLabel,
    scoreClass,
    avg,
    studentScores,
    lastActivity,
    toast,
    formatTimer,
    onExternalChange,
  };
})();
