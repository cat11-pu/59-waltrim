import fs from "node:fs";
import { partition } from "./segment.js";
import { recover } from "./recover.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/wal.json", "utf8"));
const parts = partition(spec.records, spec.limit);
const back = recover(parts.segments, spec.records, spec.torn_at);
const view = render(spec);

emit("分段 =", parts.segments);
emit("每段字节数 =", parts.sizes);
emit("保留的记录 =", back.kept);
emit("被丢弃的残尾 =", back.torn);
emit("损坏段的位置 =", back.corrupt_at);
emit("校验是否通过 =", back.checksum_ok);
emit("分段上限 =", spec.limit);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  const broken = recover([["r0"]], [{ id: "r0", bytes: 3, checksum: 1 }], 0);
  emit("校验不符的错误码", broken.checksum_ok ? "no-error" : (broken.code || "no-code"));
} catch (error) {
  emit("校验不符的错误码", error.code || error.message);
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "分段": [
    [
      "r0",
      "r1"
    ],
    [
      "r2",
      "r3"
    ]
  ],
  "每段字节数": [
    7,
    7
  ],
  "保留的记录": [
    "r0",
    "r1",
    "r2"
  ],
  "被丢弃的残尾": [
    "r3"
  ],
  "损坏段的位置": 1,
  "校验是否通过": false,
  "分段上限": 8
};
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (JSON.stringify(got) === JSON.stringify(want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
