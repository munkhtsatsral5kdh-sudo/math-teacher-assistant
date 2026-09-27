# One-off: turn IX_Negj1_90_daalgavar.docx into public/js/ix1.js
import json
import re
import zipfile
from xml.etree import ElementTree as ET

SRC = r"c:\Users\DeLL\Downloads\IX_Negj1_90_daalgavar.docx"
OUT = r"D:\math-teacher-assistant\public\js\ix1.js"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
M = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"
SUP = str.maketrans("0123456789+-=()", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾")


def math(el):
    if el is None:
        return ""
    tag = el.tag.replace(M, "")
    if tag == "t":
        return el.text or ""
    if tag == "rad":
        body = math(el.find(f"{M}e"))
        deg = math(el.find(f"{M}deg")).strip()
        inner = body if len(body) <= 3 else f"({body})"
        return f"{deg.translate(SUP)}√{inner}" if deg else f"√{inner}"
    if tag == "f":
        return f"{math(el.find(f'{M}num'))}/{math(el.find(f'{M}den'))}"
    if tag == "sSup":
        return f"{math(el.find(f'{M}e'))}{math(el.find(f'{M}sup')).translate(SUP)}"
    if tag == "d":
        beg, end = "(", ")"
        pr = el.find(f"{M}dPr")
        if pr is not None:
            b = pr.find(f"{M}begChr")
            en = pr.find(f"{M}endChr")
            if b is not None and b.get(f"{M}val") is not None:
                beg = b.get(f"{M}val") or beg
            if en is not None and en.get(f"{M}val") is not None:
                end = en.get(f"{M}val") or end
        return f"{beg}{math(el.find(f'{M}e'))}{end}"
    return "".join(math(c) for c in el)


def lines_of(xml):
    root = ET.fromstring(xml)
    lines = []
    for p in root.iter(f"{W}p"):
        parts = []
        for child in p:
            if child.tag == f"{W}r":
                for c in child:
                    if c.tag == f"{W}t":
                        parts.append(c.text or "")
                    elif c.tag == f"{W}tab":
                        parts.append("\t")
            elif child.tag in (f"{M}oMath", f"{M}oMathPara"):
                parts.append(math(child))
        line = "".join(parts).strip()
        if line:
            lines.append(line)
    return lines


def split_options(body_lines):
    stem = []
    options = []
    opt_re = re.compile(r"(?:^|\t)\s*([A-D])\.\s*")
    for line in body_lines:
        if opt_re.search(line) and line.lstrip()[:2] in ("A.", "B.", "C.", "D.") or opt_re.match(line):
            bits = opt_re.split(line)
            # split keeps leading text then letter, value, letter, value...
            if bits[0].strip():
                stem.append(bits[0].strip())
            i = 1
            while i + 1 < len(bits):
                options.append({"letter": bits[i], "text": bits[i + 1].strip()})
                i += 2
        else:
            stem.append(line)
    return stem, options


def parse(lines):
    try:
        cut = lines.index("ХАРИУ")
    except ValueError:
        cut = len(lines)
    body, key = lines[:cut], lines[cut + 1 :]
    criteria = []
    cur = None
    level = None
    problem = None

    def push_problem():
        nonlocal problem
        if problem and cur and level:
            stem, options = split_options(problem["lines"])
            level["problems"].append({
                "n": problem["n"],
                "text": "\n".join(stem).strip(),
                "options": options,
            })
        problem = None

    for line in body:
        if line.startswith("Шалгуур "):
            push_problem()
            cur = {"name": line, "levels": []}
            criteria.append(cur)
            level = None
            continue
        if line.startswith("Суралцахуйн үр дүнгийн шалгуур"):
            if cur:
                cur["outcome"] = line.split(":", 1)[-1].strip()
            continue
        m = re.match(r"^([IVX]+) түвшин$", line)
        if m:
            push_problem()
            level = {"name": line, "note": "", "problems": []}
            if cur:
                cur["levels"].append(level)
            continue
        m = re.match(r"^(\d{1,2})\.(?!\d)[\t ]+(.*)$", line)
        if m and cur and level:
            push_problem()
            problem = {"n": int(m.group(1)), "lines": []}
            if m.group(2).strip():
                problem["lines"].append(m.group(2).strip())
            continue
        if problem:
            problem["lines"].append(line)
        elif level and not level["problems"] and not re.match(r"^\d+\.", line):
            level["note"] = (level["note"] + " " + line).strip()
    push_problem()

    answers = {}
    n = None
    buf = []

    def save():
        if n is None:
            return
        text = "\n".join(buf).strip()
        wrong = ""
        if "Буруу хариулт:" in text:
            text, wrong = text.split("Буруу хариулт:", 1)
        answers[n] = {"answer": text.strip(), "wrong": wrong.strip()}

    for line in key:
        if line.startswith("Шалгуур "):
            save()
            n = None
            buf = []
            continue
        m = re.match(r"^(\d{1,2})\.(?!\d)[\t ]+(.*)$", line)
        if m:
            save()
            n = int(m.group(1))
            buf = [m.group(2).strip()] if m.group(2).strip() else []
            continue
        if n is not None:
            buf.append(line)
    save()

    for c in criteria:
        for lv in c["levels"]:
            for p in lv["problems"]:
                a = answers.get(p["n"], {})
                p["answer"] = a.get("answer", "")
                p["wrong"] = a.get("wrong", "")
                if p["options"]:
                    letter = p["answer"].strip()[:1]
                    p["correct"] = letter if letter in "ABCD" else ""
    return criteria


def main():
    xml = zipfile.ZipFile(SRC).read("word/document.xml")
    criteria = parse(lines_of(xml))
    count = sum(len(lv["problems"]) for c in criteria for lv in c["levels"])
    missing = [p["n"] for c in criteria for lv in c["levels"] for p in lv["problems"] if not p["answer"]]
    mcq = sum(1 for c in criteria for lv in c["levels"] for p in lv["problems"] if p["options"])
    data = {
        "grade": 9,
        "title": "Нэгж 1. Тоон олонлог, зэрэг, язгуур, тоог жиших, тоймлох",
        "subtitle": "Шалгуурт суурилсан 90 даалгавар",
        "criteria": criteria,
    }
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("window.IX1 = ")
        f.write(payload)
        f.write(";\n")
    print("problems", count, "mcq", mcq, "missing answers", missing)


if __name__ == "__main__":
    main()
