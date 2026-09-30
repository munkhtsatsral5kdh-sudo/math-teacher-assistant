(function () {
  const S = window.Store;
  const B = window.MathBank;
  const Q = window.Quiz;
  const esc = S.escapeHtml;

  const TITLES = {
    home: "Нүүр",
    lesson: "Хичээл",
    tasks: "Даалгаварууд",
    battle: "Battle Mode",
    assessment: "Оношлогоо",
    stats: "Дүн & Статистик",
  };

  const ASSESS_LEVELS = [
    { key: "мэдлэг", label: "Мэдлэг", bank: 1, points: 6, count: 2 },
    { key: "ойлголт", label: "Ойлголт", bank: 1, points: 6, count: 3 },
    { key: "чадвар", label: "Чадвар", bank: 2, points: 7, count: 6 },
    { key: "хэрэглээ", label: "Хэрэглээ", bank: 3, points: 7, count: 4 },
  ];
  const ASSESS_MINUTES = 40;
  const PLACEMENT_OFFSETS = [0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4];
  const BATTLE_TIMER = { 1: 20, 2: 30, 3: 45 };
  const BOTS = {
    easy: { name: "Робот Бага", acc: 0.5 },
    mid: { name: "Робот Дунд", acc: 0.65 },
    hard: { name: "Робот Их", acc: 0.8 },
  };

  const view = document.getElementById("view");
  let cleanup = null;
  const ui = { topicKey: null, practice: null, task: null, battle: null, assess: null, ix1: {}, ix1Show: {}, lessonPart: "theory", example: null, mp: {}, mpShow: {}, mpLevel: "Мэдлэг, ойлголт", st: {}, stShow: {} };

  function getRank(xp) {
    if (xp >= 8000) return { name: "Mythical Glory", icon: "👑", next: null, nextXP: null, base: 8000 };
    if (xp >= 5000) return { name: "Mythic", icon: "🌟", next: "Mythical Glory", nextXP: 8000, base: 5000 };
    if (xp >= 3500) return { name: "Legend", icon: "🔱", next: "Mythic", nextXP: 5000, base: 3500 };
    if (xp >= 2000) return { name: "Epic", icon: "💎", next: "Legend", nextXP: 3500, base: 2000 };
    if (xp >= 1000) return { name: "Grand Master", icon: "💫", next: "Epic", nextXP: 2000, base: 1000 };
    if (xp >= 500) return { name: "Master", icon: "🏹", next: "Grand Master", nextXP: 1000, base: 500 };
    if (xp >= 200) return { name: "Elite", icon: "🛡️", next: "Master", nextXP: 500, base: 200 };
    return { name: "Warrior", icon: "⚔️", next: "Elite", nextXP: 200, base: 0 };
  }

  function me(data = S.load()) {
    return data.students.find((s) => s.id === data.currentStudentId) || null;
  }

  function ensureStudent() {
    if (me()) return;
    S.update((d) => {
      let st = d.students.find((s) => s.grade >= 6 && s.grade <= 9);
      if (!st) {
        st = { id: S.uid("s"), name: "Сурагч", grade: 7, classId: null, xp: 0, createdAt: new Date().toISOString() };
        d.students.push(st);
      }
      d.currentStudentId = st.id;
    });
  }

  const PAGES = {
    home: "/student/dashboard",
    lesson: "/student/lesson",
    tasks: "/student/assignments",
    battle: "/student/battle",
    assessment: "/student/assessment",
    stats: "/student/stats",
  };

  function currentView() {
    const last = location.pathname.split("/").filter(Boolean).pop() || "";
    const fromPath = {
      dashboard: "home",
      home: "home",
      lesson: "lesson",
      assignments: "tasks",
      tasks: "tasks",
      battle: "battle",
      assessment: "assessment",
      stats: "stats",
    };
    return fromPath[last] || "home";
  }

  function leaveHash() {
    const hash = location.hash.replace("#", "");
    if (!PAGES[hash]) return false;
    if (location.pathname !== PAGES[hash] || location.hash) {
      location.replace(PAGES[hash] + location.search);
      return true;
    }
    return false;
  }

  function applyPageQuery() {
    const q = new URLSearchParams(location.search);
    const topic = q.get("topic");
    if (topic) ui.topicKey = topic;
    const task = q.get("task");
    if (task) ui.task = { id: task, answers: {}, started: Date.now() };
    const tab = q.get("tab");
    if (tab === "theory" || tab === "example" || tab === "task") ui.lessonPart = tab;
  }

  function emptyBox(title, text, link) {
    return `<div class="empty"><strong>${title}</strong>${text}${link ? `<div style="margin-top:12px">${link}</div>` : ""}</div>`;
  }

  function myAssignments(data, st) {
    if (!st.classId) return [];
    return data.assignments.filter((a) => a.classId === st.classId).sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
  }

  function mySubmission(data, st, assignmentId) {
    return data.submissions.find((s) => s.studentId === st.id && s.assignmentId === assignmentId) || null;
  }

  function myMaterials(data, st, topicKey = null) {
    return data.materials
      .filter((m) => Number(m.grade) === Number(st.grade) && (!st.classId || !m.classId || m.classId === st.classId) && (!topicKey || m.topicKey === topicKey))
      .sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
  }

  function addXp(amount) {
    if (!amount) return;
    S.update((d) => {
      const st = me(d);
      if (st) st.xp = (st.xp || 0) + amount;
    });
  }

  function saveAttempt(rec) {
    const st = me();
    S.update((d) => d.attempts.push({ id: S.uid("t"), studentId: st.id, grade: st.grade, at: new Date().toISOString(), ...rec }));
  }

  /* ---------------- Login ---------------- */
  function renderLogin() {
    document.getElementById("shell").hidden = true;
    const box = document.getElementById("login");
    box.hidden = false;
    const data = S.load();
    const known = [...data.students].sort((x, y) => (S.lastActivity(data, y.id) || 0) - (S.lastActivity(data, x.id) || 0)).slice(0, 10);
    const grade0 = 7;
    const classOpts = (g) => `<option value="">Бүлэггүй</option>${data.classes.filter((c) => c.grade === g).map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}`;
    box.innerHTML = `
      <div class="login-card">
        <a class="brand" href="/" style="color:var(--ink);border:0;padding:0 0 16px;justify-content:center">
          <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" width="20" height="20"><path d="M6 25 L16 7 L26 25" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M10.5 18.5 H21.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></span>
          Математик багшийн туслах
        </a>
        <div class="card"><div class="card-head">Сурагч нэвтрэх</div><div class="card-body">
          <form id="login-form" class="form" novalidate>
            <label class="field">Нэр<input name="name" maxlength="40" autocomplete="name" placeholder="Жишээ: Бат-Эрдэнэ Г."></label>
            <div class="form-row">
              <label class="field">Анги<select name="grade" id="l-grade">${Q.gradeOptions(grade0)}</select></label>
              <label class="field">Бүлэг<select name="classId" id="l-class">${classOpts(grade0)}</select></label>
            </div>
            <p class="hint" style="margin:0">Багш ангиа үүсгэсэн бол бүлгээ сонговол багшийн даалгавар танд ирнэ.</p>
            <button class="btn btn-grad" type="submit">Нэвтрэх</button>
            <p class="error" id="login-error" role="alert"></p>
          </form>
          ${known.length ? `<div style="margin-top:18px"><div class="hint" style="font-weight:800;margin-bottom:8px">Өмнө нэвтэрсэн</div><div class="list">${known.map((s) => {
            const cls = data.classes.find((c) => c.id === s.classId);
            return `<button type="button" class="item" data-login="${s.id}"><span class="avatar sm purple">${esc(S.initials(s.name))}</span><span class="item-main"><span class="item-title" style="display:block">${esc(s.name)}</span><span class="item-sub">${s.grade}-р анги${cls ? ` · ${esc(cls.name)}` : ""} · ${s.xp || 0} XP</span></span></button>`;
          }).join("")}</div></div>` : ""}
        </div></div>
        <p style="text-align:center;margin-top:14px"><a href="/">← Нүүр хуудас</a></p>
      </div>`;
    document.getElementById("l-grade").addEventListener("change", (e) => {
      document.getElementById("l-class").innerHTML = classOpts(Number(e.target.value));
    });
    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const name = String(f.get("name") || "").trim();
      const grade = Number(f.get("grade"));
      const classId = String(f.get("classId") || "") || null;
      const err = document.getElementById("login-error");
      if (name.length < 2) { err.textContent = "Нэрээ бүтэн оруулна уу (хамгийн багадаа 2 тэмдэгт)."; return; }
      S.update((d) => {
        const low = name.toLocaleLowerCase("mn");
        let st = d.students.find((s) => s.name.toLocaleLowerCase("mn") === low && s.grade === grade && (s.classId || null) === classId);
        if (!st) {
          st = { id: S.uid("s"), name, grade, classId, xp: 0, createdAt: new Date().toISOString() };
          d.students.push(st);
        }
        d.currentStudentId = st.id;
      });
      enterStudent();
    });
    box.querySelectorAll("[data-login]").forEach((b) => b.addEventListener("click", () => {
      S.update((d) => { d.currentStudentId = b.dataset.login; });
      enterStudent();
    }));
  }

  /* ---------------- Chrome ---------------- */
  function renderChrome(data, st) {
    const cls = data.classes.find((c) => c.id === st.classId);
    document.getElementById("me-name").textContent = st.name;
    document.getElementById("me-avatar").textContent = S.initials(st.name);
    document.getElementById("me-role").textContent = `${st.grade}-р анги${cls ? ` · ${cls.name}` : ""} · Сурагч`;
    const gradeSwitch = document.getElementById("grade-switch");
    if (gradeSwitch) {
      gradeSwitch.value = String(st.grade);
      if (!gradeSwitch.dataset.bound) {
        gradeSwitch.dataset.bound = "1";
        gradeSwitch.addEventListener("change", () => {
          const grade = Number(gradeSwitch.value);
          if (![6, 7, 8, 9].includes(grade)) return;
          S.update((d) => {
            const cur = d.students.find((s) => s.id === d.currentStudentId);
            if (cur) cur.grade = grade;
          });
          ui.topicKey = null;
          ui.practice = null;
          render();
        });
      }
    }
    document.getElementById("today").textContent = S.mnDate();
    const r = getRank(st.xp || 0);
    document.getElementById("xp-chip").textContent = `${r.icon} ${st.xp || 0} XP`;
    const v = currentView();
    document.getElementById("topbar-title").textContent = TITLES[v];
    document.title = `${TITLES[v]} · Математикийн багшийн туслах`;
    document.querySelectorAll(".nav a[data-view]").forEach((a) => a.classList.toggle("active", a.dataset.view === v));
    const pending = myAssignments(data, st).filter((a) => !mySubmission(data, st, a.id)).length;
    const badge = document.getElementById("task-badge");
    badge.hidden = pending === 0;
    badge.textContent = pending;
  }

  /* ---------------- Home ---------------- */
  function renderHome() {
    const data = S.load();
    const st = me(data);
    const r = getRank(st.xp || 0);
    const pct = r.nextXP ? Math.round(((st.xp - r.base) / (r.nextXP - r.base)) * 100) : 100;
    const subs = data.submissions.filter((s) => s.studentId === st.id);
    const avg = S.avg(S.studentScores(data, st.id));
    const wins = data.attempts.filter((a) => a.studentId === st.id && a.kind === "battle" && a.win).length;
    const diag = data.attempts.filter((a) => a.studentId === st.id && a.kind === "assessment").sort((x, y) => new Date(y.at) - new Date(x.at))[0];

    const pending = myAssignments(data, st).filter((a) => !mySubmission(data, st, a.id));
    const pendingHtml = !st.classId
      ? emptyBox("Та бүлэгт элсээгүй", "Багшийн даалгавар авахын тулд гараад бүлгээ сонгож нэвтэрнэ үү.")
      : pending.length
        ? `<div class="list">${pending.slice(0, 5).map((a) => {
          const due = S.dueLabel(a.due);
          return `<a class="item" href="/student/assignments?task=${encodeURIComponent(a.id)}"><div class="item-icon">${a.kind === "exam" ? "🧪" : "📝"}</div><div class="item-main"><div class="item-title">${esc(a.title)}</div><div class="item-sub">${a.questions.length} асуулт${a.minutes ? ` · ${a.minutes} минут` : ""}</div></div><span class="pill ${due.urgent ? "pill-red" : "pill-blue"}">${due.label}</span></a>`;
        }).join("")}</div>`
        : emptyBox("Хүлээгдэж буй даалгавар алга", "Шинэ даалгавар ирэхэд энд гарна.");

    const mats = myMaterials(data, st).slice(0, 4);
    const matsHtml = mats.length
      ? `<div class="list">${mats.map((m) => `<a class="item" href="/student/lesson?topic=${encodeURIComponent(m.topicKey)}"><div class="item-icon">📘</div><div class="item-main"><div class="item-title">${esc(m.title)}</div><div class="item-sub">${esc(B.topicTitle(m.topicKey))} · ${S.shortDate(m.createdAt)}</div></div></a>`).join("")}</div>`
      : emptyBox("Шинэ материал алга", "Багш материал нийтлэхэд энд гарна.");

    const practice = data.attempts.filter((a) => a.studentId === st.id && a.kind === "practice" && a.grade === st.grade);
    const byTopic = {};
    practice.forEach((a) => { (byTopic[a.topicKey] ||= []).push(a.percent); });
    const weakest = Object.entries(byTopic).map(([k, v]) => ({ k, a: S.avg(v) })).sort((x, y) => x.a - y.a)[0];
    let suggest;
    if (!diag) {
      suggest = `<div class="item"><div class="item-icon">🎯</div><div class="item-main"><div class="item-title">Оношлогоо өгөөрэй</div><div class="item-sub">15 асуултаар өөрийн түвшнээ тогтооно.</div></div><a class="btn btn-sm" href="/student/assessment">Эхлэх</a></div>`;
    } else if (weakest && weakest.a < 80) {
      suggest = `<div class="item"><div class="item-icon">📚</div><div class="item-main"><div class="item-title">${esc(B.topicTitle(weakest.k))}</div><div class="item-sub">Дасгалын дундаж ${weakest.a}% — дахин давтахад тохиромжтой.</div></div><a class="btn btn-sm" href="/student/lesson?topic=${encodeURIComponent(weakest.k)}">Давтах</a></div>`;
    } else {
      const next = B.topicsOf(st.grade).find((t) => !byTopic[t.key]);
      suggest = next
        ? `<div class="item"><div class="item-icon">🚀</div><div class="item-main"><div class="item-title">${esc(B.niceTitle(next.title))}</div><div class="item-sub">Хараахан дасгал хийгээгүй сэдэв.</div></div><a class="btn btn-sm" href="/student/lesson?topic=${encodeURIComponent(next.key)}">Эхлэх</a></div>`
        : `<div class="item"><div class="item-icon">🏆</div><div class="item-main"><div class="item-title">Бүх сэдвээр дасгал хийсэн байна</div><div class="item-sub">Battle Mode-д өрсөлдөж XP цуглуулаарай.</div></div><a class="btn btn-sm" href="/student/battle">Battle</a></div>`;
    }

    const peers = data.students.filter((s) => (st.classId ? s.classId === st.classId : s.grade === st.grade)).sort((x, y) => (y.xp || 0) - (x.xp || 0)).slice(0, 5);
    const colors = ["#eab308", "#7c3aed", "#16a34a", "#0891b2", "#ef4444"];
    const lb = `<div class="list">${peers.map((p, i) => `<div class="item" style="${p.id === st.id ? "border-color:var(--primary);background:var(--primary-soft)" : ""}"><b style="width:18px">${i + 1}</b><span class="avatar sm" style="background:${colors[i]}">${esc(S.initials(p.name))}</span><div class="item-main"><div class="item-title">${esc(p.name)}${p.id === st.id ? " (Би)" : ""}</div></div><b>${p.xp || 0} XP</b></div>`).join("")}</div>`;

    view.innerHTML = `
      <div class="view-head"><h1>Сайн байна уу, ${esc(st.name)}! 👋</h1><p>${st.grade}-р ангийн математик · ${S.mnDate()}</p></div>
      <div class="grid grid-4 mb">
        <div class="card metric rank-card"><div class="metric-icon" style="background:rgba(255,255,255,0.2)">${r.icon}</div><div class="metric-value">${esc(r.name)}</div><div class="metric-label">${st.xp || 0} XP${r.next ? ` · ${r.next} хүртэл ${r.nextXP - (st.xp || 0)}` : ""}</div><div class="meter" style="margin-top:10px"><span style="width:${pct}%"></span></div></div>
        <div class="card metric"><div class="metric-icon bg-green">📝</div><div class="metric-value">${subs.length}</div><div class="metric-label">Илгээсэн даалгавар</div></div>
        <div class="card metric"><div class="metric-icon bg-blue">📈</div><div class="metric-value">${avg == null ? "—" : `${avg}%`}</div><div class="metric-label">Дундаж дүн</div></div>
        <div class="card metric"><div class="metric-icon bg-purple">⚡</div><div class="metric-value">${wins}</div><div class="metric-label">Battle ялалт</div></div>
      </div>
      <div class="grid grid-2-1 mb">
        <div class="card"><div class="card-head"><span>Хүлээгдэж буй даалгавар</span><a href="/student/assignments">Бүгд →</a></div><div class="card-body">${pendingHtml}</div></div>
        <div class="card"><div class="card-head"><span>Санал болгох</span></div><div class="card-body">${suggest}${diag ? `<p class="hint" style="margin:10px 0 0">Сүүлийн оношлогоо: ${diag.percent}% · ${diag.placement}-р ангийн түвшин</p>` : ""}</div></div>
      </div>
      <div class="grid grid-2">
        <div class="card"><div class="card-head"><span>Багшийн шинэ материал</span><a href="/student/lesson">Хичээл →</a></div><div class="card-body">${matsHtml}</div></div>
        <div class="card"><div class="card-head"><span>🏆 ${st.classId ? "Ангийн" : `${st.grade}-р ангийн`} лидерборд</span></div><div class="card-body">${lb}</div></div>
      </div>`;
  }

  /* ---------------- Lesson ---------------- */
  function renderLesson() {
    const data = S.load();
    const st = me(data);
    const topics = B.topicsOf(st.grade);
    if (!ui.topicKey || !topics.some((t) => t.key === ui.topicKey)) ui.topicKey = topics[0].key;
    const topic = topics.find((t) => t.key === ui.topicKey);
    const practiceOf = (k) => S.avg(data.attempts.filter((a) => a.studentId === st.id && a.kind === "practice" && a.topicKey === k).map((a) => a.percent));

    let n = 0;
    const list = B.contentUnits(st.grade).map((unit) => {
      const items = unit.topics.map((t) => {
        n += 1;
        const p = practiceOf(t.key);
        const mats = myMaterials(data, st, t.key).length;
        const bankN = stCount(t.key) || mpCount(t.key);
        return `<button type="button" class="item ${t.key === ui.topicKey ? "active" : ""}" data-topic="${t.key}"><div class="item-icon">${n}</div><div class="item-main"><div class="item-title">${esc(B.niceTitle(t.title))}</div><div class="item-sub">${bankN ? `${bankN} даалгавар · ` : ""}${mats ? `📘 ${mats} материал · ` : ""}${p == null ? "Дасгал хийгээгүй" : `Дасгал ${p}%`}</div></div></button>`;
      }).join("");
      return `<div class="nav-group" style="margin:12px 0 6px">${esc(unit.name)}</div>${items}`;
    }).join("");

    const units = B.unitsFor(topic.key).filter((u) => u.theory);
    const mats = myMaterials(data, st, topic.key);
    const practice = ui.practice && ui.practice.topicKey === topic.key ? ui.practice : null;

    let practiceHtml;
    if (!practice) {
      practiceHtml = `<p class="hint" style="margin:0 0 12px">5 асуулт. Хариулт бүрийн дараа зөв хариу, бодолт харагдана. Зөв хариулт бүрт +10 XP.</p><button type="button" class="btn btn-grad" id="start-practice">▶ Дасгал эхлүүлэх</button>`;
    } else {
      const answered = Object.keys(practice.answers).length;
      const done = answered === practice.questions.length;
      const sc = Q.score(practice.questions, practice.answers);
      practiceHtml = `
        <div class="actions" style="justify-content:space-between;margin-bottom:10px"><span class="hint" style="font-weight:800">${answered} / ${practice.questions.length} хариулсан</span>${done ? `<span class="pill ${S.scoreClass(sc.percent)}">${sc.correct}/${sc.total} · ${sc.percent}%</span>` : ""}</div>
        ${practice.questions.map((q, i) => Q.questionCard(q, i, { picked: practice.answers[i] ?? null, reveal: practice.answers[i] != null, total: practice.questions.length })).join("")}
        ${done ? `<div class="actions" style="margin-top:14px"><button type="button" class="btn" id="again">🔄 Дахин дасгал хийх</button><a class="btn btn-ghost" href="/student/battle">⚡ Battle-д шалгах</a></div>` : ""}`;
    }

    const part = ui.lessonPart || "theory";
    const unit1 = topic.key === "9-0" || topic.key === "9-1";
    const tabBtn = (id, label) => `<button type="button" class="${part === id ? "active" : ""}" data-part="${id}">${label}</button>`;
    let panel;
    if (part === "example") {
      const stu = stUnit(topic.key);
      if (stu) {
        const samples = [];
        stu.criteria.forEach((c) => { const p = c.levels[0] && c.levels[0].problems[0]; if (p) samples.push(p); });
        panel = samples.map((p) => stProblem(p, "example")).join("") || emptyBox("Жишээ алга", "");
      } else if (unit1 && window.IX1) {
        const samples = [];
        window.IX1.criteria.forEach((c) => { const p = c.levels[0] && c.levels[0].problems[0]; if (p) samples.push(p); });
        panel = samples.map((p) => ix1Problem(p, "example")).join("") || emptyBox("Жишээ алга", "");
      } else {
        if (!ui.example || ui.example.topicKey !== topic.key) ui.example = { topicKey: topic.key, q: B.buildQuestions({ grade: st.grade, topicKey: topic.key, count: 1 })[0] };
        panel = `<p class="hint">Жишээг бодолттой нь уншаад, дараа нь Даалгавар товчоор өөрөө бод.</p>${Q.questionCard(ui.example.q, 0, { reveal: true, picked: ui.example.q.answer, total: 1 })}`;
      }
    } else if (part === "task") {
      const stu = stUnit(topic.key);
      const mp = mpUnit(topic.key);
      const blocks = [];
      if (stu) {
        blocks.push(`<p class="hint">${esc(stu.name)} · ${stu.count} даалгавар. Бодоод <b>Бодолт</b> дээр дарж зөв хариутай тулга.</p>${stHtml(stu)}`);
      }
      if (mp) {
        const lv = mp.levels.find((l) => l.name === ui.mpLevel) || mp.levels[0];
        blocks.push(`<h3 style="margin:18px 0 8px">Нэмэлт сонгох бодлого</h3>
          <p class="hint">${esc(mp.name)}. Танин мэдэхүйн түвшингээ сонгоод бод. Сонгосны дараа <b>Шалгах</b> дээр дар.</p>
          <div class="seg">${mp.levels.map((l) => `<button type="button" class="${l.name === lv.name ? "active" : ""}" data-mplevel="${esc(l.name)}">${esc(l.name)} · ${l.problems.length}</button>`).join("")}</div>
          ${lv.problems.map(mpProblem).join("")}`);
      }
      if (!stu && unit1 && window.IX1) {
        blocks.push(`<p class="hint">Бодлогоо өөрөө бод. Дуусаад <b>Бодолт</b> дээр дарж зөв хариутай тулга.</p>${ix1Html("task")}`);
      }
      panel = blocks.length ? blocks.join("") : practiceHtml;
    } else {
      panel = `
        <h3 style="font-size:14px;margin-bottom:6px">Суралцахуйн зорилт</h3>
        <ul class="objectives">${topic.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
        ${units.length ? `<h3 style="font-size:14px;margin:16px 0 8px">Онол</h3>${units.map((u) => `<div class="theory"><strong>${esc(u.name)}</strong>${esc(u.theory)}</div>`).join("")}` : ""}
        <h3 style="font-size:14px;margin:16px 0 8px">Багшийн материал</h3>
        ${mats.length ? mats.map((m) => `<div class="material"><div class="item-title">${esc(m.title)}</div><div class="item-sub">${S.shortDate(m.createdAt)}</div><div class="material-body">${esc(m.body)}</div>${m.link ? `<div style="margin-top:6px"><a href="${esc(m.link)}" target="_blank" rel="noopener">Холбоос нээх</a></div>` : ""}</div>`).join("") : `<p class="hint">Багш материал нийтлэхэд энд гарна.</p>`}`;
    }

    view.innerHTML = `
      <div class="grid grid-1-2">
        <div class="card" style="align-self:start"><div class="card-head">${st.grade}-р анги · ${esc(B.unitName(topic.key) || "Нэгж")}</div><div class="card-body list topic-list">${list}</div></div>
        <div class="grid" style="align-content:start">
          <div class="card"><div class="card-head"><span>${esc(B.unitName(topic.key))} · ${esc(B.niceTitle(topic.title))}</span><span class="pill pill-purple">${esc(topic.level)}</span></div><div class="card-body">
            <div class="seg" id="lesson-parts">${tabBtn("theory", "ОНОЛ")}${tabBtn("example", "ЖИШЭЭ")}${tabBtn("task", "ДААЛГАВАР")}</div>
            <p class="hint">Эхлээд онолоо унш. Дараа нь жишээг хар. Тэгээд даалгавраа өөрөө бод.</p>
            ${panel}
          </div></div>
        </div>
      </div>`;

    view.querySelectorAll("[data-part]").forEach((b) => b.addEventListener("click", () => { ui.lessonPart = b.dataset.part; renderLesson(); }));
    view.querySelectorAll("[data-topic]").forEach((b) => b.addEventListener("click", () => { ui.topicKey = b.dataset.topic; ui.practice = null; ui.lessonPart = "theory"; renderLesson(); }));
    if (part === "task" && stUnit(topic.key)) bindSt();
    if (part === "task" && mpUnit(topic.key)) bindMp();
    if (part === "task" && !stUnit(topic.key) && unit1) bindIx1();
    const startBtn = document.getElementById("start-practice");
    const begin = () => { ui.practice = { topicKey: topic.key, questions: B.buildQuestions({ grade: st.grade, topicKey: topic.key, count: 5 }), answers: {}, saved: false }; renderLesson(); };
    if (startBtn) startBtn.addEventListener("click", begin);
    const again = document.getElementById("again");
    if (again) again.addEventListener("click", begin);
    view.querySelectorAll(".opt[data-q]").forEach((b) => b.addEventListener("click", () => {
      const p = ui.practice;
      const i = Number(b.dataset.q);
      if (!p || p.answers[i] != null) return;
      p.answers[i] = Number(b.dataset.opt);
      if (p.answers[i] === p.questions[i].answer) addXp(10);
      if (Object.keys(p.answers).length === p.questions.length && !p.saved) {
        p.saved = true;
        const sc = Q.score(p.questions, p.answers);
        saveAttempt({ kind: "practice", topicKey: p.topicKey, correct: sc.correct, total: sc.total, percent: sc.percent });
        S.toast(`Дасгал дууслаа: ${sc.percent}%`);
      }
      const y = window.scrollY;
      renderChrome(S.load(), me());
      renderLesson();
      window.scrollTo(0, y);
    }));
  }

  function stUnit(topicKey) {
    if (!window.ST) return null;
    return window.ST.units.find((u) => u.topics.includes(topicKey)) || null;
  }

  function stCount(topicKey) {
    const u = stUnit(topicKey);
    return u ? u.count : 0;
  }

  function stProblem(p, mode) {
    const picked = ui.st[p.id];
    const shown = mode === "example" || ui.stShow[p.id];
    const text = esc(p.text).replaceAll("\n", "<br>");
    const imgs = (p.images || []).map((src) => `<img src="${esc(src)}" alt="" style="max-width:100%;margin-top:8px">`).join("");
    const choices = mode === "example"
      ? ""
      : p.options.length
        ? `<div class="opts" style="margin-top:10px">${p.options.map((o) => `<button type="button" class="opt ${picked === o.letter ? "picked" : ""}" data-st="${esc(p.id)}" data-stletter="${o.letter}"><span class="key">${o.letter}</span><span>${esc(o.text)}</span></button>`).join("")}</div><button type="button" class="btn btn-sm" data-stcheck="${esc(p.id)}" style="margin-top:10px">Шалгах</button>`
        : `<button type="button" class="btn btn-ghost btn-sm" data-stshow="${esc(p.id)}" style="margin-top:10px">Бодолт</button>`;
    const mark = shown && p.correct && mode !== "example" ? (picked === p.correct ? `<span class="pill pill-green">Зөв</span>` : `<span class="pill pill-red">Буруу. Зөв нь ${esc(p.correct)}</span>`) : "";
    const answer = shown ? `<div class="theory" style="margin-top:8px"><strong>Бодолт.</strong> ${esc(p.answer).replaceAll("\n", "<br>")}</div>` : "";
    return `<div class="material"><div class="actions" style="justify-content:space-between"><div class="item-title">${esc(p.id)} · ${esc(p.title)}</div>${mark}</div><div style="margin-top:8px">${text}</div>${imgs}${choices}${answer}</div>`;
  }

  function stHtml(unit) {
    return unit.criteria.map((c) => `
      <div class="card mb">
        <div class="card-head">${esc(c.name)}</div>
        <div class="card-body">
          ${c.levels.map((lv) => `<div class="nav-group" style="margin:14px 0 6px">${esc(lv.name)} · ${lv.problems.length}</div>${lv.problems.map((p) => stProblem(p, "task")).join("")}`).join("")}
        </div>
      </div>`).join("");
  }

  function bindSt() {
    const unit = stUnit(ui.topicKey);
    if (!unit) return;
    const byId = {};
    unit.criteria.forEach((c) => c.levels.forEach((lv) => lv.problems.forEach((p) => { byId[p.id] = p; })));
    const keep = () => {
      const y = window.scrollY;
      renderLesson();
      window.scrollTo(0, y);
    };
    view.querySelectorAll("[data-stletter]").forEach((b) => b.addEventListener("click", () => { ui.st[b.dataset.st] = b.dataset.stletter; keep(); }));
    view.querySelectorAll("[data-stcheck]").forEach((b) => b.addEventListener("click", () => {
      const p = byId[b.dataset.stcheck];
      if (!p || !ui.st[p.id]) { S.toast("Хариултаа сонгоно уу"); return; }
      ui.stShow[p.id] = true;
      keep();
    }));
    view.querySelectorAll("[data-stshow]").forEach((b) => b.addEventListener("click", () => {
      ui.stShow[b.dataset.stshow] = !ui.stShow[b.dataset.stshow];
      keep();
    }));
  }

  function mpUnit(topicKey) {
    if (!window.MP) return null;
    return window.MP.units.find((u) => u.topics.includes(topicKey)) || null;
  }

  function mpCount(topicKey) {
    const u = mpUnit(topicKey);
    return u ? u.levels.reduce((n, lv) => n + lv.problems.length, 0) : 0;
  }

  function mpProblem(p) {
    const picked = ui.mp[p.id];
    const shown = ui.mpShow[p.id];
    const mark = shown ? (picked === p.correct ? `<span class="pill pill-green">Зөв</span>` : `<span class="pill pill-red">Буруу. Зөв нь ${esc(p.correct)}</span>`) : "";
    return `<div class="material" id="mp-${p.id}"><div class="actions" style="justify-content:space-between"><div class="item-title">${esc(p.text)}</div>${mark}</div>
      <div class="opts" style="margin-top:10px">${p.options.map((o) => `<button type="button" class="opt ${picked === o.letter ? "picked" : ""}" data-mp="${p.id}" data-mpletter="${o.letter}"><span class="key">${o.letter}</span><span>${esc(o.text)}</span></button>`).join("")}</div>
      <button type="button" class="btn btn-sm" data-mpcheck="${p.id}" style="margin-top:10px">Шалгах</button></div>`;
  }

  function bindMp() {
    const keep = () => {
      const y = window.scrollY;
      renderLesson();
      window.scrollTo(0, y);
    };
    view.querySelectorAll("[data-mplevel]").forEach((b) => b.addEventListener("click", () => { ui.mpLevel = b.dataset.mplevel; keep(); }));
    view.querySelectorAll("[data-mpletter]").forEach((b) => b.addEventListener("click", () => { ui.mp[b.dataset.mp] = b.dataset.mpletter; keep(); }));
    view.querySelectorAll("[data-mpcheck]").forEach((b) => b.addEventListener("click", () => {
      if (!ui.mp[b.dataset.mpcheck]) { S.toast("Хариултаа сонгоно уу"); return; }
      ui.mpShow[b.dataset.mpcheck] = true;
      keep();
    }));
  }

  /* ---------------- Tasks ---------------- */
  function ix1Problem(p, mode) {
    const picked = ui.ix1[p.n];
    const shown = mode === "example" || ui.ix1Show[p.n];
    const text = esc(p.text).replaceAll("\n", "<br>");
    const choices = mode === "example"
      ? ""
      : p.options.length
        ? `<div class="opts" style="margin-top:10px">${p.options.map((o) => `<button type="button" class="opt ${picked === o.letter ? "picked" : ""}" data-ix="${p.n}" data-letter="${o.letter}"><span class="key">${o.letter}</span><span>${esc(o.text)}</span></button>`).join("")}</div><button type="button" class="btn btn-sm" data-check="${p.n}" style="margin-top:10px">Шалгах</button>`
        : `<button type="button" class="btn btn-ghost btn-sm" data-show="${p.n}" style="margin-top:10px">Бодолт</button>`;
    const mark = shown && p.correct && mode !== "example" ? (picked === p.correct ? `<span class="pill pill-green">Зөв</span>` : `<span class="pill pill-red">Буруу. Зөв нь ${esc(p.correct)}</span>`) : "";
    const answer = shown ? `<div class="theory" style="margin-top:8px"><strong>Бодолт.</strong> ${esc(p.answer).replaceAll("\n", "<br>")}${p.wrong ? `<div class="hint" style="margin-top:6px">Анхаарах алдаа: ${esc(p.wrong)}</div>` : ""}</div>` : "";
    return `<div class="material" id="ix-${p.n}"><div class="actions" style="justify-content:space-between"><div class="item-title">${p.n}. ${text}</div>${mark}</div>${choices}${answer}</div>`;
  }

  function ix1Html(mode) {
    const bank = window.IX1;
    if (!bank) return "";
    return bank.criteria.map((c) => `
      <div class="card mb">
        <div class="card-head">${esc(c.name)}</div>
        <div class="card-body">
          ${c.outcome ? `<p class="hint" style="margin-top:0">${esc(c.outcome)}</p>` : ""}
          ${c.levels.map((lv) => `<div class="nav-group" style="margin:14px 0 6px">${esc(lv.name)}</div>${lv.note ? `<p class="hint">${esc(lv.note)}</p>` : ""}${lv.problems.map((p) => ix1Problem(p, mode)).join("")}`).join("")}
        </div>
      </div>`).join("");
  }

  function bindIx1() {
    const bank = window.IX1;
    if (!bank) return;
    const byN = {};
    bank.criteria.forEach((c) => c.levels.forEach((lv) => lv.problems.forEach((p) => { byN[p.n] = p; })));
    const keep = () => {
      const y = window.scrollY;
      if (currentView() === "lesson") renderLesson();
      else renderTasks();
      window.scrollTo(0, y);
    };
    view.querySelectorAll("[data-letter]").forEach((b) => b.addEventListener("click", () => {
      ui.ix1[b.dataset.ix] = b.dataset.letter;
      keep();
    }));
    view.querySelectorAll("[data-check]").forEach((b) => b.addEventListener("click", () => {
      const p = byN[b.dataset.check];
      if (!ui.ix1[p.n]) { S.toast("Хариултаа сонгоно уу"); return; }
      ui.ix1Show[p.n] = true;
      S.toast(ui.ix1[p.n] === p.correct ? "Зөв!" : "Буруу");
      keep();
    }));
    view.querySelectorAll("[data-show]").forEach((b) => b.addEventListener("click", () => {
      ui.ix1Show[b.dataset.show] = !ui.ix1Show[b.dataset.show];
      keep();
    }));
  }

  function renderTasks() {
    const data = S.load();
    const st = me(data);
    const task = ui.task ? data.assignments.find((a) => a.id === ui.task.id) : null;
    if (ui.task && !task) ui.task = null;
    if (task) return renderTaskRunner(data, st, task);

    const teacherMats = myMaterials(data, st);
    const matsCard = teacherMats.length
      ? `<div class="card mb"><div class="card-head">Багшийн нийтэлсэн материал</div><div class="card-body list">${teacherMats.map((m) => `<a class="item" href="/student/lesson?topic=${encodeURIComponent(m.topicKey)}"><div class="item-icon">📘</div><div class="item-main"><div class="item-title">${esc(m.title)}</div><div class="item-sub">${esc(B.unitName(m.topicKey))} · ${esc(B.topicTitle(m.topicKey))}</div></div></a>`).join("")}</div></div>`
      : "";
    if (!st.classId) {
      view.innerHTML = `
        <div class="view-head"><h1>${st.grade}-р ангийн даалгаврын сан</h1><p>Сэдэв дээр дарвал тухайн хичээлийн даалгавар нээгдэнэ. Тэнд Онол, Жишээ, Даалгавар гэж шилжинэ.</p></div>
        ${matsCard}
        <div class="card"><div class="card-body list">${B.contentUnits(st.grade).map((unit) => `<div class="nav-group" style="margin:12px 0 6px">${esc(unit.name)}</div>${unit.topics.map((t, i) => `<a class="item" href="/student/lesson?topic=${encodeURIComponent(t.key)}&tab=task"><div class="item-icon">${i + 1}</div><div class="item-main"><div class="item-title">${esc(B.niceTitle(t.title))}</div><div class="item-sub">${(stCount(t.key) || mpCount(t.key)) ? `${stCount(t.key) || mpCount(t.key)} даалгавар · ` : ""}${esc(t.level)}</div></div></a>`).join("")}`).join("")}</div></div>`;
      return;
    }
    const all = myAssignments(data, st);
    const pending = all.filter((a) => !mySubmission(data, st, a.id));
    const done = all.filter((a) => mySubmission(data, st, a.id));
    const row = (a) => {
      const sub = mySubmission(data, st, a.id);
      const due = S.dueLabel(a.due);
      return `<a class="item" href="/student/assignments?task=${encodeURIComponent(a.id)}"><div class="item-icon">${a.kind === "exam" ? "🧪" : "📝"}</div><div class="item-main"><div class="item-title">${esc(a.title)}</div><div class="item-sub">${a.kind === "exam" ? "Шалгалт" : "Даалгавар"} · ${a.questions.length} асуулт${a.minutes ? ` · ${a.minutes} минут` : ""}${a.topicKey ? ` · ${esc(B.topicTitle(a.topicKey))}` : ""}</div></div>${sub ? `<span class="pill ${S.scoreClass(sub.percent)}">${sub.percent}%</span>` : `<span class="pill ${due.urgent ? "pill-red" : "pill-blue"}">${due.label}</span>`}</a>`;
    };
    view.innerHTML = `
      ${matsCard}
      <div class="grid grid-2">
        <div class="card"><div class="card-head">Хийх (${pending.length})</div><div class="card-body list">${pending.length ? pending.map(row).join("") : emptyBox("Хийх даалгавар алга", "Багш шинэ даалгавар илгээхэд энд гарна.")}</div></div>
        <div class="card"><div class="card-head">Илгээсэн (${done.length})</div><div class="card-body list">${done.length ? done.map(row).join("") : emptyBox("Илгээсэн даалгавар алга", "Даалгавраа хийж илгээхэд дүн нь энд гарна.")}</div></div>
      </div>`;
  }

  function renderTaskRunner(data, st, task) {
    const sub = mySubmission(data, st, task.id);
    const back = `<a class="btn btn-ghost btn-sm" id="back" href="/student/assignments">← Жагсаалт</a>`;
    if (sub) {
      view.innerHTML = `
        <div class="actions mb">${back}</div>
        <div class="card mb"><div class="result-hero"><div class="result-emoji">${sub.percent >= 80 ? "🏆" : sub.percent >= 50 ? "📈" : "💪"}</div><div class="result-score">${sub.percent}%</div><p><b>${esc(task.title)}</b> · ${sub.correct}/${sub.total} зөв · ${S.shortDate(sub.at)}${sub.timedOut ? " · Хугацаа дууссан" : ""}</p></div></div>
        <div class="card"><div class="card-head">Хариултын тойм</div><div class="card-body">${task.questions.map((q, i) => Q.questionCard(q, i, { picked: sub.answers[i] ?? null, reveal: true, total: task.questions.length })).join("")}</div></div>`;
      return;
    }
    const t = ui.task;
    const answered = Object.keys(t.answers).length;
    const due = S.dueLabel(task.due);
    view.innerHTML = `
      <div class="actions mb">${back}</div>
      <div class="quiz-bar">
        <div><div class="item-title">${esc(task.title)}</div><div class="item-sub">${answered} / ${task.questions.length} хариулсан${due.overdue ? ` · <span style="color:var(--red)">${due.label}</span>` : ""}</div></div>
        <div class="actions">${task.minutes ? `<span class="timer" id="timer">--:--</span>` : ""}<button type="button" class="btn" id="submit">Илгээх</button></div>
      </div>
      <div id="qs">${task.questions.map((q, i) => Q.questionCard(q, i, { picked: t.answers[i] ?? null, total: task.questions.length })).join("")}</div>`;

    document.getElementById("back").addEventListener("click", (e) => {
      if (answered && !confirm("Хариултууд хадгалагдахгүй. Гарах уу?")) e.preventDefault();
    });
    view.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      t.answers[Number(b.dataset.q)] = Number(b.dataset.opt);
      const card = document.getElementById(`q-${b.dataset.q}`);
      card.querySelectorAll(".opt").forEach((o) => o.classList.toggle("picked", o === b));
      view.querySelector(".quiz-bar .item-sub").firstChild.textContent = `${Object.keys(t.answers).length} / ${task.questions.length} хариулсан`;
    }));
    const submit = (timedOut = false) => {
      const left = task.questions.length - Object.keys(t.answers).length;
      if (!timedOut && left > 0 && !confirm(`${left} асуултад хариулаагүй байна. Илгээх үү?`)) return;
      const sc = Q.score(task.questions, t.answers);
      S.update((d) => d.submissions.push({ id: S.uid("sub"), assignmentId: task.id, studentId: st.id, answers: t.answers, correct: sc.correct, total: sc.total, percent: sc.percent, timedOut, at: new Date().toISOString() }));
      addXp(sc.correct * 10);
      S.toast(timedOut ? `Хугацаа дууслаа. Дүн: ${sc.percent}%` : `Илгээлээ! Дүн: ${sc.percent}%`);
      if (cleanup) { cleanup(); cleanup = null; }
      renderChrome(S.load(), me());
      renderTasks();
      window.scrollTo(0, 0);
    };
    document.getElementById("submit").addEventListener("click", () => submit(false));
    if (task.minutes) {
      const endAt = t.started + task.minutes * 60000;
      const el = document.getElementById("timer");
      const tick = () => {
        const left = (endAt - Date.now()) / 1000;
        el.textContent = S.formatTimer(left);
        el.classList.toggle("low", left < 60);
        if (left <= 0) submit(true);
      };
      tick();
      const h = setInterval(tick, 500);
      cleanup = () => clearInterval(h);
    }
  }

  /* ---------------- Battle ---------------- */
  function renderBattle() {
    const st = me();
    const b = ui.battle;
    if (!b) return renderBattleSetup(st);
    if (b.phase === "end") return renderBattleEnd(st, b);
    return renderBattleRound(st, b);
  }

  function renderBattleSetup(st) {
    const data = S.load();
    const hist = data.attempts.filter((a) => a.studentId === st.id && a.kind === "battle");
    const wins = hist.filter((a) => a.win).length;
    view.innerHTML = `
      <div class="grid grid-2-1">
        <div class="card"><div class="card-head">⚡ Battle Mode</div><div class="card-body">
          <p style="margin-top:0">Роботтой ээлжлэн 7 асуултад өрсөлдөнө. Хэн хурдан, зөв хариулна — тэр их оноо авна. Асуултын түвшнээс хамаарч 20, 30, 45 секунд өгнө.</p>
          <form id="battle-form" class="form" novalidate>
            <div class="form-row">
              <label class="field">Сэдэв<select name="topicKey">${Q.topicOptions(st.grade, "", true)}</select></label>
              <label class="field">Өрсөлдөгч<select name="bot"><option value="easy">${BOTS.easy.name} (хялбар)</option><option value="mid" selected>${BOTS.mid.name} (дунд)</option><option value="hard">${BOTS.hard.name} (хүнд)</option></select></label>
            </div>
            <button class="btn btn-grad" type="submit">⚔️ Тулаан эхлүүлэх</button>
          </form>
        </div></div>
        <div class="card"><div class="card-head">Миний Battle</div><div class="card-body">
          <div class="grid grid-2">
            <div><div class="metric-value">${hist.length}</div><div class="metric-label">Тоглолт</div></div>
            <div><div class="metric-value">${wins}</div><div class="metric-label">Ялалт</div></div>
          </div>
          <p class="hint" style="margin-bottom:0">Ялалт +50 XP, оролцоо +15 XP.</p>
        </div></div>
      </div>`;
    document.getElementById("battle-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const topicKey = String(f.get("topicKey") || "") || null;
      ui.battle = {
        phase: "round",
        topicKey,
        bot: String(f.get("bot")),
        questions: B.buildQuestions({ grade: st.grade, topicKey, count: 7 }),
        i: 0,
        picks: [],
        me: 0,
        botScore: 0,
        myCorrect: 0,
        botCorrect: 0,
        round: null,
      };
      renderBattle();
    });
  }

  function startRound(b) {
    const q = b.questions[b.i];
    const limit = BATTLE_TIMER[q.level] || 30;
    const bot = BOTS[b.bot];
    const botCorrect = Math.random() < bot.acc;
    const wrongs = q.options.map((_, i) => i).filter((i) => i !== q.answer);
    b.round = {
      limit,
      startedAt: Date.now(),
      myPick: null,
      myTime: null,
      botPick: botCorrect ? q.answer : wrongs[Math.floor(Math.random() * wrongs.length)],
      botAt: (limit * (0.25 + Math.random() * 0.6)) * 1000,
      botDone: false,
      revealed: false,
    };
  }

  function renderBattleRound(st, b) {
    if (!b.round) startRound(b);
    const q = b.questions[b.i];
    const r = b.round;
    const bot = BOTS[b.bot];
    const maxScore = b.questions.length * (100 + 45 * 3);
    view.innerHTML = `
      <div class="card mb"><div class="card-body arena">
        <div class="fighter"><div class="avatar purple">${esc(S.initials(st.name))}</div><div class="item-title">${esc(st.name)}</div><div class="fighter-score">${b.me}</div><div class="hp"><span style="width:${Math.min(100, (b.me / maxScore) * 100 * 2.2)}%"></span></div><div class="item-sub" id="me-status">${r.myPick == null ? "Бодож байна…" : "Хариулсан"}</div></div>
        <div style="text-align:center"><div class="vs">VS</div><div class="item-sub">${b.i + 1} / ${b.questions.length}</div><div class="timer" id="btimer">${r.limit}</div></div>
        <div class="fighter"><div class="avatar" style="background:#0f172a">🤖</div><div class="item-title">${bot.name}</div><div class="fighter-score">${b.botScore}</div><div class="hp"><span style="width:${Math.min(100, (b.botScore / maxScore) * 100 * 2.2)}%"></span></div><div class="item-sub" id="bot-status">${r.botDone ? "Хариулсан" : "Бодож байна…"}</div></div>
      </div></div>
      <div id="bq">${Q.questionCard(q, b.i, { picked: r.myPick, reveal: r.revealed, total: b.questions.length, clickable: r.myPick == null })}</div>
      ${r.revealed ? `<p class="hint" style="text-align:center;margin-top:10px">Робот: ${r.botPick === q.answer ? "зөв" : "буруу"} хариулсан. Дараагийн асуулт руу шилжиж байна…</p>` : ""}
      <div class="actions no-print" style="justify-content:center;margin-top:14px"><button type="button" class="btn btn-ghost btn-sm" id="quit">Тулаанаас гарах</button></div>`;

    document.getElementById("quit").addEventListener("click", () => {
      if (!confirm("Тулаанаас гарах уу? Оноо тооцогдохгүй.")) return;
      if (cleanup) { cleanup(); cleanup = null; }
      ui.battle = null;
      renderBattle();
    });
    if (r.revealed) return;

    view.querySelectorAll(".opt").forEach((btn) => btn.addEventListener("click", () => {
      if (r.myPick != null) return;
      r.myPick = Number(btn.dataset.opt);
      r.myTime = (Date.now() - r.startedAt) / 1000;
      btn.classList.add("picked");
      view.querySelectorAll(".opt").forEach((o) => { o.disabled = true; });
      document.getElementById("me-status").textContent = "Хариулсан";
      check();
    }));

    const finishRound = () => {
      if (r.revealed) return;
      r.revealed = true;
      if (cleanup) { cleanup(); cleanup = null; }
      b.picks[b.i] = r.myPick;
      const left = (t) => Math.max(0, r.limit - t);
      if (r.myPick === q.answer) { b.me += 100 + Math.round(left(r.myTime) * 3); b.myCorrect += 1; }
      if (r.botDone && r.botPick === q.answer) { b.botScore += 100 + Math.round(left(r.botAt / 1000) * 3); b.botCorrect += 1; }
      renderBattleRound(st, b);
      const h = setTimeout(() => {
        b.i += 1;
        b.round = null;
        if (b.i >= b.questions.length) {
          b.phase = "end";
          finishBattle(st, b);
        }
        renderBattle();
      }, 1800);
      cleanup = () => clearTimeout(h);
    };

    const check = () => {
      if (r.myPick != null && r.botDone) finishRound();
    };

    const el = document.getElementById("btimer");
    const tick = () => {
      const elapsed = Date.now() - r.startedAt;
      const left = r.limit - elapsed / 1000;
      el.textContent = Math.max(0, Math.ceil(left));
      el.classList.toggle("low", left < 6);
      if (!r.botDone && elapsed >= r.botAt) {
        r.botDone = true;
        const s = document.getElementById("bot-status");
        if (s) s.textContent = "Хариулсан";
        check();
      }
      if (left <= 0) finishRound();
    };
    tick();
    const h = setInterval(tick, 200);
    cleanup = () => clearInterval(h);
  }

  function finishBattle(st, b) {
    const win = b.me > b.botScore;
    const draw = b.me === b.botScore;
    b.result = win ? "win" : draw ? "draw" : "lose";
    const percent = Math.round((b.myCorrect / b.questions.length) * 100);
    saveAttempt({ kind: "battle", topicKey: b.topicKey, correct: b.myCorrect, total: b.questions.length, percent, win, score: b.me, botScore: b.botScore });
    addXp(win ? 50 : 15);
  }

  function renderBattleEnd(st, b) {
    const head = { win: ["🏆", "Ялалт!", "+50 XP"], draw: ["🤝", "Тэнцлээ", "+15 XP"], lose: ["💪", "Дараагийн удаа!", "+15 XP"] }[b.result];
    view.innerHTML = `
      <div class="card mb"><div class="result-hero"><div class="result-emoji">${head[0]}</div><div class="result-score">${head[1]}</div><p>${esc(st.name)} <b>${b.me}</b> : <b>${b.botScore}</b> ${BOTS[b.bot].name} · Зөв хариулт ${b.myCorrect}/${b.questions.length} · ${head[2]}</p></div></div>
      <div class="actions mb"><button type="button" class="btn btn-grad" id="rematch">🔄 Дахин тулалдах</button><button type="button" class="btn btn-ghost" id="setup">Тохиргоо солих</button></div>
      <div class="card"><div class="card-head">Асуултын тойм</div><div class="card-body">${b.questions.map((q, i) => Q.questionCard(q, i, { picked: b.picks[i] ?? null, reveal: true, total: b.questions.length })).join("")}</div></div>`;
    renderChrome(S.load(), me());
    document.getElementById("rematch").addEventListener("click", () => {
      ui.battle = { ...b, phase: "round", questions: B.buildQuestions({ grade: st.grade, topicKey: b.topicKey, count: 7 }), i: 0, picks: [], me: 0, botScore: 0, myCorrect: 0, botCorrect: 0, round: null, result: null };
      renderBattle();
    });
    document.getElementById("setup").addEventListener("click", () => { ui.battle = null; renderBattle(); });
  }

  /* ---------------- Assessment ---------------- */
  function buildAssessment(grade) {
    const levels = [];
    ASSESS_LEVELS.forEach((l) => { for (let i = 0; i < l.count; i += 1) levels.push(l); });
    const grades = PLACEMENT_OFFSETS.map((off) => Math.max(6, grade - off));
    const seen = new Set();
    return levels.map((l, i) => {
      let q = null;
      for (let tries = 0; tries < 20 && !q; tries += 1) {
        const [cand] = B.buildQuestions({ grade: grades[i], count: 1, level: l.bank, bankFirst: Math.random() < 0.5 });
        if (cand && !seen.has(cand.text)) q = cand;
      }
      if (!q) [q] = B.buildQuestions({ grade: grades[i], count: 1 });
      seen.add(q.text);
      return { ...q, aLevel: l.key, points: l.points, gradeAsked: grades[i] };
    });
  }

  function placementGrade(enrolled, items, answers) {
    const by = {};
    items.forEach((q, i) => {
      if (answers[i] == null) return;
      const g = q.gradeAsked;
      by[g] ||= { c: 0, t: 0 };
      by[g].t += 1;
      if (answers[i] === q.answer) by[g].c += 1;
    });
    for (let g = enrolled; g >= 6; g -= 1) if (by[g] && by[g].t >= 2 && by[g].c / by[g].t >= 0.55) return g;
    for (let g = enrolled; g >= 6; g -= 1) if (by[g] && by[g].t >= 1 && by[g].c / by[g].t >= 0.4) return g;
    const gs = Object.keys(by).map(Number);
    return gs.length ? Math.min(...gs) : enrolled;
  }

  function headline(p) {
    if (p >= 80) return { emoji: "🏆", title: "Маш сайн!", message: "Энэ хичээлд чи сайн бэлэн байна. Дараагийн долоо хоногт бага багаар сонирхолтой даалгавар хийе." };
    if (p >= 50) return { emoji: "📈", title: "Сайн эхлэл!", message: "Зарим хэсэг сайн, заримыг дахин давтахад тохирно. «Хичээл» хэсгийн дасгалаар бэхжүүлээрэй." };
    return { emoji: "💪", title: "Хамтдаа сайжруулъя!", message: "Эхлээд хялбар сэдвээс эхэлнэ. Өдөр бүр 20 минут дасгал хийвэл аажмаар сайжирна." };
  }

  function renderAssessment() {
    const data = S.load();
    const st = me(data);
    const a = ui.assess;
    if (!a) {
      const last = data.attempts.filter((x) => x.studentId === st.id && x.kind === "assessment").sort((x, y) => new Date(y.at) - new Date(x.at))[0];
      view.innerHTML = `
        <div class="grid grid-2-1">
          <div class="card"><div class="card-head">🎯 Оношлогоо</div><div class="card-body">
            <p style="margin-top:0">Математикийн түвшнээ тогтоох шалгалт. ${st.grade}-р анги болон түүнээс доош ангиудын сэдвээс асуулт гарна (6-р ангиас доош бууруулахгүй).</p>
            <ul class="objectives">
              <li><b>15 асуулт</b>, нийт <b>${ASSESS_MINUTES} минут</b>. Хугацаа дуусахад автоматаар дуусна.</li>
              <li>Мэдлэг 2 · Ойлголт 3 · Чадвар 6 · Хэрэглээ 4 асуулт.</li>
              <li>Оноо: мэдлэг, ойлголт 6, чадвар, хэрэглээ 7 — нийт 100 оноо.</li>
              <li>Дуусгасны дараа түвшин бүрийн гүйцэтгэл, тохирох анги, зөвлөмж гарна. +30 XP.</li>
            </ul>
            <button type="button" class="btn btn-grad" id="begin" style="margin-top:12px">Сорил эхлэх</button>
          </div></div>
          <div class="card"><div class="card-head">Сүүлийн дүн</div><div class="card-body">${last ? `<div class="metric-value">${last.percent}%</div><div class="metric-label">${last.placement}-р ангийн түвшин · ${S.shortDate(last.at)}</div>` : emptyBox("Оношлогоо өгөөгүй", "Эхний оношлогоогоо өгөөд түвшнээ мэдээрэй.")}</div></div>
        </div>`;
      document.getElementById("begin").addEventListener("click", () => {
        ui.assess = { items: buildAssessment(st.grade), answers: {}, i: 0, startedAt: Date.now(), done: false };
        renderAssessment();
      });
      return;
    }
    if (a.done) return renderAssessmentResult(st, a);

    const q = a.items[a.i];
    const answered = Object.keys(a.answers).length;
    view.innerHTML = `
      <div class="quiz-bar">
        <div><div class="item-title">Оношлогоо · ${a.i + 1} / ${a.items.length}</div><div class="progress-dots" style="margin-top:6px">${a.items.map((_, i) => `<span class="${a.answers[i] != null ? "done" : ""} ${i === a.i ? "now" : ""}"></span>`).join("")}</div></div>
        <div class="actions"><span class="timer" id="atimer">--:--</span><button type="button" class="btn" id="finish">Дуусгах</button></div>
      </div>
      <div class="card"><div class="card-body">
        <div class="q-head" style="margin-bottom:6px"><span class="pill pill-purple">${esc(ASSESS_LEVELS.find((l) => l.key === q.aLevel).label)} · ${q.points} оноо</span><span>${q.gradeAsked}-р ангийн сэдэв</span></div>
        ${Q.questionCard(q, a.i, { picked: a.answers[a.i] ?? null, showMeta: false })}
        <div class="actions" style="justify-content:space-between;margin-top:14px">
          <button type="button" class="btn btn-ghost" id="prev" ${a.i === 0 ? "disabled" : ""}>← Өмнөх</button>
          <span class="hint">${answered} / ${a.items.length} хариулсан</span>
          ${a.i < a.items.length - 1 ? `<button type="button" class="btn" id="next">Дараах →</button>` : `<button type="button" class="btn btn-grad" id="finish2">Дуусгах</button>`}
        </div>
      </div></div>`;

    view.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      a.answers[a.i] = Number(b.dataset.opt);
      if (a.i < a.items.length - 1) a.i += 1;
      if (cleanup) { cleanup(); cleanup = null; }
      renderAssessment();
    }));
    const go = (d) => () => { a.i += d; if (cleanup) { cleanup(); cleanup = null; } renderAssessment(); };
    document.getElementById("prev").addEventListener("click", go(-1));
    const next = document.getElementById("next");
    if (next) next.addEventListener("click", go(1));
    const finish = (timedOut = false) => {
      const left = a.items.length - Object.keys(a.answers).length;
      if (!timedOut && left > 0 && !confirm(`${left} асуултад хариулаагүй байна. Дуусгах уу?`)) return;
      if (cleanup) { cleanup(); cleanup = null; }
      completeAssessment(st, a, timedOut);
      renderAssessment();
    };
    document.getElementById("finish").addEventListener("click", () => finish(false));
    const f2 = document.getElementById("finish2");
    if (f2) f2.addEventListener("click", () => finish(false));
    const endAt = a.startedAt + ASSESS_MINUTES * 60000;
    const el = document.getElementById("atimer");
    const tick = () => {
      const left = (endAt - Date.now()) / 1000;
      el.textContent = S.formatTimer(left);
      el.classList.toggle("low", left < 120);
      if (left <= 0) finish(true);
    };
    tick();
    const h = setInterval(tick, 500);
    cleanup = () => clearInterval(h);
  }

  function completeAssessment(st, a, timedOut) {
    let points = 0;
    const stats = {};
    ASSESS_LEVELS.forEach((l) => { stats[l.key] = { c: 0, t: 0 }; });
    a.items.forEach((q, i) => {
      stats[q.aLevel].t += 1;
      if (a.answers[i] === q.answer) { points += q.points; stats[q.aLevel].c += 1; }
    });
    const placement = placementGrade(st.grade, a.items, a.answers);
    const correct = a.items.filter((q, i) => a.answers[i] === q.answer).length;
    a.done = true;
    a.result = { percent: points, points, stats, placement, correct, timedOut, answeredCount: Object.keys(a.answers).length };
    saveAttempt({ kind: "assessment", topicKey: null, correct, total: a.items.length, percent: points, placement, levelStats: stats });
    addXp(30);
  }

  function renderAssessmentResult(st, a) {
    const r = a.result;
    const h = headline(r.percent);
    const weak = [];
    const strong = [];
    ASSESS_LEVELS.forEach((l) => {
      const s = r.stats[l.key];
      if (!s.t) return;
      const p = Math.round((s.c / s.t) * 100);
      if (p >= 75) strong.push(l.label.toLocaleLowerCase("mn"));
      else if (p < 55) weak.push(l.label.toLocaleLowerCase("mn"));
    });
    const lines = [h.message];
    if (r.placement < st.grade) lines.push(`Чи одоо ${r.placement}-р ангийн математикаас эхлэн давтахад тохирно.`);
    else lines.push(`Чи ${r.placement}-р ангийн түвшинд тохирно.`);
    if (weak.length) lines.push(`Илүү сайн болгох: ${weak.join(", ")}.`);
    if (strong.length) lines.push(`Чи сайн хийсэн: ${strong.join(", ")}.`);
    if (r.timedOut) lines.push("Цаг дууссан ч хариулсан асуултууд тооцогдсон.");
    else if (r.answeredCount < a.items.length) lines.push("Чи зарим асуултыг алгассан — дараа удаа бүгдэд нь хариулж үзээрэй.");

    view.innerHTML = `
      <div class="card mb"><div class="result-hero"><div class="result-emoji">${h.emoji}</div><div class="result-score">${r.percent}%</div><h2 style="font-size:20px">${h.title}</h2><p>${r.correct}/${a.items.length} зөв · ${r.points}/100 оноо · Тохирох түвшин: <b>${r.placement}-р анги</b></p></div></div>
      <div class="grid grid-2 mb">
        <div class="card"><div class="card-head">Түвшин бүрийн гүйцэтгэл</div><div class="card-body">${ASSESS_LEVELS.map((l) => {
          const s = r.stats[l.key];
          const p = s.t ? Math.round((s.c / s.t) * 100) : 0;
          return `<div style="margin-bottom:12px"><div class="actions" style="justify-content:space-between;font-size:13px;font-weight:700"><span>${l.label}</span><span>${s.c}/${s.t} · ${p}%</span></div><div class="meter"><span style="width:${p}%;background:${p >= 75 ? "var(--green)" : p >= 55 ? "var(--amber)" : "var(--red)"}"></span></div></div>`;
        }).join("")}</div></div>
        <div class="card"><div class="card-head">Зөвлөмж</div><div class="card-body"><p class="pre" style="margin:0">${esc(lines.join("\n\n"))}</p><div class="actions" style="margin-top:14px"><a class="btn btn-sm" href="/student/lesson">📚 Хичээл рүү</a><button type="button" class="btn btn-ghost btn-sm" id="again">🔄 Дахин өгөх</button></div></div></div>
      </div>
      <div class="card"><div class="card-head">Хариултын тойм</div><div class="card-body">${a.items.map((q, i) => Q.questionCard(q, i, { picked: a.answers[i] ?? null, reveal: true, total: a.items.length })).join("")}</div></div>`;
    renderChrome(S.load(), me());
    document.getElementById("again").addEventListener("click", () => { ui.assess = null; renderAssessment(); });
  }

  /* ---------------- Stats ---------------- */
  function renderStats() {
    const data = S.load();
    const st = me(data);
    const mine = data.attempts.filter((a) => a.studentId === st.id);
    const subs = data.submissions.filter((s) => s.studentId === st.id);
    const battles = mine.filter((a) => a.kind === "battle");
    const topics = B.topicsOf(st.grade);
    const topicRows = topics.map((t) => {
      const list = mine.filter((a) => a.kind === "practice" && a.topicKey === t.key);
      return { t, n: list.length, avg: S.avg(list.map((a) => a.percent)) };
    });
    const history = [
      ...subs.map((s) => {
        const as = data.assignments.find((x) => x.id === s.assignmentId);
        return { at: s.at, type: as && as.kind === "exam" ? "Шалгалт" : "Даалгавар", title: as ? as.title : "(устгагдсан)", score: `${s.percent}%`, cls: S.scoreClass(s.percent) };
      }),
      ...mine.map((a) => ({
        at: a.at,
        type: { practice: "Дасгал", battle: "Battle", assessment: "Оношлогоо" }[a.kind],
        title: a.kind === "assessment" ? `${a.placement}-р ангийн түвшин` : a.topicKey ? B.topicTitle(a.topicKey) : "Холимог сэдэв",
        score: a.kind === "battle" ? `${a.win ? "Ялалт" : "Ялагдал"} · ${a.correct}/${a.total}` : `${a.percent}%`,
        cls: a.kind === "battle" ? (a.win ? "pill-green" : "pill-muted") : S.scoreClass(a.percent),
      })),
    ].sort((x, y) => new Date(y.at) - new Date(x.at));

    view.innerHTML = `
      <div class="grid grid-4 mb">
        <div class="card metric"><div class="metric-icon bg-blue">📈</div><div class="metric-value">${S.avg(S.studentScores(data, st.id)) ?? "—"}${S.avg(S.studentScores(data, st.id)) == null ? "" : "%"}</div><div class="metric-label">Нийт дундаж</div></div>
        <div class="card metric"><div class="metric-icon bg-green">📝</div><div class="metric-value">${subs.length}</div><div class="metric-label">Даалгавар, шалгалт</div></div>
        <div class="card metric"><div class="metric-icon bg-amber">✏️</div><div class="metric-value">${mine.filter((a) => a.kind === "practice").length}</div><div class="metric-label">Дасгал</div></div>
        <div class="card metric"><div class="metric-icon bg-purple">⚡</div><div class="metric-value">${battles.filter((b) => b.win).length}/${battles.length}</div><div class="metric-label">Battle ялалт / тоглолт</div></div>
      </div>
      <div class="grid grid-1-2">
        <div class="card" style="align-self:start"><div class="card-head">Сэдвээр (дасгал)</div><div class="card-body">${topicRows.map((r) => `<div style="margin-bottom:12px"><div class="actions" style="justify-content:space-between;font-size:13px;font-weight:700"><span>${esc(B.niceTitle(r.t.title))}</span><span>${r.avg == null ? "—" : `${r.avg}%`}</span></div><div class="meter"><span style="width:${r.avg || 0}%"></span></div></div>`).join("")}</div></div>
        <div class="card"><div class="card-head">Түүх</div><div class="card-body" style="padding-top:4px">${history.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Огноо</th><th>Төрөл</th><th>Агуулга</th><th>Дүн</th></tr></thead><tbody>${history.map((h) => `<tr><td>${S.shortDate(h.at)}</td><td>${h.type}</td><td>${esc(h.title)}</td><td><span class="pill ${h.cls}">${esc(h.score)}</span></td></tr>`).join("")}</tbody></table></div>` : emptyBox("Одоогоор дүн алга", "Дасгал, даалгавар хийхэд энд бүртгэгдэнэ.")}</div></div>
      </div>`;
  }

  /* ---------------- Router ---------------- */
  const RENDER = { home: renderHome, lesson: renderLesson, tasks: renderTasks, battle: renderBattle, assessment: renderAssessment, stats: renderStats };

  function render() {
    if (cleanup) { cleanup(); cleanup = null; }
    ensureStudent();
    const data = S.load();
    const st = me(data);
    document.getElementById("login").hidden = true;
    document.getElementById("shell").hidden = false;
    renderChrome(data, st);
    RENDER[currentView()]();
    document.getElementById("shell").classList.remove("nav-open");
  }

  function busy() {
    return (ui.task && currentView() === "tasks") || (ui.battle && ui.battle.phase === "round") || (ui.assess && !ui.assess.done);
  }

  function logout() {
    if (busy() && !confirm("Явцтай ажил хадгалагдахгүй. Гарах уу?")) return;
    location.assign("/");
  }

  function enterStudent() {
    if (location.pathname === "/student/dashboard" && !location.search && !location.hash) start();
    else location.assign("/student/dashboard");
  }

  async function start() {
    if (leaveHash()) return;
    applyPageQuery();
    if (window.Cloud && typeof window.Cloud.pull === "function") {
      try {
        const remote = await window.Cloud.pull();
        if (remote && typeof remote === "object") S.replace(remote);
      } catch {
        /* local copy stays */
      }
    }
    render();
  }

  document.getElementById("menu-btn").addEventListener("click", () => document.getElementById("shell").classList.toggle("nav-open"));
  document.getElementById("logout").addEventListener("click", logout);
  S.onExternalChange(() => {
    const st = me();
    if (!st) { render(); return; }
    renderChrome(S.load(), st);
    if (!busy() && ["home", "tasks", "lesson", "stats"].includes(currentView()) && !ui.practice) render();
  });

  start();
})();
