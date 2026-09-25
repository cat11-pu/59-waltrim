// app.js：渲染结果
import { partition } from "./segment.js";
import { recover } from "./recover.js";

export function render(spec) {
  const parts = partition(spec.records, spec.limit);
  const back = recover(parts.segments, spec.records, spec.torn_at);
  return { segments: parts.segments, sizes: parts.sizes, kept: back.kept,
           torn: back.torn, corrupt_at: back.corrupt_at, checksum_ok: back.checksum_ok };
}
