(function () {
  const S = window.Store;
  const B = window.MathBank;
  const Q = window.Quiz;
  const esc = S.escapeHtml;

  const TITLES = {
    dashboard: "Багшийн хяналтын самбар",
    classes: "Таны хариуцаж буй ангиуд",
    content: "Нийтлэл оруулах",
    assistant: "Туслах",
    grades: "Дүн",
  };

  const MODE_META = {
    plan: { icon: "🗓️", label: "Хичээлийн төлөвлөлт", sub: "Ээлжит хичээлийн хөтөлбөр", btn: "btn-grad", action: "✨ Ээлжит хичээлийн төлөвлөгөө гаргах" },
    assignment: { icon: "📝", label: "Даалгавар", sub: "Ангид илгээх дасгал", btn: "btn-green", action: "✨ Даалгавар үүсгэх" },
    exam: { icon: "🧪", label: "Шалгалт", sub: "Хугацаатай шалгалтын материал", btn: "btn-amber", action: "✨ Шалгалт үүсгэх" },
  };

  const ui = {
    mode: "plan",
    draft: null,
    showAnswers: true,
    planHtml: "",
    gradeClassId: null,
    classDetailId: null,
    dashClassId: "",
    contentGrade: 6,
    planGrade: 6,
  };

  const view = document.getElementById("view");

  const PAGES = {
    dashboard: "/teacher/dashboard",
    classes: "/teacher/classes",
    content: "/teacher/content",
    assistant: "/teacher/assistant",
    grades: "/teacher/grades",
  };

  function currentView() {
    const last = location.pathname.split("/").filter(Boolean).pop() || "";
    return TITLES[last] ? last : "dashboard";
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
    const classId = q.get("class");
    if (classId) ui.classDetailId = classId;
    const mode = q.get("mode");
    if (mode && MODE_META[mode]) ui.mode = mode;
  }

  function classById(data, id) {
    return data.classes.find((c) => c.id === id) || null;
  }

  function studentsOfClass(data, classId) {
    return data.students.filter((s) => s.classId === classId);
  }

  function studentAvg(data, id) {
    return S.avg(S.studentScores(data, id));
  }

  function statusOf(data, st) {
    const a = studentAvg(data, st.id);
    const last = S.lastActivity(data, st.id);
    if (a == null) return { label: "Шинэ", cls: "pill-blue" };
    if (a < 60) return { label: "Анхаарал хэрэгтэй", cls: "pill-red" };
    if (last && Date.now() - last < 7 * 86400000) return { label: "Идэвхтэй", cls: "pill-green" };
    return { label: "Идэвхгүй", cls: "pill-muted" };
  }

  function todayIso(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function emptyBox(title, text, link) {
    return `<div class="empty"><strong>${title}</strong>${text}${link ? `<div style="margin-top:12px">${link}</div>` : ""}</div>`;
  }

  function renderChrome() {
    const data = S.load();
    const name = data.teacherName || "Математикийн багш";
    document.getElementById("me-name").textContent = name;
    document.getElementById("me-avatar").textContent = S.initials(name);
    document.getElementById("top-avatar").textContent = S.initials(name);
    document.getElementById("today").textContent = S.mnDate();
    const v = currentView();
    document.getElementById("topbar-title").textContent = TITLES[v];
    document.title = `${TITLES[v]} · Математикийн багшийн туслах`;
    document.querySelectorAll(".nav a[data-view]").forEach((a) => a.classList.toggle("active", a.dataset.view === v));
  }

  /* ---------------- Dashboard ---------------- */
  function weeklySeries(data, classId) {
    const ids = classId ? new Set(studentsOfClass(data, classId).map((s) => s.id)) : null;
    const rows = [
      ...data.submissions.map((s) => ({ studentId: s.studentId, at: s.at, percent: s.percent })),
      ...data.attempts.filter((a) => a.kind !== "battle").map((a) => ({ studentId: a.studentId, at: a.at, percent: a.percent })),
    ].filter((r) => !ids || ids.has(r.studentId));
    const days = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
    const out = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = d.getTime() + 86400000;
      const vals = rows.filter((r) => {
        const t = new Date(r.at).getTime();
        return t >= d.getTime() && t < next;
      }).map((r) => r.percent);
      out.push({ label: days[d.getDay()], value: S.avg(vals) });
    }
    return out;
  }

  function renderDashboard() {
    const data = S.load();
    const allScores = [...data.submissions.map((s) => s.percent), ...data.attempts.filter((a) => a.kind !== "battle").map((a) => a.percent)];
    const activeAssign = data.assignments.filter((a) => !S.dueLabel(a.due).overdue).length;
    const metrics = [
      { icon: "🏫", bg: "bg-blue", value: data.classes.length, label: "Анги" },
      { icon: "👥", bg: "bg-purple", value: data.students.length, label: "Сурагч" },
      { icon: "📝", bg: "bg-green", value: activeAssign, label: "Идэвхтэй даалгавар" },
      { icon: "📈", bg: "bg-amber", value: S.avg(allScores) == null ? "—" : `${S.avg(allScores)}%`, label: "Дундаж гүйцэтгэл" },
    ];
    if (ui.dashClassId && !classById(data, ui.dashClassId)) ui.dashClassId = "";
    const weekly = weeklySeries(data, ui.dashClassId);
    const hasWeekly = weekly.some((p) => p.value != null);
    const chart = hasWeekly
      ? `<div class="bars">${weekly.map((p) => `<div class="bar-col"><span class="bar-val">${p.value ?? "—"}</span><div class="bar ${p.value == null ? "empty-bar" : ""}" style="height:${p.value == null ? 4 : Math.max(6, p.value)}%"></div><span class="bar-label">${p.label}</span></div>`).join("")}</div>`
      : `<p class="empty">Сүүлийн 7 хоногт хийсэн даалгавар, дасгалын мэдээлэл байхгүй.</p>`;

    const classesHtml = data.classes.length
      ? data.classes.map((c) => {
        const studs = studentsOfClass(data, c.id);
        const a = S.avg(studs.flatMap((s) => S.studentScores(data, s.id)));
        return `<a class="item" href="/teacher/classes?class=${encodeURIComponent(c.id)}"><div class="item-icon">🏫</div><div class="item-main"><div class="item-title">${esc(c.name)}</div><div class="item-sub">${c.grade}-р анги · ${studs.length} сурагч</div></div><strong style="color:var(--primary)">${a == null ? "—" : `${a}%`}</strong></a>`;
      }).join("")
      : emptyBox("Анги байхгүй", "Эхлээд ангиа үүсгэнэ үү.", `<a class="btn btn-sm" href="/teacher/classes">Анги үүсгэх</a>`);

    const students = [...data.students].sort((x, y) => (S.lastActivity(data, y.id) || 0) - (S.lastActivity(data, x.id) || 0)).slice(0, 8);
    const studentsHtml = students.length
      ? `<div class="table-wrap"><table class="table"><thead><tr><th>Сурагч</th><th>Анги</th><th>Дүн</th><th>Статус</th></tr></thead><tbody>${students.map((s) => {
        const a = studentAvg(data, s.id);
        const st = statusOf(data, s);
        const cls = classById(data, s.classId);
        return `<tr><td><div class="who"><span class="avatar sm purple">${esc(S.initials(s.name))}</span>${esc(s.name)}</div></td><td>${cls ? esc(cls.name) : `${s.grade}-р анги`}</td><td><span class="pill ${S.scoreClass(a)}">${a == null ? "—" : `${a}%`}</span></td><td><span class="pill ${st.cls}">${st.label}</span></td></tr>`;
      }).join("")}</tbody></table></div>`
      : emptyBox("Сурагч бүртгэгдээгүй", "Сурагчид «Сурагч» хуудсаар нэвтэрч ангиа сонгоход энд харагдана.");

    const acts = [
      ...data.submissions.map((s) => {
        const st = data.students.find((x) => x.id === s.studentId);
        const as = data.assignments.find((x) => x.id === s.assignmentId);
        return { at: s.at, icon: as && as.kind === "exam" ? "🧪" : "📝", text: `${st ? st.name : "Сурагч"} «${as ? as.title : "даалгавар"}»-ыг ${s.percent}% гүйцэтгэлээр илгээлээ.` };
      }),
      ...data.attempts.map((a) => {
        const st = data.students.find((x) => x.id === a.studentId);
        const kinds = { practice: "дасгал хийлээ", assessment: "оношлогоо өглөө", battle: a.win ? "Battle-д яллаа" : "Battle тоглолоо" };
        return { at: a.at, icon: a.kind === "battle" ? "⚡" : a.kind === "assessment" ? "🎯" : "📚", text: `${st ? st.name : "Сурагч"} ${kinds[a.kind] || "идэвхтэй байлаа"}${a.kind === "battle" ? "" : ` · ${a.percent}%`}` };
      }),
    ].sort((x, y) => new Date(y.at) - new Date(x.at)).slice(0, 6);
    const actsHtml = acts.length
      ? `<div class="list">${acts.map((a) => `<div class="item"><div class="item-icon">${a.icon}</div><div class="item-main"><div class="item-title" style="font-weight:600">${esc(a.text)}</div><div class="item-sub">${S.shortDate(a.at)}</div></div></div>`).join("")}</div>`
      : emptyBox("Үйл ажиллагаа алга", "Сурагчид даалгавар хийхэд энд гарна.");

    view.innerHTML = `
      <div class="grid grid-4 mb">${metrics.map((m) => `<div class="card metric"><div class="metric-icon ${m.bg}">${m.icon}</div><div class="metric-value">${m.value}</div><div class="metric-label">${m.label}</div></div>`).join("")}</div>
      <div class="grid grid-2-1 mb">
        <div class="card">
          <div class="card-head"><span>Сурагчдын ахиц (7 хоног)</span>
            <select id="dash-class" class="chip" style="border:1px solid var(--line)" aria-label="Анги сонгох">
              <option value="">Бүх анги</option>${data.classes.map((c) => `<option value="${c.id}" ${ui.dashClassId === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
            </select>
          </div>
          <div class="card-body">${chart}</div>
        </div>
        <div class="card"><div class="card-head"><span>Ангиуд</span><a href="/teacher/classes">Бүгдийг харах →</a></div><div class="card-body list">${classesHtml}</div></div>
      </div>
      <div class="grid grid-2">
        <div class="card"><div class="card-head"><span>Сурагчдын жагсаалт</span><a href="/teacher/grades">Дүн харах →</a></div><div class="card-body" style="padding-top:4px">${studentsHtml}</div></div>
        <div class="grid" style="align-content:start">
          <div class="card"><div class="card-head"><span>Хурдан үйлдэл</span></div><div class="card-body"><div class="quick">
            <a href="/teacher/content"><span>📤</span>Материал оруулах</a>
            <a href="/teacher/assistant?mode=assignment"><span>📝</span>Даалгавар илгээх</a>
            <a href="/teacher/assistant?mode=plan"><span>🗓️</span>Хичээл төлөвлөх</a>
            <a href="/teacher/grades"><span>📋</span>Дүн</a>
          </div></div></div>
          <div class="card"><div class="card-head"><span>Сүүлийн үйл ажиллагаа</span></div><div class="card-body">${actsHtml}</div></div>
        </div>
      </div>`;

    document.getElementById("dash-class").addEventListener("change", (e) => {
      ui.dashClassId = e.target.value;
      renderDashboard();
    });
  }

  /* ---------------- Classes ---------------- */
  function renderClasses() {
    const data = S.load();
    if (ui.classDetailId && !classById(data, ui.classDetailId)) ui.classDetailId = null;
    if (!ui.classDetailId && data.classes.length) ui.classDetailId = data.classes[0].id;
    const cls = classById(data, ui.classDetailId);

    const list = data.classes.length
      ? data.classes.map((c) => {
        const n = studentsOfClass(data, c.id).length;
        return `<button type="button" class="item ${c.id === ui.classDetailId ? "active" : ""}" data-pick="${c.id}" style="${c.id === ui.classDetailId ? "border-color:var(--primary);background:var(--primary-soft)" : ""}"><div class="item-icon">🏫</div><div class="item-main"><div class="item-title">${esc(c.name)}</div><div class="item-sub">${c.grade}-р анги · ${n} сурагч</div></div></button>`;
      }).join("")
      : emptyBox("Анги алга", "Зүүн талын маягтаар эхний ангиа үүсгэнэ үү.");

    let detail = emptyBox("Анги сонгоогүй", "Анги үүсгэсний дараа энд сурагчид харагдана.");
    if (cls) {
      const studs = studentsOfClass(data, cls.id);
      const rows = studs.map((s) => {
        const a = studentAvg(data, s.id);
        const st = statusOf(data, s);
        const diag = data.attempts.filter((x) => x.studentId === s.id && x.kind === "assessment").sort((x, y) => new Date(y.at) - new Date(x.at))[0];
        const wins = data.attempts.filter((x) => x.studentId === s.id && x.kind === "battle" && x.win).length;
        return `<tr><td><div class="who"><span class="avatar sm purple">${esc(S.initials(s.name))}</span>${esc(s.name)}</div></td><td class="num"><span class="pill ${S.scoreClass(a)}">${a == null ? "—" : `${a}%`}</span></td><td class="num">${diag ? `${diag.percent}% · ${diag.placement}-р анги` : "—"}</td><td class="num">${wins}</td><td class="num">${s.xp || 0}</td><td><span class="pill ${st.cls}">${st.label}</span></td><td class="num"><button type="button" class="btn btn-danger btn-sm" data-remove-student="${s.id}">Хасах</button></td></tr>`;
      }).join("");
      detail = `
        <div class="card-head"><span>${esc(cls.name)} · ${cls.grade}-р анги</span><button type="button" class="btn btn-danger btn-sm" id="delete-class">Анги устгах</button></div>
        <div class="card-body">
          <form id="add-student" class="actions" style="margin-bottom:14px" novalidate>
            <label class="field" style="flex:1;min-width:200px"><span class="sr-only">Сурагчийн нэр</span><input name="name" maxlength="40" placeholder="Сурагчийн нэр (жишээ: Бат-Эрдэнэ Г.)"></label>
            <button class="btn" type="submit">Сурагч нэмэх</button>
          </form>
          <p class="error" id="student-error" role="alert"></p>
          ${studs.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Сурагч</th><th class="num">Дундаж</th><th class="num">Оношлогоо</th><th class="num">Battle ялалт</th><th class="num">XP</th><th>Статус</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyBox("Энэ ангид сурагч алга", "Дээрээс нэр нэмэх эсвэл сурагч «Сурагч» хуудсаар нэвтрэхдээ энэ ангийг сонгоно.")}
        </div>`;
    }

    view.innerHTML = `
      <div class="grid grid-1-2">
        <div class="grid" style="align-content:start">
          <div class="card"><div class="card-head">Шинэ анги</div><div class="card-body">
            <form id="class-form" class="form" novalidate>
              <label class="field">Ангийн нэр<input name="name" maxlength="10" placeholder="Жишээ: 7А"></label>
              <label class="field">Анги<select name="grade">${Q.gradeOptions(7)}</select></label>
              <button class="btn" type="submit">Анги үүсгэх</button>
              <p class="error" id="class-error" role="alert"></p>
            </form>
          </div></div>
          <div class="card"><div class="card-head">Ангиуд (${data.classes.length})</div><div class="card-body list">${list}</div></div>
        </div>
        <div class="card" style="align-self:start">${detail}</div>
      </div>`;

    document.getElementById("class-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const name = String(f.get("name") || "").trim();
      const grade = Number(f.get("grade"));
      const err = document.getElementById("class-error");
      if (!name) { err.textContent = "Ангийн нэрээ оруулна уу."; return; }
      const exists = S.load().classes.some((c) => c.name.toLocaleLowerCase("mn") === name.toLocaleLowerCase("mn"));
      if (exists) { err.textContent = `«${name}» нэртэй анги аль хэдийн байна.`; return; }
      const id = S.uid("c");
      S.update((d) => d.classes.push({ id, name, grade, createdAt: new Date().toISOString() }));
      ui.classDetailId = id;
      S.toast(`${name} анги үүслээ`);
      renderClasses();
    });
    view.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => { ui.classDetailId = b.dataset.pick; renderClasses(); }));
    const addForm = document.getElementById("add-student");
    if (addForm) {
      addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = String(new FormData(e.currentTarget).get("name") || "").trim();
        const err = document.getElementById("student-error");
        if (!name) { err.textContent = "Сурагчийн нэрээ оруулна уу."; return; }
        const d0 = S.load();
        if (studentsOfClass(d0, cls.id).some((s) => s.name.toLocaleLowerCase("mn") === name.toLocaleLowerCase("mn"))) { err.textContent = "Энэ нэртэй сурагч ангид байна."; return; }
        S.update((d) => d.students.push({ id: S.uid("s"), name, grade: cls.grade, classId: cls.id, xp: 0, createdAt: new Date().toISOString() }));
        S.toast(`${name} нэмэгдлээ`);
        renderClasses();
      });
    }
    const del = document.getElementById("delete-class");
    if (del) {
      del.addEventListener("click", () => {
        if (!confirm(`«${cls.name}» ангийг устгах уу? Ангийн даалгаврууд устана. Сурагчид ангигүй үлдэнэ.`)) return;
        S.update((d) => {
          const removed = new Set(d.assignments.filter((a) => a.classId === cls.id).map((a) => a.id));
          d.classes = d.classes.filter((c) => c.id !== cls.id);
          d.assignments = d.assignments.filter((a) => a.classId !== cls.id);
          d.submissions = d.submissions.filter((s) => !removed.has(s.assignmentId));
          d.materials = d.materials.filter((m) => m.classId !== cls.id);
          d.students.forEach((s) => { if (s.classId === cls.id) s.classId = null; });
        });
        ui.classDetailId = null;
        S.toast("Анги устгагдлаа");
        renderClasses();
      });
    }
    view.querySelectorAll("[data-remove-student]").forEach((b) => b.addEventListener("click", () => {
      const d0 = S.load();
      const st = d0.students.find((s) => s.id === b.dataset.removeStudent);
      if (!st || !confirm(`${st.name}-ийг ангиас хасах уу?`)) return;
      S.update((d) => { const x = d.students.find((s) => s.id === st.id); if (x) x.classId = null; });
      renderClasses();
    }));
  }

  /* ---------------- Content ---------------- */
  function renderContent() {
    const data = S.load();
    const grade = ui.contentGrade;
    const classes = data.classes.filter((c) => c.grade === grade);
    const materials = [...data.materials].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
    const list = materials.length
      ? materials.map((m) => {
        const cls = classById(data, m.classId);
        return `<div class="material"><div class="actions" style="justify-content:space-between"><div><div class="item-title">${esc(m.title)}</div><div class="item-sub">${m.grade}-р анги · ${esc(B.topicTitle(m.topicKey))} · ${cls ? esc(cls.name) : "Бүх анги"} · ${S.shortDate(m.createdAt)}</div></div><button type="button" class="btn btn-danger btn-sm" data-del-material="${m.id}">Устгах</button></div><div class="material-body">${esc(m.body.length > 240 ? `${m.body.slice(0, 240)}…` : m.body)}</div>${m.link ? `<div style="margin-top:6px"><a href="${esc(m.link)}" target="_blank" rel="noopener">🔗 Холбоос</a></div>` : ""}</div>`;
      }).join("")
      : emptyBox("Нийтэлсэн материал алга", "Нийтэлсэн материал сурагчийн «Хичээл» хэсэгт тухайн сэдвийн доор гарна.");

    view.innerHTML = `
      <div class="grid grid-2">
        <div class="card" style="align-self:start"><div class="card-head">Шинэ материал</div><div class="card-body">
          <form id="material-form" class="form" novalidate>
            <label class="field">Гарчиг<input name="title" maxlength="120" placeholder="Жишээ: Бутархайг нэмэх дүрэм"></label>
            <div class="form-row">
              <label class="field">Анги<select name="grade" id="m-grade">${Q.gradeOptions(grade)}</select></label>
              <label class="field">Хүлээн авагч<select name="classId"><option value="">${grade}-р ангийн бүх бүлэг</option>${classes.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label>
            </div>
            <label class="field">Хөтөлбөрийн сэдэв<select name="topicKey">${Q.topicOptions(grade)}</select></label>
            <label class="field">Агуулга<textarea name="body" rows="7" placeholder="Тайлбар, жишээ, томьёо…"></textarea></label>
            <label class="field">Видео / холбоос <span class="hint">заавал биш, https://…</span><input name="link" placeholder="https://www.youtube.com/…"></label>
            <div class="actions"><button class="btn" type="submit">📤 Нийтлэх</button></div>
            <p class="error" id="material-error" role="alert"></p>
          </form>
        </div></div>
        <div class="card"><div class="card-head">Нийтэлсэн материал (${materials.length})</div><div class="card-body">${list}</div></div>
      </div>`;

    document.getElementById("m-grade").addEventListener("change", (e) => { ui.contentGrade = Number(e.target.value); renderContent(); });
    document.getElementById("material-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const title = String(f.get("title") || "").trim();
      const body = String(f.get("body") || "").trim();
      const link = String(f.get("link") || "").trim();
      const err = document.getElementById("material-error");
      if (!title) { err.textContent = "Гарчгаа оруулна уу."; return; }
      if (body.length < 10) { err.textContent = "Агуулга хамгийн багадаа 10 тэмдэгт байна."; return; }
      if (link && !/^https?:\/\/\S+$/i.test(link)) { err.textContent = "Холбоос http:// эсвэл https://-ээр эхэлнэ."; return; }
      S.update((d) => d.materials.push({ id: S.uid("m"), title, body, link, grade: Number(f.get("grade")), topicKey: String(f.get("topicKey")), classId: String(f.get("classId") || "") || null, createdAt: new Date().toISOString() }));
      S.toast("Материал нийтлэгдлээ");
      renderContent();
    });
    view.querySelectorAll("[data-del-material]").forEach((b) => b.addEventListener("click", () => {
      if (!confirm("Энэ материалыг устгах уу?")) return;
      S.update((d) => { d.materials = d.materials.filter((m) => m.id !== b.dataset.delMaterial); });
      renderContent();
    }));
  }

  /* ---------------- Assistant ---------------- */
  function splitMinutes(total) {
    const intro = Math.max(5, Math.round(total * 0.15));
    const close = Math.max(5, Math.round(total * 0.1));
    const teach = Math.max(10, Math.round(total * 0.35));
    return { intro, teach, practice: total - intro - teach - close, close };
  }

  function buildPlan(grade, topicKey, minutes) {
    const topic = B.topicsOf(grade).find((t) => t.key === topicKey);
    const parts = splitMinutes(minutes);
    const units = B.unitsFor(topicKey).filter((u) => u.theory);
    const samples = B.buildQuestions({ grade, topicKey, count: 3 });
    const objectives = topic.objectives.slice(0, 4);
    return `
      <div class="actions no-print" style="justify-content:flex-end;margin-bottom:10px"><button type="button" class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Хэвлэх</button></div>
      <h2 style="font-size:20px">${esc(B.niceTitle(topic.title))}</h2>
      <p class="item-sub" style="margin:4px 0 14px">${grade}-р анги · Математик · ${minutes} минут · Үндсэн түвшин: ${esc(topic.level)}</p>
      <h3 style="font-size:15px;margin-bottom:6px">Суралцахуйн зорилт (хөтөлбөрөөс)</h3>
      <ul class="objectives">${objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
      ${units.length ? `<h3 style="font-size:15px;margin:16px 0 8px">Гол ойлголт</h3>${units.map((u) => `<div class="theory"><strong>${esc(u.name)}</strong>${esc(u.theory)}</div>`).join("")}` : ""}
      <h3 style="font-size:15px;margin:16px 0 4px">Хичээлийн явц</h3>
      <div class="plan-stage"><strong>${parts.intro} мин</strong><span><b>Сэргээх.</b> Өмнөх хичээлтэй холбоотой 2 богино асуулт, самбар дээр хамтдаа шалгана.</span></div>
      <div class="plan-stage"><strong>${parts.teach} мин</strong><span><b>Шинэ мэдлэг.</b> Зорилтын эхний заалтыг тайлбарлаж, доорх жишээ бодлогын нэгийг самбарт алхам алхмаар бодно.</span></div>
      <div class="plan-stage"><strong>${parts.practice} мин</strong><span><b>Дасгал.</b> Хосоороо жишээ бодлогууд, дараа нь бие даан. Багш ширээ тойрч түгээмэл алдааг засна.</span></div>
      <div class="plan-stage"><strong>${parts.close} мин</strong><span><b>Дүгнэлт.</b> Сурагч дүрмээ нэг өгүүлбэрээр хэлнэ. Гарах үнэлгээ: 1 богино бодлого.</span></div>
      <h3 style="font-size:15px;margin:16px 0 8px">Жишээ бодлого (хариутай)</h3>
      ${Q.previewList(samples, true)}
      <p style="margin-top:14px"><b>Гэрийн даалгавар.</b> Энэ сэдвээр 5 бодлого — «Туслах → Даалгавар» хэсгээс ангид шууд илгээж болно.</p>`;
  }

  function renderAssistant() {
    const data = S.load();
    const meta = MODE_META[ui.mode];
    const seg = Object.entries(MODE_META).map(([k, m]) => `<button type="button" data-set-mode="${k}" class="${ui.mode === k ? "active" : ""}"><span style="font-size:22px">${m.icon}</span><span>${m.label}<small>${m.sub}</small></span></button>`).join("");

    let form = "";
    let result = "";
    if (ui.mode === "plan") {
      form = `
        <form id="assist-form" class="form" novalidate>
          <div class="form-row">
            <label class="field">Анги<select name="grade" id="a-grade">${Q.gradeOptions(ui.planGrade)}</select></label>
            <label class="field">Хугацаа<select name="minutes"><option value="40">40 минут</option><option value="45" selected>45 минут</option><option value="80">80 минут</option><option value="90">90 минут</option></select></label>
          </div>
          <label class="field">Хөтөлбөрийн сэдэв<select name="topicKey">${Q.topicOptions(ui.planGrade)}</select></label>
          <button class="btn ${meta.btn}" type="submit">${meta.action}</button>
        </form>`;
      result = ui.planHtml || emptyBox("Төлөвлөгөө хараахан гараагүй", "Анги, сэдвээ сонгоод товчийг дарна уу. Зорилтууд нь ЕБС-ийн хөтөлбөрөөс авагдана.");
    } else {
      if (!data.classes.length) {
        form = emptyBox("Анги алга", "Даалгавар илгээхийн өмнө анги үүсгэнэ үү.", `<a class="btn btn-sm" href="/teacher/classes">Анги үүсгэх</a>`);
      } else {
        const selClass = classById(data, ui.draft?.classId) || data.classes[0];
        const isExam = ui.mode === "exam";
        form = `
          <form id="assist-form" class="form" novalidate>
            <label class="field">Анги<select name="classId" id="a-class">${data.classes.map((c) => `<option value="${c.id}" ${c.id === selClass.id ? "selected" : ""}>${esc(c.name)} (${c.grade}-р анги)</option>`).join("")}</select></label>
            <label class="field">Сэдэв<select name="topicKey">${Q.topicOptions(selClass.grade, ui.draft?.topicKey || "", true)}</select></label>
            <div class="form-row">
              <label class="field">Асуултын тоо<select name="count">${(isExam ? [10, 15, 20] : [5, 10, 15]).map((n) => `<option ${n === (isExam ? 15 : 10) ? "selected" : ""}>${n}</option>`).join("")}</select></label>
              ${isExam ? `<label class="field">Хугацаа<select name="minutes">${[20, 30, 40, 45].map((n) => `<option value="${n}" ${n === 40 ? "selected" : ""}>${n} минут</option>`).join("")}</select></label>` : ""}
              <label class="field">Дуусах огноо<input type="date" name="due" value="${todayIso(isExam ? 1 : 3)}" min="${todayIso(0)}"></label>
            </div>
            <label class="field">Гарчиг <span class="hint">хоосон бол сэдвээр нэрлэнэ</span><input name="title" maxlength="80" placeholder="${isExam ? "Жишээ: I улирлын шалгалт" : "Жишээ: Гэрийн даалгавар №3"}"></label>
            <button class="btn ${meta.btn}" type="submit">${meta.action}</button>
            <p class="error" id="assist-error" role="alert"></p>
          </form>`;
      }
      if (ui.draft && ui.draft.kind === ui.mode) {
        const d = ui.draft;
        const cls = classById(data, d.classId);
        result = `
          <div class="actions no-print" style="justify-content:space-between;margin-bottom:12px">
            <div><div class="item-title">${esc(d.title)}</div><div class="item-sub">${cls ? esc(cls.name) : ""} · ${d.questions.length} асуулт${d.minutes ? ` · ${d.minutes} минут` : ""} · Дуусах: ${esc(d.due || "—")}</div></div>
            <div class="actions">
              <label class="actions" style="font-size:13px;font-weight:700"><input type="checkbox" id="toggle-ans" ${ui.showAnswers ? "checked" : ""}> Хариу харуулах</label>
              <button type="button" class="btn btn-ghost btn-sm" id="regen">🔄 Дахин үүсгэх</button>
              <button type="button" class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Хэвлэх</button>
              <button type="button" class="btn btn-sm" id="send">📤 Ангид илгээх</button>
            </div>
          </div>
          ${Q.previewList(d.questions, ui.showAnswers)}`;
      } else {
        result = emptyBox("Урьдчилан харах хэсэг", "Тохиргоогоо сонгоод үүсгэнэ үү. Асуултууд 6–9-р ангийн бодлогын сан болон хөтөлбөрийн сэдвээр бүрдэнэ.");
      }
    }

    const sent = [...data.assignments].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
    const sentHtml = sent.length
      ? `<div class="table-wrap"><table class="table"><thead><tr><th>Гарчиг</th><th>Төрөл</th><th>Анги</th><th>Дуусах</th><th class="num">Илгээсэн</th><th></th></tr></thead><tbody>${sent.map((a) => {
        const cls = classById(data, a.classId);
        const n = data.submissions.filter((s) => s.assignmentId === a.id).length;
        const total = cls ? studentsOfClass(data, cls.id).length : 0;
        const due = S.dueLabel(a.due);
        return `<tr><td><b>${esc(a.title)}</b><div class="item-sub">${a.questions.length} асуулт</div></td><td><span class="pill ${a.kind === "exam" ? "pill-yellow" : "pill-green"}">${a.kind === "exam" ? "Шалгалт" : "Даалгавар"}</span></td><td>${cls ? esc(cls.name) : "—"}</td><td><span class="pill ${due.overdue ? "pill-muted" : due.urgent ? "pill-red" : "pill-blue"}">${due.label}</span></td><td class="num">${n} / ${total}</td><td class="num"><button type="button" class="btn btn-danger btn-sm" data-del-assign="${a.id}">Устгах</button></td></tr>`;
      }).join("")}</tbody></table></div>`
      : emptyBox("Илгээсэн даалгавар алга", "Үүсгэсэн даалгавар, шалгалтаа «Ангид илгээх» товчоор илгээнэ.");

    view.innerHTML = `
      <div class="seg" role="tablist">${seg}</div>
      <div class="grid grid-1-2 mb">
        <div class="card" style="align-self:start"><div class="card-head">${meta.label} — тохиргоо</div><div class="card-body">${form}</div></div>
        <div class="card"><div class="card-head">${ui.mode === "plan" ? "Ээлжит хичээлийн төлөвлөлт" : ui.mode === "exam" ? "Үүсгэсэн шалгалт" : "Үүсгэсэн даалгавар"}</div><div class="card-body">${result}</div></div>
      </div>
      <div class="card no-print"><div class="card-head">Илгээсэн даалгавар, шалгалт</div><div class="card-body" style="padding-top:4px">${sentHtml}</div></div>`;

    view.querySelectorAll("[data-set-mode]").forEach((b) => b.addEventListener("click", () => { ui.mode = b.dataset.setMode; renderAssistant(); }));
    const aGrade = document.getElementById("a-grade");
    if (aGrade) aGrade.addEventListener("change", (e) => { ui.planGrade = Number(e.target.value); ui.planHtml = ""; renderAssistant(); });
    const aClass = document.getElementById("a-class");
    if (aClass) aClass.addEventListener("change", (e) => { ui.draft = { kind: "none", classId: e.target.value }; renderAssistant(); });
    const form0 = document.getElementById("assist-form");
    if (form0) form0.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      if (ui.mode === "plan") {
        ui.planHtml = buildPlan(Number(f.get("grade")), String(f.get("topicKey")), Number(f.get("minutes")));
        renderAssistant();
        return;
      }
      const d0 = S.load();
      const cls = classById(d0, String(f.get("classId")));
      const err = document.getElementById("assist-error");
      if (!cls) { err.textContent = "Анги сонгоно уу."; return; }
      const due = String(f.get("due") || "");
      if (due && due < todayIso(0)) { err.textContent = "Дуусах огноо өнөөдрөөс өмнө байж болохгүй."; return; }
      const topicKey = String(f.get("topicKey") || "") || null;
      const count = Number(f.get("count"));
      const title = String(f.get("title") || "").trim() || `${topicKey ? B.topicTitle(topicKey) : "Холимог сэдэв"} — ${ui.mode === "exam" ? "шалгалт" : "даалгавар"}`;
      ui.draft = {
        kind: ui.mode,
        classId: cls.id,
        topicKey,
        count,
        due,
        minutes: ui.mode === "exam" ? Number(f.get("minutes")) : null,
        title,
        questions: B.buildQuestions({ grade: cls.grade, topicKey, count }),
      };
      renderAssistant();
    });
    const toggle = document.getElementById("toggle-ans");
    if (toggle) toggle.addEventListener("change", (e) => { ui.showAnswers = e.target.checked; renderAssistant(); });
    const regen = document.getElementById("regen");
    if (regen) regen.addEventListener("click", () => {
      const cls = classById(S.load(), ui.draft.classId);
      ui.draft.questions = B.buildQuestions({ grade: cls.grade, topicKey: ui.draft.topicKey, count: ui.draft.count });
      renderAssistant();
    });
    const send = document.getElementById("send");
    if (send) send.addEventListener("click", () => {
      const d = ui.draft;
      const cls = classById(S.load(), d.classId);
      if (!cls) { S.toast("Анги олдсонгүй", "error"); return; }
      S.update((data2) => data2.assignments.push({ id: S.uid("a"), kind: d.kind, title: d.title, grade: cls.grade, topicKey: d.topicKey, classId: cls.id, due: d.due || null, minutes: d.minutes, questions: d.questions, createdAt: new Date().toISOString() }));
      S.toast(`${cls.name} ангид илгээлээ`);
      ui.draft = null;
      renderAssistant();
    });
    view.querySelectorAll("[data-del-assign]").forEach((b) => b.addEventListener("click", () => {
      if (!confirm("Энэ даалгаврыг устгах уу? Сурагчдын илгээсэн хариулт мөн устна.")) return;
      S.update((d) => {
        d.assignments = d.assignments.filter((a) => a.id !== b.dataset.delAssign);
        d.submissions = d.submissions.filter((s) => s.assignmentId !== b.dataset.delAssign);
      });
      renderAssistant();
    }));
  }

  /* ---------------- Grades ---------------- */
  function gradeMatrix(data, cls) {
    const studs = studentsOfClass(data, cls.id);
    const assigns = data.assignments.filter((a) => a.classId === cls.id).sort((x, y) => new Date(x.createdAt) - new Date(y.createdAt));
    const rows = studs.map((s) => {
      const cells = assigns.map((a) => {
        const sub = data.submissions.filter((x) => x.assignmentId === a.id && x.studentId === s.id).sort((x, y) => new Date(y.at) - new Date(x.at))[0];
        return sub ? sub.percent : null;
      });
      const practice = S.avg(data.attempts.filter((x) => x.studentId === s.id && x.kind === "practice").map((x) => x.percent));
      const diag = data.attempts.filter((x) => x.studentId === s.id && x.kind === "assessment").sort((x, y) => new Date(y.at) - new Date(x.at))[0];
      return { s, cells, avg: S.avg(cells), practice, diag };
    });
    return { studs, assigns, rows };
  }

  function renderGrades() {
    const data = S.load();
    if (!data.classes.length) {
      view.innerHTML = `<div class="card"><div class="card-body">${emptyBox("Анги алга", "Дүн харахын тулд анги үүсгэж, даалгавар илгээнэ үү.", `<a class="btn btn-sm" href="/teacher/classes">Анги үүсгэх</a>`)}</div></div>`;
      return;
    }
    if (!classById(data, ui.gradeClassId)) ui.gradeClassId = data.classes[0].id;
    const cls = classById(data, ui.gradeClassId);
    const { studs, assigns, rows } = gradeMatrix(data, cls);
    let table;
    if (!studs.length) {
      table = emptyBox("Энэ ангид сурагч алга", "«Ангиуд» хэсгээс сурагч нэмнэ үү.");
    } else {
      const colAvg = assigns.map((_, i) => S.avg(rows.map((r) => r.cells[i])));
      table = `<div class="table-wrap"><table class="table"><thead><tr><th>Сурагч</th>${assigns.map((a) => `<th class="num" title="${esc(a.title)}">${a.kind === "exam" ? "🧪" : "📝"} ${esc(a.title.length > 16 ? `${a.title.slice(0, 16)}…` : a.title)}</th>`).join("")}<th class="num">Дундаж</th><th class="num">Дасгал</th><th class="num">Оношлогоо</th></tr></thead><tbody>
        ${rows.map((r) => `<tr><td><div class="who"><span class="avatar sm purple">${esc(S.initials(r.s.name))}</span>${esc(r.s.name)}</div></td>${r.cells.map((c) => `<td class="num"><span class="pill ${S.scoreClass(c)}">${c == null ? "—" : `${c}%`}</span></td>`).join("")}<td class="num"><b>${r.avg == null ? "—" : `${r.avg}%`}</b></td><td class="num">${r.practice == null ? "—" : `${r.practice}%`}</td><td class="num">${r.diag ? `${r.diag.percent}%` : "—"}</td></tr>`).join("")}
        <tr><td><b>Ангийн дундаж</b></td>${colAvg.map((c) => `<td class="num"><b>${c == null ? "—" : `${c}%`}</b></td>`).join("")}<td class="num"><b>${S.avg(rows.map((r) => r.avg)) ?? "—"}${S.avg(rows.map((r) => r.avg)) == null ? "" : "%"}</b></td><td></td><td></td></tr>
      </tbody></table></div>
      ${assigns.length ? "" : `<p class="hint" style="margin-top:10px">Энэ ангид даалгавар илгээгээгүй байна. «Туслах» хэсгээс илгээнэ үү.</p>`}`;
    }
    view.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="actions"><span>Ангийн дүн</span>
            <select id="g-class" class="chip" style="border:1px solid var(--line)" aria-label="Анги">${data.classes.map((c) => `<option value="${c.id}" ${c.id === cls.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
          </div>
          <div class="actions no-print">
            <button type="button" class="btn btn-ghost btn-sm" id="csv" ${studs.length ? "" : "disabled"}>⬇️ CSV татах</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Хэвлэх</button>
          </div>
        </div>
        <div class="card-body">${table}</div>
      </div>`;
    document.getElementById("g-class").addEventListener("change", (e) => { ui.gradeClassId = e.target.value; renderGrades(); });
    document.getElementById("csv").addEventListener("click", () => {
      const head = ["Сурагч", ...assigns.map((a) => a.title), "Дундаж", "Дасгал", "Оношлогоо"];
      const lines = [head, ...rows.map((r) => [r.s.name, ...r.cells.map((c) => (c == null ? "" : c)), r.avg ?? "", r.practice ?? "", r.diag ? r.diag.percent : ""])];
      const csv = lines.map((l) => l.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\r\n");
      const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${cls.name}-dun.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  /* ---------------- Router ---------------- */
  const RENDER = { dashboard: renderDashboard, classes: renderClasses, content: renderContent, assistant: renderAssistant, grades: renderGrades };

  function render() {
    renderChrome();
    RENDER[currentView()]();
    document.getElementById("shell").classList.remove("nav-open");
  }

  document.getElementById("menu-btn").addEventListener("click", () => document.getElementById("shell").classList.toggle("nav-open"));
  document.getElementById("rename-teacher").addEventListener("click", () => {
    const cur = S.load().teacherName;
    const name = prompt("Багшийн нэр:", cur);
    if (name == null) return;
    const trimmed = name.trim();
    if (!trimmed) { S.toast("Нэр хоосон байж болохгүй", "error"); return; }
    S.update((d) => { d.teacherName = trimmed.slice(0, 40); });
    renderChrome();
  });
  S.onExternalChange(() => { if (currentView() !== "assistant") render(); });

  async function boot() {
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

  boot();
})();
