# 2025 performance-assessment sample tests: 20 variants x 18 questions.
import json
import re
import shutil
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

SRC = Path(r"C:\Users\DeLL\Desktop\Математик_9-р_анги_Хувилбар_1-20.docx")
OUT_JS = Path(r"D:\math-teacher-assistant\public\js\geval.js")
OUT_IMG = Path(r"D:\math-teacher-assistant\public\geval")

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
M = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
REL = "{http://schemas.openxmlformats.org/package/2006/relationships}"

SUP = str.maketrans("0123456789+-=()", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾")
SUB = str.maketrans("0123456789+-=()", "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎")
QSTART = re.compile(r"^(\d{1,2})\.\s*(.*)$")
VARIANT = re.compile(r"Хувилбар\s+(\d+)")


def wrap_frac(s):
    if re.fullmatch(r"[0-9A-Za-z√π°⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉+\-]+", s or "") and not re.search(r"[+\-−]", s or ""):
        return s
    return f"({s})"


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
        return f"{wrap_frac(math(el.find(f'{M}num')))}/{wrap_frac(math(el.find(f'{M}den')))}"
    if tag == "sSup":
        return f"{math(el.find(f'{M}e'))}{math(el.find(f'{M}sup')).translate(SUP)}"
    if tag == "sSub":
        return f"{math(el.find(f'{M}e'))}{math(el.find(f'{M}sub')).translate(SUB)}"
    if tag == "acc":
        base = math(el.find(f"{M}e"))
        pr = el.find(f"{M}accPr")
        chr_el = pr.find(f"{M}chr") if pr is not None else None
        mark = chr_el.get(f"{M}val") if chr_el is not None else "\u0304"
        if mark in ("\u0305", "\u00af", "¯"):
            mark = "\u0304"
        return "".join(ch + mark for ch in base) if base else mark
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
    parts = []
    prev = ""
    for child in el:
        piece = math(child)
        if child.tag.replace(M, "") == "f" and prev[-1:].isdigit():
            piece = " " + piece
        parts.append(piece)
        prev += piece
    return "".join(parts)


def tidy(text):
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" +([,.;:?!%)])", r"\1", text)
    return text.strip()


def relmap(z):
    root = ET.fromstring(z.read("word/_rels/document.xml.rels"))
    return {rel.get("Id"): rel.get("Target") for rel in root if rel.tag == f"{REL}Relationship"}


def blips(el, rels):
    found = []
    for blip in el.iter(f"{A}blip"):
        target = rels.get(blip.get(f"{R}embed") or "")
        if target:
            found.append(target.replace("\\", "/"))
    return found


def para_parts(p, rels):
    parts = []
    images = []
    for child in p:
        if child.tag == f"{W}r":
            for c in child:
                if c.tag == f"{W}t":
                    parts.append(c.text or "")
                elif c.tag == f"{W}tab":
                    parts.append(" ")
                elif c.tag == f"{W}drawing":
                    images.extend(blips(c, rels))
        elif child.tag in (f"{M}oMath", f"{M}oMathPara"):
            parts.append(math(child))
    return tidy("".join(parts)), images


def cell_text(tc, rels):
    lines = []
    images = []
    for p in tc.findall(f"{W}p"):
        text, imgs = para_parts(p, rels)
        images.extend(imgs)
        if text:
            lines.append(text)
    return tidy(" ".join(lines)), images


def events_of(z):
    rels = relmap(z)
    root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(f"{W}body")
    out = []
    for el in body:
        if el.tag == f"{W}p":
            text, images = para_parts(el, rels)
            if text or images:
                out.append({"kind": "p", "text": text, "images": images})
        elif el.tag == f"{W}tbl":
            rows = []
            images = []
            for tr in el.findall(f"{W}tr"):
                row = []
                for tc in tr.findall(f"{W}tc"):
                    text, imgs = cell_text(tc, rels)
                    images.extend(imgs)
                    row.append(text)
                rows.append(row)
            out.append({"kind": "tbl", "rows": rows, "images": images})
    return out, z


def is_options(rows):
    flat = [c.strip() for r in rows for c in r]
    if len(flat) != 4:
        return False
    letters = []
    for cell in flat:
        m = re.match(r"^([A-D])(?:\s|$)", cell)
        letters.append(m.group(1) if m else "")
    return letters == list("ABCD")


def option_text(cell):
    return tidy(re.sub(r"^[A-D]\s*", "", cell))


def save_images(z, targets, cache):
    urls = []
    for target in targets:
        if target in cache:
            urls.append(cache[target])
            continue
        name = "word/" + target.lstrip("/")
        if not name.startswith("word/"):
            name = "word/" + target
        try:
            data = z.read(name)
        except KeyError:
            continue
        ext = Path(name).suffix.lower() or ".png"
        dest = OUT_IMG / f"g{len(cache):03d}{ext}"
        dest.write_bytes(data)
        url = "/geval/" + dest.name
        cache[target] = url
        urls.append(url)
    return urls


def stimulus_from(blocks, z, cache):
    paragraphs = []
    images = []
    tables = []
    for block in blocks:
        if block["kind"] == "p":
            if block["text"] and not block["text"].startswith("Сурагчийн нэр") and not block["text"].startswith("9-р анги"):
                paragraphs.append(block["text"])
            images.extend(save_images(z, block["images"], cache))
        else:
            tables.append(block["rows"])
            images.extend(save_images(z, block["images"], cache))
    text = "\n".join(paragraphs).strip()
    if not text and not images and not tables:
        return None
    return {"text": text, "images": images, "tables": tables}


def parse(events, z):
    cache = {}
    variants = []
    cur = None
    q = None
    buf = []
    shared = None
    shared_left = 0
    answers = {}
    mode = "body"
    key_variant = None
    key_nums = []

    def start_question(num, rest):
        nonlocal q, buf, shared, shared_left
        q = {"n": num, "lines": [rest] if rest else [], "images": [], "stimulus": None}
        if shared_left and shared:
            q["stimulus"] = shared
            shared_left -= 1
            buf = []
            return
        stim = stimulus_from(buf, z, cache)
        buf = []
        if not stim:
            return
        count = 1
        m = re.search(r"(\d+)\s*даалгавар", stim["text"])
        if m:
            count = int(m.group(1))
        q["stimulus"] = stim
        if count > 1:
            shared = stim
            shared_left = count - 1

    for block in events:
        text = block.get("text", "")
        if mode == "body" and text.startswith("ХАРИУЛТ"):
            mode = "key"
            q = None
            continue
        if mode == "key":
            if block["kind"] == "tbl" and block["rows"] and block["rows"][0] and block["rows"][0][0].startswith("Хувилбар"):
                for row in block["rows"][1:]:
                    cells = [c.strip() for c in row if c.strip()]
                    if not cells or not cells[0].isdigit():
                        continue
                    answers[int(cells[0])] = cells[1:19]
            continue

        m = VARIANT.search(text) if text.startswith("ГҮЙЦЭТГЭЛИЙН") else None
        if m:
            cur = {"n": int(m.group(1)), "questions": []}
            variants.append(cur)
            q = None
            buf = []
            shared = None
            shared_left = 0
            continue
        if cur is None:
            continue
        if block["kind"] == "p":
            qm = QSTART.match(text)
            if qm and int(qm.group(1)) <= 18:
                start_question(int(qm.group(1)), tidy(qm.group(2)))
                q["images"].extend(save_images(z, block["images"], cache))
                continue
        if q is not None:
            if block["kind"] == "tbl" and is_options(block["rows"]):
                flat = [c for r in block["rows"] for c in r]
                q["options"] = [option_text(c) for c in flat]
                cur["questions"].append(q)
                q = None
            elif block["kind"] == "p":
                if text:
                    q["lines"].append(text)
                q["images"].extend(save_images(z, block["images"], cache))
            else:
                q["lines"].append(table_as_text(block["rows"]))
            continue
        if text.startswith("Сурагчийн нэр") or text.startswith("9-р анги"):
            continue
        buf.append(block)

    letter = {c: i for i, c in enumerate("ABCD")}
    for variant in variants:
        key = answers.get(variant["n"], [])
        for i, question in enumerate(variant["questions"]):
            question["text"] = tidy("\n".join(question.pop("lines")))
            question["answer"] = letter.get(key[i], -1) if i < len(key) else -1
    return variants, answers


def table_as_text(rows):
    return "\n".join(" | ".join(c for c in row if c) for row in rows)


def main():
    if OUT_IMG.exists():
        shutil.rmtree(OUT_IMG)
    OUT_IMG.mkdir(parents=True)
    z = zipfile.ZipFile(SRC)
    events, z = events_of(z)
    variants, answers = parse(events, z)
    bad = []
    total = 0
    for variant in variants:
        total += len(variant["questions"])
        if len(variant["questions"]) != 18:
            bad.append(f"v{variant['n']} n={len(variant['questions'])}")
        if len(answers.get(variant["n"], [])) != 18:
            bad.append(f"key {variant['n']} {len(answers.get(variant['n'], []))}")
        for q in variant["questions"]:
            if len(q.get("options") or []) != 4 or q["answer"] < 0 or not q["text"]:
                bad.append(f"v{variant['n']} q{q['n']} opts={len(q.get('options') or [])} ans={q['answer']}")
    data = {
        "grade": 9,
        "year": 2025,
        "title": "2025 оны гүйцэтгэлийн үнэлгээ",
        "variants": variants,
    }
    OUT_JS.write_text("window.GE=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print("variants", len(variants), "questions", total, "bad", bad[:12], "bytes", OUT_JS.stat().st_size)
    q = variants[0]["questions"]
    print("--- v1 q1", q[0]["text"][:180])
    print("opts", q[0]["options"], "ans", q[0]["answer"], "img", q[0]["images"])
    print("--- v1 q2", q[1]["text"][:180])
    print("opts", q[1]["options"])
    stim = next((item["stimulus"] for item in q if item["stimulus"]), None)
    print("--- stimulus", (stim["text"][:160] if stim else None), "tables", len(stim["tables"]) if stim else 0, "imgs", len(stim["images"]) if stim else 0)


if __name__ == "__main__":
    main()
