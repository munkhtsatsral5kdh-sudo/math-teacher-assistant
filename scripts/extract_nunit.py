# Unit assessments: 8 units x 4 variants, student sheet plus answer key.
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

sys.path.insert(0, str(Path(__file__).parent))
import extract_geval as g

SRC = Path(r"C:\Users\DeLL\Desktop\нэгжийн үнэлгээ")
OUT_JS = Path(r"D:\math-teacher-assistant\public\js\nunit.js")
OUT_IMG = Path(r"D:\math-teacher-assistant\public\nunit")

VARIANT = re.compile(r"Нэгж\s+(\d+)\.\s*Нэгжийн үнэлгээ\s*·\s*(\d+)-р хувилбар")
QSTART = re.compile(r"^(\d{1,2})\.(?!\d)\s*(.*)$")
KEYHEAD = re.compile(r"^(\d+)-р хувилбар$")
LETTERS = {c: i for i, c in enumerate("ABCD")}


def paragraphs(z):
    rels = g.relmap(z)
    root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(f"{g.W}body")
    rows = []
    for el in body:
        if el.tag != f"{g.W}p":
            continue
        text, images = g.para_parts(el, rels)
        if text or images:
            rows.append((text, images))
    return rows


def split_options(text):
    marks = list(re.finditer(r"([A-D])\.", text))
    for i in range(len(marks) - 3):
        if [marks[i + k].group(1) for k in range(4)] != list("ABCD"):
            continue
        end = marks[i + 4].start() if i + 4 < len(marks) else len(text)
        stem = text[: marks[i].start()].strip()
        opts = []
        for k in range(4):
            start = marks[i + k].end()
            stop = marks[i + k + 1].start() if k < 3 else end
            opts.append(g.tidy(text[start:stop]))
        if all(opts) and stem:
            return stem, opts
    return text.strip(), []


def save_images(z, targets, cache, prefix):
    urls = []
    for target in targets:
        key = (prefix, target)
        if key in cache:
            urls.append(cache[key])
            continue
        name = "word/" + target.lstrip("/")
        try:
            data = z.read(name)
        except KeyError:
            continue
        ext = Path(name).suffix.lower() or ".png"
        dest = OUT_IMG / f"{prefix}-{len(cache):02d}{ext}"
        dest.write_bytes(data)
        url = "/nunit/" + dest.name
        cache[key] = url
        urls.append(url)
    return urls


def parse_answers(z):
    rels = g.relmap(z)
    root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(f"{g.W}body")
    answers = {}
    cur = None
    seen = False
    kids = list(body)
    for el in kids:
        if el.tag == f"{g.W}p":
            text, _ = g.para_parts(el, rels)
            if text.startswith("2. Хариу"):
                seen = True
            if seen and text.startswith("3. "):
                break
            m = KEYHEAD.match(text) if seen else None
            if m:
                cur = int(m.group(1))
            continue
        if not seen or cur is None or el.tag != f"{g.W}tbl":
            continue
        rows = []
        for tr in el.findall(f"{g.W}tr"):
            cells = []
            for tc in tr.findall(f"{g.W}tc"):
                t, _ = g.cell_text(tc, rels)
                cells.append(t)
            rows.append(cells)
        if not rows or rows[0][:2] != ["№", "Хариу"]:
            continue
        items = []
        for cells in rows[1:]:
            if len(cells) < 3 or not re.match(r"\d+", cells[0]):
                continue
            items.append({"n": int(re.match(r"\d+", cells[0]).group(0)), "answer": cells[1], "points": cells[2]})
        answers[cur] = items
        cur = None
    return answers


def parse_file(path, cache):
    z = zipfile.ZipFile(path)
    rows = paragraphs(z)
    title = next((t for t, _ in rows if t and not t.startswith("IX АНГИ")), path.stem)
    keys = parse_answers(z)
    variants = []
    cur = None
    q = None

    def finish_q():
        nonlocal q
        if not cur or not q:
            q = None
            return
        body = "\n".join(q["lines"]).strip()
        stem, opts = split_options(body)
        points = 2 if "(2 оноо)" in body else 1
        letter = ""
        answer_text = ""
        key = keys.get(cur["v"], [])
        item = next((a for a in key if a["n"] == q["n"]), None)
        if item:
            if item["answer"] in LETTERS and opts:
                letter = item["answer"]
            else:
                answer_text = item["answer"]
            if item["points"] in ("1", "2"):
                points = int(float(item["points"]))
        cur["questions"].append({
            "n": q["n"],
            "text": stem,
            "options": opts,
            "answer": LETTERS.get(letter, -1),
            "answerText": answer_text,
            "points": points,
            "images": q["images"],
        })
        q = None

    for text, images in rows:
        if text.startswith("2. Хариу"):
            finish_q()
            break
        m = VARIANT.search(text)
        if m:
            finish_q()
            cur = {"v": int(m.group(2)), "questions": []}
            variants.append(cur)
            continue
        if cur is None:
            continue
        qm = QSTART.match(text) if text else None
        if qm and 1 <= int(qm.group(1)) <= 18:
            finish_q()
            q = {"n": int(qm.group(1)), "lines": [], "images": []}
            rest = g.tidy(qm.group(2))
            if rest:
                q["lines"].append(rest)
            q["images"].extend(save_images(z, images, cache, f"u{cur and variants[-1]['v']}"))
            continue
        if q is not None:
            if text and not text.startswith("Нэр:") and not text.startswith("Заавар:") and text != "Задгай даалгавар":
                q["lines"].append(text)
            q["images"].extend(save_images(z, images, cache, "u"))
    finish_q()
    return title, variants


def main():
    if OUT_IMG.exists():
        shutil.rmtree(OUT_IMG)
    OUT_IMG.mkdir(parents=True)
    cache = {}
    units = []
    bad = []
    for n in range(1, 9):
        matches = list(SRC.glob(f"IX_Negj{n}_Negjiin_unelgee_*.docx"))
        if not matches:
            bad.append(f"missing {n}")
            continue
        title, variants = parse_file(matches[0], cache)
        units.append({"n": n, "name": title, "variants": variants})
        for v in variants:
            if len(v["questions"]) != 18:
                bad.append(f"u{n} v{v['v']} n={len(v['questions'])}")
            for q in v["questions"]:
                if q["n"] <= 16 and (len(q["options"]) != 4 or q["answer"] < 0):
                    bad.append(f"u{n} v{v['v']} q{q['n']} opts={len(q['options'])} ans={q['answer']}")
                if q["n"] >= 17 and not q["answerText"]:
                    bad.append(f"u{n} v{v['v']} q{q['n']} open")
        print(n, title[:40], "variants", len(variants), [len(v["questions"]) for v in variants])
    data = {"grade": 9, "title": "Нэгжийн үнэлгээ", "minutes": 40, "points": 20, "units": units}
    OUT_JS.write_text("window.NU=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print("bad", bad[:20], "count", len(bad), "bytes", OUT_JS.stat().st_size)


if __name__ == "__main__":
    main()
