(function () {
  const { escapeHtml } = window.Store;
  const KEYS = ["A", "B", "C", "D"];
  const LEVEL_PILL = { 1: "pill-blue", 2: "pill-purple", 3: "pill-yellow" };

  function questionCard(q, index, opts = {}) {
    const { picked = null, reveal = false, total = null, clickable = true, showMeta = true } = opts;
    const optionsHtml = q.options.map((o, i) => {
      let cls = "opt";
      if (reveal) {
        if (i === q.answer) cls += " correct";
        else if (i === picked) cls += " wrong";
      } else if (i === picked) {
        cls += " picked";
      }
      const disabled = reveal || !clickable ? "disabled" : "";
      return `<button type="button" class="${cls}" data-q="${index}" data-opt="${i}" ${disabled}><span class="key">${KEYS[i]}</span><span>${escapeHtml(o)}</span></button>`;
    }).join("");
    const meta = showMeta
      ? `<div class="q-head"><span>${total ? `${index + 1} / ${total}` : `${index + 1}.`} · ${escapeHtml(window.MathBank.topicTitle(q.topicKey))}</span><span class="pill ${LEVEL_PILL[q.level] || "pill-muted"}">${window.MathBank.LEVEL_NAMES[q.level] || ""}</span></div>`
      : "";
    const solution = reveal && q.solution
      ? `<div class="solution">${picked === q.answer ? "<b>Зөв!</b> " : picked == null ? "Хариулаагүй. " : `Зөв хариу: <b>${escapeHtml(q.options[q.answer])}</b>. `}${escapeHtml(q.solution)}</div>`
      : "";
    return `<div class="q" id="q-${index}">${meta}<div class="q-text">${escapeHtml(q.text)}</div><div class="opts">${optionsHtml}</div>${solution}</div>`;
  }

  function previewList(questions, showAnswers) {
    if (!questions.length) return `<div class="empty"><strong>Асуулт алга</strong>Тохиргоогоо сонгоод үүсгэнэ үү.</div>`;
    return questions.map((q, i) => {
      const opts = q.options.map((o, j) => `<li${showAnswers && j === q.answer ? ' style="font-weight:800;color:#15803d"' : ""}>${KEYS[j]}. ${escapeHtml(o)}</li>`).join("");
      return `<div class="q"><div class="q-head"><span>${i + 1}. ${escapeHtml(window.MathBank.topicTitle(q.topicKey))}</span><span class="pill ${LEVEL_PILL[q.level] || "pill-muted"}">${window.MathBank.LEVEL_NAMES[q.level] || ""}</span></div><div class="q-text">${escapeHtml(q.text)}</div><ol style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(2,1fr);gap:4px">${opts}</ol>${showAnswers && q.solution ? `<div class="solution">${escapeHtml(q.solution)}</div>` : ""}</div>`;
    }).join("");
  }

  function gradeOptions(selected) {
    return window.MathBank.GRADES.map((g) => `<option value="${g}" ${Number(selected) === g ? "selected" : ""}>${g}-р анги</option>`).join("");
  }

  function topicOptions(grade, selected, withAll = false) {
    const all = withAll ? `<option value="">Бүх сэдэв (холимог)</option>` : "";
    const groups = window.MathBank.contentUnits(grade).map((unit) => {
      const opts = unit.topics.map((t) => `<option value="${t.key}" ${selected === t.key ? "selected" : ""}>${escapeHtml(window.MathBank.niceTitle(t.title))}</option>`).join("");
      return `<optgroup label="${escapeHtml(unit.name)}">${opts}</optgroup>`;
    }).join("");
    return all + groups;
  }

  function score(questions, answers) {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct += 1;
    });
    const total = questions.length;
    return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0 };
  }

  window.Quiz = { questionCard, previewList, gradeOptions, topicOptions, score, KEYS };
})();
