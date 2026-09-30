# Student bank only: IX_Negj*_Daalgavryn_san_*.docx -> public/js/stbank.js
# Each card's ДААЛГАВАР text (and the answer, shown later behind Бодолт).
# Teacher notes (Буруу хариултын утга) are skipped.
import json
import re
import shutil
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

SRC = Path(r"C:\Users\DeLL\Desktop\Downloads")
OUT_JS = Path(r"D:\math-teacher-assistant\public\js\stbank.js")
OUT_IMG = Path(r"D:\math-teacher-assistant\public\stbank")

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
M = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
REL = "{http://schemas.openxmlformats.org/package/2006/relationships}"

SUP = str.maketrans("0123456789+-=()", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾")
SUB = str.maketrans("0123456789+-=()", "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎")

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
LEVEL_ORDER = ["I", "II", "III", "IV"]
CODE = re.compile(r"^IX\.(\d+)\.(\d+)-([IV]+)-(\d+)$")


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
    return "".join(math(c) for c in el)


def relmap(z):
    root = ET.fromstring(z.read("word/_rels/document.xml.rels"))
    out = {}
    for rel in root:
        if rel.tag == f"{REL}Relationship":
            out[rel.get("Id")] = rel.get("Target")
    return out


def blips(el, rels):
    found = []
    for blip in el.iter(f"{A}blip"):
        rid = blip.get(f"{R}embed")
        target = rels.get(rid or "")
        if target:
            found.append(target.replace("\\", "/"))
    return found


def paragraphs(z):
    rels = relmap(z)
    root = ET.fromstring(z.read("word/document.xml"))
    rows = []
    for p in root.iter(f"{W}p"):
        parts = []
        images = []
        for child in p:
            if child.tag == f"{W}r":
                for c in child:
                    if c.tag == f"{W}t":
                        parts.append(c.text or "")
                    elif c.tag == f"{W}tab":
                        parts.append("\t")
                    elif c.tag == f"{W}drawing":
                        images.extend(blips(c, rels))
            elif child.tag in (f"{M}oMath", f"{M}oMathPara"):
                parts.append(math(child))
        rows.append(("".join(parts).strip(), images))
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
            opts.append({"letter": "ABCD"[k], "text": text[start:stop].strip()})
        if all(o["text"] for o in opts) and len(stem) > 0:
            return stem, opts
    return text.strip(), []


def section(block, start_label, end_labels):
    try:
        i = next(n for n, (t, _) in enumerate(block) if t == start_label)
    except StopIteration:
        return [], []
    texts, images = [], []
    for t, imgs in block[i + 1 :]:
        if t in end_labels:
            break
        if t:
            texts.append(t)
        images.extend(imgs)
    return texts, images


def parse_file(path, unit_n, img_dir):
    z = zipfile.ZipFile(path)
    rows = paragraphs(z)
    title = next((t for t, _ in rows if t.startswith("Үнэлгээний нэгж")), f"Нэгж {unit_n}")
    cards = []
    i = 0
    while i < len(rows):
        text, _ = rows[i]
        m = CODE.match(text)
        if not m:
            i += 1
            continue
        j = i + 1
        while j < len(rows) and not CODE.match(rows[j][0]):
            j += 1
        block = rows[i + 1 : j]
        labels = {t for t, _ in block}
        if "ДААЛГАВАР" in labels and "Хариу" in labels:
            meta = next((t for t, _ in block if t.startswith("Шалгуур ")), "")
            bits = [b.strip() for b in meta.split("·")]
            name = next((t for t, _ in block if t and not t.startswith("Шалгуур")), "")
            task_lines, task_imgs = section(block, "ДААЛГАВАР", {"Хариу"})
            ans_lines, ans_imgs = section(block, "Хариу", {"Буруу хариултын утга", "Хэвлэх материал"})
            stem, options = split_options("\n".join(task_lines))
            answer = "\n".join(ans_lines).strip()
            if stem.startswith("Сурагчид өгөх") or answer.startswith("Зөв хариу, бодолтын"):
                i = j
                continue
            letter = answer.strip()[:1]
            saved = []
            for src in task_imgs:
                saved.append(save_image(z, src, img_dir, f"u{unit_n}-{m.group(0)}-{len(saved)}"))
            cards.append({
                "id": m.group(0),
                "criterion": bits[0] if bits else f"Шалгуур {m.group(1)}.{m.group(2)}",
                "level": m.group(3),
                "kind": bits[2] if len(bits) > 2 else "",
                "title": name,
                "text": stem,
                "options": options,
                "answer": answer,
                "correct": letter if options and letter in "ABCD" else "",
                "images": [p for p in saved if p],
            })
        i = j
    return title, cards


def save_image(z, target, img_dir, stem):
    name = "word/" + target.lstrip("/")
    if not name.startswith("word/media/"):
        name = "word/media/" + Path(target).name
    try:
        data = z.read(name)
    except KeyError:
        return ""
    ext = Path(name).suffix.lower() or ".png"
    img_dir.mkdir(parents=True, exist_ok=True)
    dest = img_dir / f"{stem}{ext}"
    dest.write_bytes(data)
    return "/stbank/" + dest.name


def group(cards):
    criteria = []
    by = {}
    for card in cards:
        cid = card["criterion"]
        if cid not in by:
            by[cid] = {"name": cid, "levels": {}}
            criteria.append(by[cid])
        lv = card["level"]
        by[cid]["levels"].setdefault(lv, [])
        item = {k: card[k] for k in ("id", "title", "kind", "text", "options", "answer", "correct", "images")}
        by[cid]["levels"][lv].append(item)
    out = []
    for c in criteria:
        levels = []
        for lv in LEVEL_ORDER:
            if lv in c["levels"]:
                levels.append({"name": f"{lv} түвшин", "problems": c["levels"][lv]})
        out.append({"name": c["name"], "levels": levels})
    return out


def main():
    if OUT_IMG.exists():
        shutil.rmtree(OUT_IMG)
    units = []
    total = 0
    for n in range(1, 9):
        matches = list(SRC.glob(f"IX_Negj{n}_Daalgavryn_san_*.docx"))
        if not matches:
            raise SystemExit(f"missing unit {n}")
        title, cards = parse_file(matches[0], n, OUT_IMG)
        total += len(cards)
        units.append({
            "n": n,
            "name": title.replace("Үнэлгээний нэгж ", "Нэгж "),
            "topics": TOPICS[n],
            "count": len(cards),
            "criteria": group(cards),
        })
        print(n, len(cards), title)
    data = {"grade": 9, "total": total, "units": units}
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    OUT_JS.write_text("window.ST=" + payload + ";\n", encoding="utf-8")
    print("total", total, "bytes", OUT_JS.stat().st_size)


if __name__ == "__main__":
    main()
