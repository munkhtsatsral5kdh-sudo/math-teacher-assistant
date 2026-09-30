# Turn MATH PROJECT task_*.xlsx into public/js/mpbank.js
import json
import re
from pathlib import Path

import openpyxl

SRC = Path(r"D:\math_project")
OUT = Path(r"D:\math-teacher-assistant\public\js\mpbank.js")

NAMES = {
    1: "Нэгж 1. Тоон олонлог, язгуур",
    2: "Нэгж 2. Процент, хувь",
    3: "Нэгж 3. Алгебрын илэрхийлэл",
    4: "Нэгж 4. Дараалал, функц",
    5: "Нэгж 5. Гурвалжин",
    6: "Нэгж 6. Өнцөг",
    7: "Нэгж 7. Талбай, хэмжигдэхүүн",
    8: "Нэгж 8. Магадлал",
}
TOPICS = {
    1: ["9-0", "9-1"],
    2: ["9-2"],
    3: ["9-3"],
    4: ["9-4"],
    5: ["9-5"],
    6: ["9-6"],
    7: ["9-7"],
    8: ["9-8", "9-9"],
}
LEVEL_ORDER = ["Мэдлэг, ойлголт", "Чадвар", "Хэрэглээ"]
SUP = str.maketrans("0123456789+-=()", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾")


def latex(src: str) -> str:
    s = src or ""
    s = s.replace("\xa0", " ")
    s = re.sub(r"\\mathbb\{([A-Z])\}", lambda m: {"N": "ℕ", "Z": "ℤ", "Q": "ℚ", "R": "ℝ", "I": "𝕀"}.get(m.group(1), m.group(1)), s)
    s = s.replace(r"\left", "").replace(r"\right", "")
    s = re.sub(r"\\text\{([^{}]*)\}", r"\1", s)
    s = s.replace(r"\times", "×").replace(r"\div", "÷").replace(r"\cdot", "·")
    s = s.replace(r"\pm", "±").replace(r"\leq", "≤").replace(r"\geq", "≥").replace(r"\neq", "≠")
    s = s.replace(r"\approx", "≈").replace(r"\infty", "∞").replace(r"\pi", "π")
    s = s.replace(r"\angle", "∠").replace(r"\triangle", "△")
    s = s.replace(r"\sin", "sin").replace(r"\cos", "cos").replace(r"\tan", "tan")
    s = s.replace(r"\dots", "…").replace(r"\ldots", "…")
    s = s.replace(r"^{\circ}", "°").replace(r"^\circ", "°").replace(r"\circ", "°")
    s = s.replace(r"\%", "%")
    for _ in range(6):
        n = re.sub(r"\\sqrt\{([^{}]+)\}", r"√(\1)", s)
        n = re.sub(r"\\frac\{([^{}]+)\}\{([^{}]+)\}", r"(\1)/(\2)", n)
        n = re.sub(r"\^\{([^{}]+)\}", lambda m: m.group(1).translate(SUP), n)
        if n == s:
            break
        s = n
    s = s.replace("^°", "°")
    s = s.replace("$", "")
    s = re.sub(r"\\[a-zA-Z]+", "", s)
    s = s.replace("{", "").replace("}", "")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def split_q(raw: str):
    text = latex(raw)
    text = re.sub(r"(?<=\S)([ABCD])\.", r" \1.", text)
    parts = re.split(r"(?:^|\s)([ABCD])\.\s*", text)
    stem = parts[0].strip(" .")
    options = []
    i = 1
    while i + 1 < len(parts):
        options.append({"letter": parts[i], "text": parts[i + 1].strip(" .")})
        i += 2
    return stem, options


def level_name(raw: str) -> str:
    s = (raw or "").replace("\xa0", " ").strip()
    if "Хэрэглээ" in s:
        return "Хэрэглээ"
    if "Чадвар" in s:
        return "Чадвар"
    return "Мэдлэг, ойлголт"


def main():
    units = []
    bad = 0
    for n in range(1, 9):
        buckets = {name: [] for name in LEVEL_ORDER}
        for k in range(1, 4):
            name = LEVEL_ORDER[k - 1]
            wb = openpyxl.load_workbook(SRC / f"task_{n}_{k}.xlsx", data_only=True)
            ws = wb.active
            for row in ws.iter_rows(min_row=2, values_only=True):
                if not row or not row[0] or not str(row[0]).strip():
                    continue
                stem, options = split_q(str(row[0]))
                ans = str(row[1] or "").replace("\xa0", " ").strip().upper()[:1]
                if ans not in "ABCD" or len(options) != 4:
                    bad += 1
                buckets[name].append({
                    "text": stem,
                    "options": options,
                    "correct": ans if ans in "ABCD" else "",
                })
        # ids collided because level_name called twice with growing list. Fix below by rewriting ids.
        levels = []
        for name in LEVEL_ORDER:
            probs = buckets[name]
            for i, p in enumerate(probs, 1):
                p["id"] = f"u{n}-{name[:1]}-{i}"
            levels.append({"name": name, "problems": probs})
        units.append({"id": n, "name": NAMES[n], "topics": TOPICS[n], "levels": levels})
    data = {"grade": 9, "units": units}
    OUT.write_text("window.MP = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    total = sum(len(lv["problems"]) for u in units for lv in u["levels"])
    print("problems", total, "bad", bad, "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
