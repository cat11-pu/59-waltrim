// recover.js：恢复与校验（基线：不认残尾、不校验）
export function recover(segments, records, tornAt) {
  return { kept: records.map((record) => record.id), torn: [], corrupt_at: -1, checksum_ok: true };
}
