// segment.js：分段（基线：全部放一段、不论大小）
export function partition(records, limit) {
  return { segments: [records.map((record) => record.id)], sizes: [records.length] };
}
