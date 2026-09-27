(function () {
  const BANK_TOPIC_UNITS = [
    { topicKey: "6-2", name: "Бутархай тоо (суурь)", theory: "" },
    { topicKey: "7-4", name: "Шугаман тэгшитгэл (суурь)", theory: "" },
    { topicKey: "8-5", name: "Пифагорын теорем (суурь)", theory: "" },
    { topicKey: "8-4", name: "Шугаман функц (суурь)", theory: "" },
    { topicKey: "9-3", name: "Квадрат тэгшитгэл", theory: "ax²+bx+c=0. D=b²−4ac. D>0 хоёр язгуур, D=0 нэг, D<0 бодит язгуургүй. x=(−b±√D)/(2a). Виете: нийлбэр=−b/a, үржвэр=c/a." },
    { topicKey: "9-3", name: "Квадрат тэнцэтгэл биш", theory: "(x−a)(x−b)<0 бол язгууруудын хооронд. >0 бол гадна талд." },
    { topicKey: "9-4", name: "Квадрат функц", theory: "y=ax²+bx+c парабол. a>0 дээшээ нээлттэй. Орой x=−b/(2a). y-огтлол = c." },
    { topicKey: "9-4", name: "Арифметик прогресс", theory: "aₙ=a₁+(n−1)d. Sₙ=n(2a₁+(n−1)d)/2." },
    { topicKey: "9-4", name: "Геометрийн прогресс", theory: "bₙ=b₁·qⁿ⁻¹. q≠1 бол Sₙ=b₁(qⁿ−1)/(q−1)." },
    { topicKey: "9-4", name: "Функц", theory: "y=f(x). Шулуун y=kx+b. k>0 өсөх. f(a) нь x=a дахь утга." },
    { topicKey: "9-5", name: "Тригонометрийн харьцаа", theory: "Тэгш өнцөгт гурвалжинд: sin=эсрэг/гипотенуз, cos=хажуу/гипотенуз, tan=эсрэг/хажуу. sin30=1/2, cos60=1/2, tan45=1." },
    { topicKey: "9-5", name: "Пифагор ба төстэй байдал", theory: "a²+b²=c². Төстэй гурвалжинд харгалзах талууд пропорциональ." },
    { topicKey: "9-6", name: "Координатын хавтгай", theory: "Хоёр цэгийн зай: √[(x₂−x₁)²+(y₂−y₁)²]. Дундаж цэг: ((x₁+x₂)/2, (y₁+y₂)/2)." },
  ];

  const P = (id, unit, level, text, options, answer, solution) => ({ id, unit, level, text, options, answer, solution });

  const RAW = {
    "6-2": [
      P("6a1", "Бутархай тоо (суурь)", 1, "1/2 + 1/4 = ?", ["3/4", "2/6", "1/6", "1"], 0, "2/4+1/4=3/4."),
      P("6a2", "Бутархай тоо (суурь)", 1, "0.5 хэдэн хувь вэ?", ["50%", "5%", "0.5%", "500%"], 0, "0.5=50/100=50%."),
    ],
    "7-4": [
      P("7a1", "Шугаман тэгшитгэл (суурь)", 1, "2x+3=11 бол x=?", ["4", "7", "5", "8"], 0, "2x=8, x=4."),
      P("7a2", "Шугаман тэгшитгэл (суурь)", 1, "3x=12 бол x=?", ["4", "3", "9", "15"], 0, "x=4."),
    ],
    "8-5": [
      P("8a1", "Пифагорын теорем (суурь)", 1, "Катет 6, 8 бол гипотенуз?", ["10", "14", "48", "7"], 0, "36+64=100=10²."),
    ],
    "8-4": [
      P("8a2", "Шугаман функц (суурь)", 1, "y=2x+1 үед x=3 бол y=?", ["7", "6", "5", "8"], 0, "6+1=7."),
    ],
    "9-3": [
      P("9q1", "Квадрат тэгшитгэл", 1, "x²−5x+6=0 язгуурууд?", ["2 ба 3", "−2 ба −3", "1 ба 6", "0 ба 5"], 0, "D=1, x=(5±1)/2 → 2, 3."),
      P("9q2", "Квадрат тэгшитгэл", 1, "x²+4x+4=0 хэдэн бодит язгууртай вэ?", ["2 ялгаатай", "1 (давхардсан)", "0", "3"], 1, "D=0, x=−2."),
      P("9q3", "Квадрат тэгшитгэл", 2, "x²+1=0 бодит язгууртай юу?", ["Тийм, хоёр", "Тийм, нэг", "Үгүй", "Зөвхөн x=1"], 2, "D=−4<0."),
      P("9q4", "Квадрат тэгшитгэл", 2, "2x²−8=0 тэгшитгэлийн эерэг язгуур?", ["2", "4", "√2", "8"], 0, "x²=4, x=±2."),
      P("9q5", "Квадрат тэгшитгэл", 2, "x²−x−6=0 аль нь язгуур вэ?", ["x=3", "x=2", "x=6", "x=−6"], 0, "(x−3)(x+2)=0."),
      P("9q6", "Квадрат тэгшитгэл", 3, "x²−6x+k=0 нэг язгууртай бол k=?", ["9", "6", "3", "0"], 0, "D=36−4k=0 → k=9."),
      P("9q7", "Квадрат тэгшитгэл", 2, "x²−7x+10=0 язгууруудын нийлбэр (Виете)?", ["7", "10", "−7", "3"], 0, "нийлбэр=7."),
      P("9q8", "Квадрат тэгшитгэл", 3, "Язгуурууд 2 ба −5 бол тэгшитгэл?", ["x²+3x−10=0", "x²−3x−10=0", "x²+3x+10=0", "x²−7x+10=0"], 0, "x²−(нийлбэр)x+үржвэр=x²+3x−10."),
      P("9i1", "Квадрат тэнцэтгэл биш", 1, "x²−9<0 шийд?", ["−3<x<3", "x<−3 эсвэл x>3", "x≤3", "x≥−3"], 0, "Язгууруудын дунд."),
      P("9i2", "Квадрат тэнцэтгэл биш", 1, "x²≥0 ямагт үнэн үү?", ["Тийм", "Зөвхөн x>0", "Үгүй", "Зөвхөн x=0"], 0, "Бүх бодит x."),
      P("9i3", "Квадрат тэнцэтгэл биш", 2, "(x−1)(x−4)>0 шийд?", ["x<1 эсвэл x>4", "1<x<4", "x=1,4", "x>1"], 0, "Ижил тэмдэг: гадна."),
      P("9i4", "Квадрат тэнцэтгэл биш", 2, "x²+1>0?", ["Бүх бодит x", "x>0", "Хоосон", "x≠0"], 0, "Бага утга 1>0."),
      P("9i5", "Квадрат тэнцэтгэл биш", 3, "x²−5x+6≤0?", ["2≤x≤3", "x≤2 эсвэл x≥3", "x=2,3", "1≤x≤6"], 0, "(x−2)(x−3)≤0."),
    ],
    "9-4": [
      P("9f1", "Квадрат функц", 1, "y=x²−4x+3 оройн x-координат?", ["2", "3", "−2", "4"], 0, "x=4/2=2."),
      P("9f2", "Квадрат функц", 1, "y=−2x² параболын нээлт?", ["Доошоо", "Дээшээ", "Баруун", "Зүүн"], 0, "a=−2<0."),
      P("9f3", "Квадрат функц", 2, "y=x²+1-ийн хамгийн бага утга?", ["1", "0", "−1", "2"], 0, "Орой (0,1)."),
      P("9f4", "Квадрат функц", 2, "y=x²−4 x тэнхлэгийг хаана огтлох вэ?", ["±2", "±4", "0", "зөвхөн 2"], 0, "x²=4, x=±2."),
      P("9f5", "Квадрат функц", 2, "y=2x²+3-ийн y-огтлол?", ["3", "2", "0", "5"], 0, "x=0 үед y=3."),
      P("9f6", "Квадрат функц", 3, "y=(x−1)²+4 орой?", ["(1,4)", "(−1,4)", "(1,−4)", "(0,4)"], 0, "Шилжилт (1,4)."),
      P("9a1", "Арифметик прогресс", 1, "2, 5, 8, 11, … 10 дахь гишүүн?", ["29", "32", "27", "26"], 0, "2+9·3=29."),
      P("9a2", "Арифметик прогресс", 1, "3, 7, 11-ийн ялгавар d?", ["4", "3", "7", "10"], 0, "7−3=4."),
      P("9a3", "Арифметик прогресс", 2, "a₁=5, d=2, S₅=?", ["45", "35", "25", "40"], 0, "S₅=5/2·(10+8)=45."),
      P("9a4", "Арифметик прогресс", 2, "a₁=1, d=1, a₂₀=?", ["20", "21", "19", "40"], 0, "1+19·1=20."),
      P("9a5", "Арифметик прогресс", 3, "5, 9, 13, … аль n-д 41 гарах вэ?", ["10", "9", "11", "8"], 0, "5+(n−1)4=41 → n−1=9, n=10."),
      P("9g1", "Геометрийн прогресс", 1, "2, 6, 18, …-ийн q?", ["3", "4", "2", "6"], 0, "6/2=3."),
      P("9g2", "Геометрийн прогресс", 1, "b₁=3, q=2, b₄=?", ["24", "18", "12", "48"], 0, "3·2³=24."),
      P("9g3", "Геометрийн прогресс", 2, "1, 2, 4, 8-ийн S₄?", ["15", "16", "14", "8"], 0, "1(16−1)/(2−1)=15."),
      P("9g4", "Геометрийн прогресс", 2, "5, 5, 5, … q=?", ["1", "0", "5", "−1"], 0, "q=1."),
      P("9g5", "Геометрийн прогресс", 3, "b₁=1, q=−2, b₃=?", ["4", "−4", "2", "−2"], 0, "1·(−2)²=4."),
      P("9fn1", "Функц", 1, "f(x)=2x−1, f(3)=?", ["5", "6", "4", "7"], 0, "6−1=5."),
      P("9fn2", "Функц", 1, "y=−x+1 налуу k?", ["−1", "1", "0", "−x"], 0, "k=−1."),
      P("9fn3", "Функц", 2, "f(x)=x², f(−2)=?", ["4", "−4", "2", "−2"], 0, "(−2)²=4."),
      P("9fn4", "Функц", 2, "y=3 шулуун ямар вэ?", ["Хэвтээ", "Босоо", "45°", "Парабол"], 0, "k=0."),
      P("9fn5", "Функц", 3, "f(x)=x+2, f(f(1))=?", ["5", "3", "4", "2"], 0, "f(1)=3, f(3)=5."),
    ],
    "9-5": [
      P("9t1", "Тригонометрийн харьцаа", 1, "sin 30° = ?", ["1/2", "√3/2", "1", "0"], 0, "Хүснэгтийн утга."),
      P("9t2", "Тригонометрийн харьцаа", 1, "cos 60° = ?", ["1/2", "√3/2", "0", "1"], 0, "cos60=1/2."),
      P("9t3", "Тригонометрийн харьцаа", 1, "tan 45° = ?", ["1", "0", "√3", "1/2"], 0, "tan45=1."),
      P("9t4", "Тригонометрийн харьцаа", 2, "sin²α + cos²α = ?", ["1", "0", "sin2α", "2"], 0, "Үндсэн нэгж."),
      P("9t5", "Тригонометрийн харьцаа", 2, "Катет 3, гипотенуз 5 бол sin=?", ["3/5", "4/5", "3/4", "5/3"], 0, "Эсрэг/гипотенуз. Нөгөө катет 4."),
      P("9t6", "Тригонометрийн харьцаа", 3, "cos 0° = ?", ["1", "0", "1/2", "−1"], 0, "cos0=1."),
      P("9p1", "Пифагор ба төстэй байдал", 1, "Катет 3, 4 бол гипотенуз?", ["5", "6", "7", "12"], 0, "9+16=25."),
      P("9p2", "Пифагор ба төстэй байдал", 1, "Гипотенуз 13, катет 5 бол нөгөө катет?", ["12", "8", "18", "10"], 0, "169−25=144=12²."),
      P("9p3", "Пифагор ба төстэй байдал", 2, "Төстэй гурвалжны харьцаа 1:2, жижиг тал 4 бол том?", ["8", "6", "2", "16"], 0, "4·2=8."),
      P("9p4", "Пифагор ба төстэй байдал", 2, "5, 12, 13 гурвалжин тэгш өнцөгт үү?", ["Тийм", "Үгүй", "Зөвхөн хурц", "Мэдэхгүй"], 0, "25+144=169."),
      P("9p5", "Пифагор ба төстэй байдал", 3, "Адил хажуут тэгш өнцөгт гурвалжны катет 1 бол гипотенуз?", ["√2", "2", "1", "√3"], 0, "1+1=2."),
    ],
    "9-6": [
      P("9c1", "Координатын хавтгай", 1, "(0,0) ба (3,4) хоорондын зай?", ["5", "7", "12", "4"], 0, "9+16=25, √=5."),
      P("9c2", "Координатын хавтгай", 1, "(2,2) ба (4,6)-ийн дундаж цэг?", ["(3,4)", "(2,4)", "(6,8)", "(1,2)"], 0, "((2+4)/2,(2+6)/2)."),
      P("9c3", "Координатын хавтгай", 2, "A(1,0), B(1,5) зай?", ["5", "1", "6", "4"], 0, "Босоо, |5−0|=5."),
      P("9c4", "Координатын хавтгай", 2, "O(0,0)-оос (0,−3) зай?", ["3", "0", "−3", "9"], 0, "Абс. утга 3."),
      P("9c5", "Координатын хавтгай", 3, "y=2x шулуун дээр аль цэг орших вэ?", ["(2,4)", "(2,2)", "(4,2)", "(1,0)"], 0, "4=2·2."),
    ],
  };

  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const gcd = (a, b) => {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) [x, y] = [y, x % y];
    return x || 1;
  };
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  const fmt = (n) => {
    const r = Math.round(n * 1000) / 1000;
    return String(r).replace("-", "−");
  };
  const frac = (n, d) => {
    const g = gcd(n, d);
    const sn = n / g;
    const sd = d / g;
    if (sd === 1) return fmt(sn);
    return `${fmt(sn)}/${sd}`;
  };
  const pt = (x, y) => `(${fmt(x)}, ${fmt(y)})`;
  const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
  const sup = (n) => String(n).split("").map((c) => SUP[c] || c).join("");
  const signed = (n) => (n < 0 ? `− ${fmt(-n)}` : `+ ${fmt(n)}`);
  const paren = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n));

  function mcq(level, text, correct, wrongs, solution) {
    const c = typeof correct === "number" ? fmt(correct) : String(correct);
    const opts = [c];
    for (const w of wrongs) {
      const s = typeof w === "number" ? fmt(w) : String(w);
      if (!opts.includes(s)) opts.push(s);
      if (opts.length === 4) break;
    }
    let k = 1;
    const numRe = /−?\d+(\.\d+)?/;
    while (opts.length < 4 && k < 40) {
      const delta = k % 2 ? Math.ceil(k / 2) : -Math.ceil(k / 2);
      let s;
      if (typeof correct === "number") {
        s = fmt(correct + delta);
      } else if (numRe.test(c)) {
        s = c.replace(numRe, (m) => fmt(Number(m.replace("−", "-")) + delta * (Math.abs(Number(m.replace("−", "-"))) >= 50 ? 10 : 1)));
      } else {
        break;
      }
      if (!opts.includes(s)) opts.push(s);
      k += 1;
    }
    return { level, text, options: opts, answer: 0, solution };
  }

  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];

  const GEN = {
    "6-0": (s) => pick([
      () => {
        const a = ri(-15 * s, 15 * s);
        const b = ri(-15 * s, 15 * s);
        return mcq(s, `${paren(a)} + ${paren(b)} = ?`, a + b, [a - b, -(a + b), Math.abs(a) + Math.abs(b)], `Тэмдгийг анхаарч нэмнэ: ${fmt(a)} + ${paren(b)} = ${fmt(a + b)}.`);
      },
      () => {
        const n = ri(2, 8 + 4 * s);
        return mcq(s, `√${n * n} = ?`, n, [n + 1, n - 1, 2 * n], `${n}² = ${n * n} тул √${n * n} = ${n}.`);
      },
      () => {
        const g = ri(2, 6);
        const a = g * ri(2, 3 + s);
        let b = g * ri(2, 3 + s);
        if (b === a) b += g;
        const G = gcd(a, b);
        return mcq(s, `ХИЕХ(${a}, ${b}) = ?`, G, [lcm(a, b), G * 2, a * b], `${a} ба ${b}-ийн хамгийн их ерөнхий хуваагч ${G}.`);
      },
    ])(),
    "6-1": (s) => pick([
      () => {
        const x = ri(12, 99 * s) / 10;
        const m = pick([0.1, 0.01]);
        return mcq(s, `${fmt(x)} × ${m} = ?`, x * m, [x * m * 10, x / m, x * m / 10], `${m}-ээр үржүүлэхэд таслал зүүн тийш ${m === 0.1 ? 1 : 2} орон шилжинэ.`);
      },
      () => {
        const n = ri(1000, 9999 * s);
        const r = Math.round(n / 100) * 100;
        return mcq(s, `${n}-ийг 100 хүртэл тоймло.`, r, [Math.floor(n / 100) * 100 === r ? r + 100 : Math.floor(n / 100) * 100, Math.round(n / 10) * 10, Math.round(n / 1000) * 1000], `Аравтын орны цифрийг харж ${r} болно.`);
      },
    ])(),
    "6-2": (s) => pick([
      () => {
        const dens = [2, 3, 4, 5, 6, 8, 10];
        const b = pick(dens);
        const d = pick(dens.filter((x) => x !== b));
        const a = ri(1, b - 1);
        const c = ri(1, d - 1);
        const L = lcm(b, d);
        const num = a * (L / b) + c * (L / d);
        return mcq(s, `${a}/${b} + ${c}/${d} = ?`, frac(num, L), [`${a + c}/${b + d}`, frac(a * c, b * d), frac(num + 1, L)], `Ерөнхий хуваарь ${L}: ${a * (L / b)}/${L} + ${c * (L / d)}/${L} = ${frac(num, L)}.`);
      },
      () => {
        const p = ri(1, 99);
        return mcq(s, `${fmt(p / 100)} хэдэн хувь вэ?`, `${p}%`, [`${fmt(p / 10)}%`, `${p * 10}%`, `${fmt(p / 100)}%`], `${fmt(p / 100)} = ${p}/100 = ${p}%.`);
      },
    ])(),
    "6-3": (s) => {
      const a = ri(1, 4 + s);
      let b = ri(1, 4 + s);
      if (b === a) b += 1;
      const k = ri(2, 6 * s);
      const total = (a + b) * k;
      const big = Math.max(a, b) * k;
      return mcq(s, `${total}-ийг ${a}:${b} харьцаагаар хуваахад их хэсэг нь хэд вэ?`, big, [Math.min(a, b) * k, total / 2, k], `Нэг хэсэг = ${total}/(${a}+${b}) = ${k}. Их хэсэг = ${Math.max(a, b)}·${k} = ${big}.`);
    },
    "6-4": (s) => pick([
      () => {
        const a = ri(2, 4 + s);
        const x = ri(1, 8 * s);
        const b = ri(1, 20);
        const c = a * x + b;
        return mcq(s, `${a}x + ${b} = ${c} бол x = ?`, x, [x + 1, c - b, (c + b) / a], `${a}x = ${c} − ${b} = ${c - b}, x = ${x}.`);
      },
      () => {
        const a = ri(2, 6);
        const b = ri(1, 12);
        const x = ri(1, 5 * s);
        return mcq(s, `x = ${x} үед ${a}x + ${b} илэрхийллийн утга?`, a * x + b, [a + x + b, a * (x + b), a * x - b], `${a}·${x} + ${b} = ${a * x + b}.`);
      },
    ])(),
    "6-5": (s) => {
      const a1 = ri(1, 10 * s);
      const d = ri(2, 3 + 2 * s);
      const seq = [0, 1, 2, 3].map((i) => a1 + i * d).join(", ");
      return mcq(s, `${seq}, … дараагийн гишүүн?`, a1 + 4 * d, [a1 + 4 * d + 1, a1 + 5 * d, a1 + 3 * d + d * 2], `Ялгавар ${d}: ${a1 + 3 * d} + ${d} = ${a1 + 4 * d}.`);
    },
    "6-6": (s) => pick([
      () => {
        const a = ri(20, 160);
        return mcq(s, `Хамар өнцгийн нэг нь ${a}° бол нөгөө нь хэдэн градус вэ?`, `${180 - a}°`, [`${360 - a}°`, `${Math.abs(90 - a)}°`, `${180 - a + 10}°`], `Хамар өнцгүүдийн нийлбэр 180°: 180 − ${a} = ${180 - a}°.`);
      },
      () => {
        const a = ri(30, 80);
        const b = ri(30, 80);
        return mcq(s, `Гурвалжны хоёр өнцөг ${a}° ба ${b}° бол гурав дахь өнцөг?`, `${180 - a - b}°`, [`${360 - a - b}°`, `${a + b}°`, `${180 - a - b + 10}°`], `180 − ${a} − ${b} = ${180 - a - b}°.`);
      },
      () => {
        const n = pick([4, 5, 6]);
        return mcq(s, `Гүдгэр ${n} өнцөгтийн дотоод өнцгүүдийн нийлбэр?`, `${(n - 2) * 180}°`, [`${n * 180}°`, `${(n - 1) * 180}°`, "360°"], `(${n} − 2)·180° = ${(n - 2) * 180}°.`);
      },
    ])(),
    "6-7": (s) => {
      const x = ri(-6, 6) || 2;
      const y = ri(-6, 6) || 3;
      const axis = pick(["x", "y"]);
      const ans = axis === "x" ? pt(x, -y) : pt(-x, y);
      return mcq(s, `A${pt(x, y)} цэгийг ${axis} тэнхлэгийн хувьд тэгш хэмтэй буулгавал?`, ans, [axis === "x" ? pt(-x, y) : pt(x, -y), pt(-x, -y), pt(y, x)], axis === "x" ? "x тэнхлэгийн хувьд y-ийн тэмдэг солигдоно." : "y тэнхлэгийн хувьд x-ийн тэмдэг солигдоно.");
    },
    "6-8": (s) => pick([
      () => {
        const a = ri(3, 12 * s);
        const b = ri(2, a);
        return pick([
          () => mcq(s, `Урт ${a} см, өргөн ${b} см тэгш өнцөгтийн талбай?`, `${a * b} см²`, [`${2 * (a + b)} см²`, `${a + b} см²`, `${a * b * 2} см²`], `S = ${a}·${b} = ${a * b} см².`),
          () => mcq(s, `Урт ${a} см, өргөн ${b} см тэгш өнцөгтийн периметр?`, `${2 * (a + b)} см`, [`${a * b} см`, `${a + b} см`, `${4 * a} см`], `P = 2(${a}+${b}) = ${2 * (a + b)} см.`),
        ])();
      },
      () => {
        const km = ri(11, 95) / 10;
        return mcq(s, `${fmt(km)} км = ? м`, `${fmt(km * 1000)} м`, [`${fmt(km * 100)} м`, `${fmt(km * 10)} м`, `${fmt(km * 10000)} м`], "1 км = 1000 м.");
      },
    ])(),
    "6-9": (s) => {
      const nums = Array.from({ length: 5 }, () => ri(1, 10 * s + 10));
      const sum = nums.reduce((t, n) => t + n, 0);
      return pick([
        () => mcq(s, `${nums.join(", ")} тоонуудын арифметик дундаж?`, sum / 5, [sum, Math.max(...nums), (Math.max(...nums) + Math.min(...nums)) / 2], `(${nums.join("+")})/5 = ${sum}/5 = ${fmt(sum / 5)}.`),
        () => mcq(s, `${nums.join(", ")} өгөгдлийн далайц?`, Math.max(...nums) - Math.min(...nums), [Math.max(...nums), sum / 5, Math.max(...nums) + Math.min(...nums)], `Далайц = их − бага = ${Math.max(...nums)} − ${Math.min(...nums)}.`),
      ])();
    },
    "6-10": (s) => {
      const n = ri(1, 5);
      const cnt = 6 - n;
      return mcq(s, `Шоо нэг удаа хаяхад ${n}-ээс их тоо буух магадлал?`, frac(cnt, 6), [frac(n, 6), `${cnt}/${n}`, frac(cnt + 1, 6)], `Таатай үр дүн ${cnt}, бүх үр дүн 6: ${cnt}/6 = ${frac(cnt, 6)}.`);
    },
    "7-0": (s) => pick([
      () => {
        const a = ri(2, 20 * s);
        const b = ri(2, 20 * s);
        return mcq(s, `|−${a}| + |${b}| − |−${b}| = ?`, a, [-a, a + 2 * b, a - 2 * b], `|−${a}| = ${a}, |${b}| − |−${b}| = 0.`);
      },
      () => {
        const n = ri(2, 4 + s);
        return mcq(s, `∛${n ** 3} = ?`, n, [n + 1, n * n, n ** 3 / 3], `${n}³ = ${n ** 3}.`);
      },
      () => {
        const a = pick([4, 6, 8, 9, 10, 12, 14, 15]);
        let b = pick([6, 8, 9, 10, 12, 15, 18, 20]);
        if (b === a) b += 2;
        const L = lcm(a, b);
        return mcq(s, `ХБЕХ(${a}, ${b}) = ?`, L, [a * b === L ? L * 2 : a * b, gcd(a, b), L / 2], `Анхны үржигдэхүүнд задалж ХБЕХ = ${L}.`);
      },
    ])(),
    "7-1": (s) => {
      const a = ri(11, 99) / 10;
      const p = ri(2, 3 + s);
      return mcq(s, `${fmt(a)} × 10${sup(p)} = ?`, a * 10 ** p, [a * 10 ** (p - 1), a * 10 ** (p + 1), a * p * 10], `Таслал баруун тийш ${p} орон шилжинэ.`);
    },
    "7-2": (s) => pick([
      () => {
        const a = ri(1, 5);
        const b = ri(a + 1, 9);
        const c = ri(1, 5);
        const d = ri(c + 1, 9);
        return mcq(s, `${a}/${b} × ${c}/${d} = ?`, frac(a * c, b * d), [frac(a + c, b + d), frac(a * d, b * c), frac(a * c, b + d)], `Хүртвэрийг хүртвэрээр, хуваарийг хуваариар үржүүлнэ: ${a * c}/${b * d} = ${frac(a * c, b * d)}.`);
      },
      () => {
        const d = pick([3, 4, 5, 6, 8]);
        const n = ri(1, d - 1);
        const k = ri(2, 6 * s);
        const part = n * k;
        const whole = d * k;
        return mcq(s, `Тооны ${n}/${d} нь ${part} бол тоо хэд вэ?`, whole, [part * n, Math.round(part / d), whole + d], `${part} : ${n} · ${d} = ${whole}.`);
      },
    ])(),
    "7-3": (s) => pick([
      () => {
        const price = ri(2, 20) * 1000;
        const p = pick([10, 15, 20, 25, 30]);
        return mcq(s, `${price}₮ үнэтэй барааг ${p}% хямдруулбал үнэ?`, `${price * (100 - p) / 100}₮`, [`${price * p / 100}₮`, `${price - p}₮`, `${price * (100 + p) / 100}₮`], `${price} − ${price}·${p}/100 = ${price * (100 - p) / 100}.`);
      },
      () => {
        const a = ri(2, 6);
        const b = ri(2, 9);
        const k = ri(2, 5 * s);
        return mcq(s, `${a} : ${b} = x : ${b * k} бол x = ?`, a * k, [b * k / a, a + k, a * b], `Пропорцын үндсэн чанар: x = ${a}·${b * k}/${b} = ${a * k}.`);
      },
    ])(),
    "7-4": (s) => {
      const x = ri(-6 * s, 6 * s) || 2;
      const a = ri(3, 7 + s);
      const c = ri(1, a - 1);
      const b = ri(-15, 15);
      const d = a * x + b - c * x;
      const k = a - c === 1 ? "x" : `${a - c}x`;
      return mcq(s, `${a}x ${signed(b)} = ${c}x ${signed(d)} бол x = ?`, x, [-x, d - b, x + 2], `${k} = ${fmt(d)} ${signed(-b)} = ${fmt(d - b)}, x = ${fmt(x)}.`);
    },
    "7-5": (s) => pick([
      () => {
        const a1 = ri(-5, 10);
        const d = ri(2, 4 + s);
        const n = ri(8, 15 + 5 * s);
        return mcq(s, `a₁ = ${fmt(a1)}, d = ${d} арифметик прогрессийн ${n}-р гишүүн?`, a1 + (n - 1) * d, [a1 + n * d, a1 * n + d, a1 + (n - 2) * d], `aₙ = a₁ + (n−1)d = ${fmt(a1)} + ${n - 1}·${d}.`);
      },
      () => {
        const m = ri(-4, 5) || 2;
        const c = ri(-8, 8);
        const x = ri(-5, 5);
        const mx = m === 1 ? "x" : m === -1 ? "−x" : `${fmt(m)}x`;
        return mcq(s, `y = ${mx} ${signed(c)} функцэд x = ${fmt(x)} үед y = ?`, m * x + c, [m + x + c, m * x - c, m * (x + c)], `y = ${m}·${paren(x)} ${signed(c)} = ${fmt(m * x + c)}.`);
      },
    ])(),
    "7-6": (s) => pick([
      () => {
        const a = ri(25, 75);
        const b = ri(25, 75);
        return mcq(s, `Гурвалжны хоёр өнцөг ${a}°, ${b}° бол гурав дахь өнцгийн гадаад өнцөг?`, `${a + b}°`, [`${180 - a - b}°`, `${180 - a}°`, `${360 - a - b}°`], "Гадаад өнцөг нь хамар биш хоёр дотоод өнцгийн нийлбэр.");
      },
      () => {
        const a = ri(60, 120);
        const b = ri(60, 120);
        const c = ri(50, 110);
        return mcq(s, `Дөрвөн өнцөгтийн гурван өнцөг ${a}°, ${b}°, ${c}° бол дөрөв дэх нь?`, `${360 - a - b - c}°`, [`${180 - (a + b + c) % 180}°`, `${a + b + c - 180}°`, `${360 - a - b - c + 10}°`], `360 − ${a} − ${b} − ${c}.`);
      },
    ])(),
    "7-7": (s) => {
      const x1 = ri(-8, 8);
      const y1 = ri(-8, 8);
      const x2 = x1 + 2 * ri(-4, 4 + s);
      const y2 = y1 + 2 * ri(-4, 4 + s);
      return mcq(s, `A${pt(x1, y1)}, B${pt(x2, y2)} хэрчмийн дундаж цэг?`, pt((x1 + x2) / 2, (y1 + y2) / 2), [pt(x2 - x1, y2 - y1), pt((x2 - x1) / 2, (y2 - y1) / 2), pt(x1 + x2, y1 + y2)], "((x₁+x₂)/2, (y₁+y₂)/2).");
    },
    "7-8": (s) => pick([
      () => {
        const a = 2 * ri(2, 8 * s);
        const h = ri(3, 12);
        return mcq(s, `Суурь ${a} см, өндөр ${h} см гурвалжны талбай?`, `${a * h / 2} см²`, [`${a * h} см²`, `${a + h} см²`, `${a * h / 4} см²`], `S = a·h/2 = ${a}·${h}/2.`);
      },
      () => {
        const r = ri(2, 10);
        return mcq(s, `Радиус ${r} см тойргийн урт (π ≈ 3.14)?`, `${fmt(2 * 3.14 * r)} см`, [`${fmt(3.14 * r)} см`, `${fmt(3.14 * r * r)} см`, `${fmt(2 * 3.14 * r + 3.14)} см`], `C = 2πr = 2·3.14·${r}.`);
      },
      () => {
        const a = ri(2, 6 + s);
        const b = ri(2, 6);
        const c = ri(2, 5);
        return mcq(s, `${a}×${b}×${c} см хэмжээтэй тэгш өнцөгт параллелепипедийн эзлэхүүн?`, `${a * b * c} см³`, [`${2 * (a * b + b * c + a * c)} см³`, `${a + b + c} см³`, `${a * b} см³`], `V = abc = ${a * b * c} см³.`);
      },
    ])(),
    "7-9": (s) => {
      const pool = new Set();
      while (pool.size < 5) pool.add(ri(1, 20 + 10 * s));
      const nums = [...pool].sort((x, y) => x - y);
      const mode = nums[ri(0, 4)];
      const data = [...nums, mode].sort((x, y) => x - y);
      const med = (data[2] + data[3]) / 2;
      const shown = [...data].sort(() => Math.random() - 0.5).join(", ");
      return pick([
        () => mcq(s, `${shown} өгөгдлийн медиан?`, med, [data[2], data[3] === data[2] ? data[4] : data[3], data.reduce((t, n) => t + n, 0) / 6], `Эрэмбэлбэл ${data.join(", ")}; дунд хоёр тооны дундаж ${fmt(med)}.`),
        () => {
          const counts = {};
          data.forEach((n) => { counts[n] = (counts[n] || 0) + 1; });
          const top = Object.entries(counts).sort((x, y) => y[1] - x[1])[0];
          const others = data.filter((n) => String(n) !== top[0]);
          return mcq(s, `${shown} өгөгдлийн моод?`, Number(top[0]), [others[0], others[others.length - 1], med], `Хамгийн олон давтагдсан утга ${top[0]}.`);
        },
      ])();
    },
    "7-10": (s) => {
      const p = ri(5, 95) / 100;
      return mcq(s, `A үзэгдлийн магадлал ${fmt(p)} бол эсрэг үзэгдлийн магадлал?`, 1 - p, [p, 1 + p, p / 2], `1 − ${fmt(p)} = ${fmt(1 - p)}.`);
    },
    "8-0": (s) => pick([
      () => {
        const b = ri(2, 5);
        const m = ri(2, 6 + s);
        const n = ri(2, 6 + s);
        return mcq(s, `${b}${sup(m)} · ${b}${sup(n)} = ${b}^? (илтгэгч)`, m + n, [m * n, Math.abs(m - n), m + n + 1], "aᵐ · aⁿ = aᵐ⁺ⁿ.");
      },
      () => {
        const A = ri(8, 20);
        const B = ri(8, 20);
        const I = ri(2, 7);
        return mcq(s, `|A| = ${A}, |B| = ${B}, |A∩B| = ${I} бол |A∪B| = ?`, A + B - I, [A + B, A + B + I, A + B - 2 * I], `|A∪B| = |A| + |B| − |A∩B|.`);
      },
    ])(),
    "8-1": (s) => {
      const n = ri(1000, 99999);
      const sig = s >= 2 ? 3 : 2;
      const p = Math.floor(Math.log10(n)) + 1 - sig;
      const r = Math.round(n / 10 ** p) * 10 ** p;
      return mcq(s, `${n}-ийг ${sig} чухал цифрээр тоймло.`, r, [Math.floor(n / 10 ** p) * 10 ** p === r ? r + 10 ** p : Math.floor(n / 10 ** p) * 10 ** p, Math.round(n / 10 ** (p + 1)) * 10 ** (p + 1), Math.round(n / 10 ** p)], `Эхний ${sig} цифрийг үлдээж, дараагийн цифрээр тоймлоно.`);
    },
    "8-2": (s) => pick([
      () => {
        const old = ri(2, 20) * 50;
        const p = pick([10, 20, 25, 30, 40, 50]);
        const nw = old * (100 + p) / 100;
        return mcq(s, `Үнэ ${old}₮-өөс ${nw}₮ болсон. Хэдэн хувиар өссөн бэ?`, `${p}%`, [`${fmt((nw - old) / nw * 100)}%`, `${nw - old}%`, `${p + 10}%`], `(${nw} − ${old})/${old}·100 = ${p}%.`);
      },
      () => {
        const w1 = ri(3, 8);
        const t = ri(2, 6) * ri(2, 4);
        const total = w1 * t;
        const opts = [];
        for (let w = 2; w <= total; w += 1) if (total % w === 0 && w !== w1) opts.push(w);
        const w2 = pick(opts.length ? opts : [total]);
        return mcq(s, `${w1} ажилчин ажлыг ${t} хоногт хийдэг. ${w2} ажилчин хэдэн хоногт хийх вэ?`, total / w2, [t * w2 / w1, t + w2 - w1, total], `Урвуу пропорц: ${w1}·${t} = ${w2}·x, x = ${fmt(total / w2)}.`);
      },
    ])(),
    "8-3": (s) => pick([
      () => {
        const a = ri(2, 9) * (Math.random() < 0.5 ? -1 : 1);
        return mcq(s, `(x ${signed(a)})² = x² + ?·x + ${a * a}`, 2 * a, [a, a * a, -2 * a], `(x+a)² = x² + 2ax + a², 2·${paren(a)} = ${fmt(2 * a)}.`);
      },
      () => {
        const n = ri(2, 12);
        return mcq(s, `x² − ${n * n}-ийг үржигдэхүүн болгон задал.`, `(x − ${n})(x + ${n})`, [`(x − ${n})²`, `(x + ${n})²`, `(x − ${n * n})(x + 1)`], "a² − b² = (a − b)(a + b).");
      },
      () => {
        const a = ri(30, 80);
        const b = ri(1, 9);
        return mcq(s, `${a}² − ${b}² = ?`, (a - b) * (a + b), [(a - b) ** 2, a * a - b, (a - b) * (a - b) + b], `(${a} − ${b})(${a} + ${b}) = ${a - b}·${a + b}.`);
      },
    ])(),
    "8-4": (s) => pick([
      () => {
        const m = ri(-4, 5) || 3;
        const x1 = ri(-5, 3);
        const x2 = x1 + ri(1, 4);
        const y1 = ri(-6, 6);
        const y2 = y1 + m * (x2 - x1);
        return mcq(s, `${pt(x1, y1)} ба ${pt(x2, y2)} цэгийг дайрсан шулууны налалт?`, m, [-m, frac(x2 - x1, y2 - y1 || 1), m + 1], `k = (y₂ − y₁)/(x₂ − x₁) = ${fmt(y2 - y1)}/${x2 - x1} = ${fmt(m)}.`);
      },
      () => {
        const a = ri(1, 4) * (Math.random() < 0.3 ? -1 : 1);
        const x = ri(-4, 4) || 2;
        return mcq(s, `y = ${a === 1 ? "" : a === -1 ? "−" : fmt(a)}x² функцэд x = ${fmt(x)} үед y = ?`, a * x * x, [a * x * 2, -a * x * x, a * x], `y = ${fmt(a)}·${paren(x)}² = ${fmt(a * x * x)}.`);
      },
    ])(),
    "8-5": (s) => pick([
      () => {
        const [u, v, w] = pick(TRIPLES);
        const k = s === 1 ? 1 : ri(1, 3);
        return pick([
          () => mcq(s, `Катетууд ${u * k} ба ${v * k} бол гипотенуз?`, w * k, [(u + v) * k, w * k + 1, Math.abs(v - u) * k], `c = √(${u * k}² + ${v * k}²) = ${w * k}.`),
          () => mcq(s, `Гипотенуз ${w * k}, нэг катет ${u * k} бол нөгөө катет?`, v * k, [(w - u) * k, w * k + u * k, v * k + 1], `√(${w * k}² − ${u * k}²) = ${v * k}.`),
        ])();
      },
      () => {
        const n = ri(5, 12);
        return mcq(s, `Гүдгэр ${n} өнцөгтийн дотоод өнцгүүдийн нийлбэр?`, `${(n - 2) * 180}°`, [`${n * 180}°`, "360°", `${(n - 1) * 180}°`], `(n − 2)·180° = ${(n - 2) * 180}°.`);
      },
      () => {
        const n = pick([5, 6, 8, 9, 10, 12]);
        return mcq(s, `Зөв ${n} өнцөгтийн нэг гадаад өнцөг?`, `${360 / n}°`, [`${180 - 360 / n}°`, `${180 / n}°`, `${(n - 2) * 180}°`], `Гадаад өнцгүүдийн нийлбэр 360°: 360/${n} = ${360 / n}°.`);
      },
    ])(),
    "8-6": (s) => pick([
      () => {
        const [u, v, w] = pick(TRIPLES.slice(0, 3));
        const x1 = ri(-5, 5);
        const y1 = ri(-5, 5);
        return mcq(s, `A${pt(x1, y1)} ба B${pt(x1 + u, y1 + v)} цэгийн хоорондох зай?`, w, [u + v, w * w, Math.abs(v - u)], `√(${u}² + ${v}²) = ${w}.`);
      },
      () => {
        const k = ri(2, 4);
        const a = ri(2, 9);
        return mcq(s, `Коэффициент нь ${k} гомотетоор ${a} см хэрчим хэдэн см болох вэ?`, `${k * a} см`, [`${a + k} см`, `${k * k * a} см`, `${a} см`], `Урт ${k} дахин ихэснэ.`);
      },
    ])(),
    "8-7": (s) => pick([
      () => {
        const v = ri(4, 12) * 5;
        const t = ri(2, 5);
        return mcq(s, `${v * t} км замыг ${t} цагт туулсан бол дундаж хурд?`, `${v} км/ц`, [`${v * t * t} км/ц`, `${v + t} км/ц`, `${v / 2} км/ц`], `v = S/t = ${v * t}/${t} = ${v} км/ц.`);
      },
      () => {
        const r = ri(1, 5);
        const h = ri(2, 10);
        return mcq(s, `Радиус ${r}, өндөр ${h} цилиндрийн эзлэхүүн (π-ээр илэрхийл)?`, `${r * r * h}π`, [`${2 * r * h}π`, `${r * h}π`, `${2 * r * r * h}π`], `V = πr²h = π·${r * r}·${h}.`);
      },
    ])(),
    "8-8": (s) => {
      const xs = [ri(1, 3), ri(4, 6), ri(7, 9)];
      const fs = [ri(1, 5), ri(1, 5), ri(1, 5)];
      const n = fs.reduce((t, f) => t + f, 0);
      const sum = xs.reduce((t, x, i) => t + x * fs[i], 0);
      return mcq(s, `Утга ${xs.join(", ")} харгалзан ${fs.join(", ")} удаа давтагдсан. Арифметик дундаж (0.01 хүртэл)?`, Math.round(sum / n * 100) / 100, [Math.round(xs.reduce((t, x) => t + x, 0) / 3 * 100) / 100, sum, Math.round(sum / 3 * 100) / 100], `Σxf / Σf = ${sum}/${n}.`);
    },
    "8-9": (s) => {
      const r = ri(2, 8);
      const b = ri(2, 8);
      const g = ri(2, 8);
      const n = r + b + g;
      return mcq(s, `Уутанд ${r} улаан, ${b} цэнхэр, ${g} ногоон бөмбөг бий. Санамсаргүй авахад улаан эсвэл ногоон гарах магадлал?`, frac(r + g, n), [frac(r * g, n * n), frac(r, n), frac(b, n)], `Нийцгүй үзэгдлүүд: (${r} + ${g})/${n} = ${frac(r + g, n)}.`);
    },
    "9-0": (s) => {
      const k = ri(2, 4 + s);
      const m = pick([2, 3, 5, 6, 7]);
      return mcq(s, `√${k * k * m}-ийг хялбарчил.`, `${k}√${m}`, [`${m}√${k}`, `${k * k}√${m}`, `${k + 1}√${m}`], `√${k * k * m} = √(${k * k}·${m}) = ${k}√${m}.`);
    },
    "9-1": (s) => {
      const a = ri(11, 99) / 10;
      const p = ri(-6, 7) || 3;
      const value = p >= 0 ? fmt(a * 10 ** p) : (a * 10 ** p).toFixed(Math.abs(p) + 1).replace(/0+$/, "");
      return mcq(s, `${value}-ийг стандарт дүрсээр бич.`, `${fmt(a)} × 10${sup(p)}`, [`${fmt(a)} × 10${sup(p + 1)}`, `${fmt(a * 10)} × 10${sup(p - 1)}`, `${fmt(a)} × 10${sup(-p)}`], "A × 10ⁿ, 1 ≤ A < 10.");
    },
    "9-2": (s) => pick([
      () => {
        const P0 = ri(1, 9) * 100000;
        const r = pick([5, 10, 20]);
        const n = 2;
        const A = P0 * (1 + r / 100) ** n;
        return mcq(s, `${P0}₮-г жилийн ${r}% нийлмэл хүүтэй ${n} жил хадгалбал хэд болох вэ?`, `${fmt(A)}₮`, [`${fmt(P0 * (1 + r * n / 100))}₮`, `${fmt(P0 * r / 100 * n)}₮`, `${fmt(P0 * (1 + r / 100))}₮`], `A = P(1 + r)ⁿ = ${P0}·${fmt(1 + r / 100)}².`);
      },
      () => {
        const base = ri(2, 20) * 100;
        const p = pick([10, 20, 25, 40]);
        const down = base * (100 - p) / 100;
        return mcq(s, `Тоо ${base}-аас ${down} болж буурсан. Хэдэн хувиар буурсан бэ?`, `${p}%`, [`${fmt((base - down) / down * 100)}%`, `${100 - p}%`, `${base - down}%`], `(${base} − ${down})/${base}·100 = ${p}%.`);
      },
    ])(),
    "9-3": (s) => pick([
      () => {
        const x = ri(-6, 9);
        const y = ri(-6, 9);
        return mcq(s, `x + y = ${fmt(x + y)}, x − y = ${fmt(x - y)} системийн x = ?`, x, [y, x + y, x - y], `Нэмэх арга: 2x = ${fmt(2 * x)}, x = ${fmt(x)}.`);
      },
      () => {
        const a = ri(2, 5);
        const x0 = ri(-4, 8);
        const b = ri(-10, 10);
        return mcq(s, `${a}x ${signed(b)} > ${fmt(a * x0 + b)} тэнцэтгэл бишийн шийд?`, `x > ${fmt(x0)}`, [`x < ${fmt(x0)}`, `x > ${fmt(-x0)}`, `x ≥ ${fmt(x0 + 1)}`], `${a}x > ${fmt(a * x0)}, x > ${fmt(x0)}.`);
      },
    ])(),
    "9-4": (s) => pick([
      () => {
        const a = ri(2, 5);
        const b = ri(-9, 9);
        const k = ri(-5, 6);
        return mcq(s, `f(x) = ${a}x ${signed(b)} бол f⁻¹(${fmt(a * k + b)}) = ?`, k, [a * (a * k + b) + b, -k, k + 1], `f⁻¹(x) = (x ${signed(-b)})/${a}.`);
      },
      () => {
        const h = ri(-5, 5);
        const k = ri(-8, 8);
        return mcq(s, `y = (x ${signed(-h)})² ${signed(k)} функцийн хамгийн бага утга?`, k, [h, -k, h + k], `Орой (${fmt(h)}, ${fmt(k)}), a > 0.`);
      },
    ])(),
    "9-5": (s) => {
      const [u, v, w] = pick(TRIPLES.slice(0, 4));
      const f = pick(["sin", "cos", "tan"]);
      const val = f === "sin" ? `${u}/${w}` : f === "cos" ? `${v}/${w}` : `${u}/${v}`;
      return mcq(s, `Тэгш өнцөгт гурвалжинд α өнцгийн эсрэг катет ${u}, хажуу катет ${v}, гипотенуз ${w} бол ${f} α = ?`, val, [`${u}/${w}`, `${v}/${w}`, `${u}/${v}`, `${v}/${u}`].filter((o) => o !== val), `${f} = ${f === "sin" ? "эсрэг/гипотенуз" : f === "cos" ? "хажуу/гипотенуз" : "эсрэг/хажуу"}.`);
    },
    "9-6": (s) => pick([
      () => {
        const a = [ri(-6, 6), ri(-6, 6)];
        const b = [ri(-6, 6), ri(-6, 6)];
        return mcq(s, `a⃗ = ${pt(a[0], a[1])}, b⃗ = ${pt(b[0], b[1])} бол a⃗ + b⃗ = ?`, pt(a[0] + b[0], a[1] + b[1]), [pt(a[0] - b[0], a[1] - b[1]), pt(a[0] * b[0], a[1] * b[1]), pt(a[0] + b[1], a[1] + b[0])], "Харгалзах координатуудыг нэмнэ.");
      },
      () => {
        const k = ri(2, 4) * (Math.random() < 0.3 ? -1 : 1);
        const a = [ri(-5, 5), ri(-5, 5)];
        return mcq(s, `a⃗ = ${pt(a[0], a[1])} бол ${fmt(k)}a⃗ = ?`, pt(k * a[0], k * a[1]), [pt(k + a[0], k + a[1]), pt(k * a[0], a[1]), pt(-k * a[0], -k * a[1])], "Координат бүрийг тоогоор үржүүлнэ.");
      },
    ])(),
    "9-7": (s) => {
      const r = ri(2, 12);
      const ang = pick([30, 45, 60, 90, 120, 180]);
      return pick([
        () => mcq(s, `Радиус ${r}, төв өнцөг ${ang}° секторын талбай (π-ээр)?`, `${fmt(ang / 360 * r * r)}π`, [`${fmt(ang / 360 * 2 * r)}π`, `${fmt(r * r)}π`, `${fmt(ang / 180 * r * r)}π`], `S = (${ang}/360)·πr².`),
        () => mcq(s, `Радиус ${r}, төв өнцөг ${ang}° нумын урт (π-ээр)?`, `${fmt(ang / 360 * 2 * r)}π`, [`${fmt(ang / 360 * r * r)}π`, `${fmt(2 * r)}π`, `${fmt(ang / 360 * r)}π`], `l = (${ang}/360)·2πr.`),
      ])();
    },
    "9-8": (s) => {
      const data = Array.from({ length: 7 }, () => ri(1, 30)).sort((x, y) => x - y);
      const shown = [...data].sort(() => Math.random() - 0.5).join(", ");
      const mean = data.reduce((t, n) => t + n, 0) / 7;
      return pick([
        () => mcq(s, `${shown} өгөгдлийн медиан?`, data[3], [Math.round(mean * 100) / 100, data[2] === data[3] ? data[5] : data[2], data[6] - data[0]], `Эрэмбэлбэл ${data.join(", ")}; дунд нь ${data[3]}.`),
        () => mcq(s, `${shown} өгөгдлийн арифметик дундаж (0.01 хүртэл)?`, Math.round(mean * 100) / 100, [data[3], data[6] - data[0], Math.round(mean * 10) / 100], `Нийлбэр ${data.reduce((t, n) => t + n, 0)} / 7.`),
      ])();
    },
    "9-9": (s) => pick([
      () => mcq(s, "Зоос ба шоо зэрэг хаяхад зоос сүлд, шоо 6 буух магадлал?", "1/12", ["1/8", "1/6", "2/3"], "Үл хамаарах: 1/2 · 1/6 = 1/12."),
      () => {
        const p1 = ri(2, 9) / 10;
        const p2 = ri(2, 9) / 10;
        return mcq(s, `Үл хамаарах A, B үзэгдлийн магадлал ${fmt(p1)} ба ${fmt(p2)}. Хоёулаа илрэх магадлал?`, p1 * p2, [p1 + p2, Math.abs(p1 - p2), 1 - p1 * p2], `P(A∩B) = ${fmt(p1)}·${fmt(p2)}.`);
      },
      () => {
        const n = ri(2, 4);
        return mcq(s, `Зоосыг ${n} удаа хаяхад бүгд сүлд буух магадлал?`, `1/${2 ** n}`, [`1/${2 * n}`, `${n}/${2 ** n}`, "1/2"], `(1/2)${sup(n)} = 1/${2 ** n}.`);
      },
    ])(),
  };

  const LEVEL_NAMES = { 1: "Мэдлэг, ойлголт", 2: "Чадвар", 3: "Хэрэглээ" };

  let serial = 0;
  function instantiate(base, grade, topicKey, source) {
    const order = base.options.map((_, i) => i).sort(() => Math.random() - 0.5);
    serial += 1;
    return {
      id: `${source === "bank" ? base.id : "g"}-${Date.now().toString(36)}-${serial}`,
      bankId: source === "bank" ? base.id : null,
      grade,
      topicKey,
      unit: base.unit || null,
      level: base.level,
      text: base.text,
      options: order.map((i) => base.options[i]),
      answer: order.indexOf(base.answer),
      solution: base.solution,
      source,
    };
  }

  function topicsOf(grade) {
    return (window.CURRICULUM[String(grade)] || []);
  }

  function generate(topicKey, level) {
    const g = GEN[topicKey];
    if (!g) return null;
    return g(level);
  }

  function buildQuestions({ grade, topicKey = null, count = 10, level = null, bankFirst = true }) {
    const keys = topicKey ? [topicKey] : topicsOf(grade).map((t) => t.key);
    let bank = [];
    keys.forEach((k) => (RAW[k] || []).forEach((p) => bank.push({ p, k })));
    if (level) bank = bank.filter(({ p }) => p.level === level);
    bank.sort(() => Math.random() - 0.5);
    const out = [];
    const bankShare = bankFirst ? Math.min(bank.length, Math.ceil(count * 0.6)) : 0;
    bank.slice(0, bankShare).forEach(({ p, k }) => out.push(instantiate(p, grade, k, "bank")));
    const seen = new Set(out.map((q) => q.text));
    let guard = 0;
    while (out.length < count && guard < count * 30) {
      guard += 1;
      const k = keys[Math.floor(Math.random() * keys.length)];
      const lvl = level || ri(1, 3);
      const q = generate(k, lvl);
      if (!q || seen.has(q.text)) continue;
      seen.add(q.text);
      out.push(instantiate(q, grade, k, "gen"));
    }
    return out.sort(() => Math.random() - 0.5);
  }

  function unitsFor(topicKey) {
    return BANK_TOPIC_UNITS.filter((u) => u.topicKey === topicKey);
  }

  function bankCount(topicKey) {
    return (RAW[topicKey] || []).length;
  }

  function topicTitle(key) {
    const [g] = key.split("-");
    const t = topicsOf(g).find((x) => x.key === key);
    return t ? niceTitle(t.title) : key;
  }

  function niceTitle(title) {
    const lower = title.toLocaleLowerCase("mn");
    return lower.charAt(0).toLocaleUpperCase("mn") + lower.slice(1);
  }

  window.MathBank = {
    GRADES: [6, 7, 8, 9],
    LEVEL_NAMES,
    topicsOf,
    buildQuestions,
    unitsFor,
    bankCount,
    topicTitle,
    niceTitle,
    fmt,
  };
})();
