// recover.js：残尾恢复与逐段校验（单趟线性扫描）

// 记录帧校验和 = 固定标签字节 + 载荷字节数（样例：8 + bytes）。
const FRAME_TAG_BYTES = 8;

function checksumOf(record) {
  return FRAME_TAG_BYTES + (Number(record.bytes) || 0);
}

export function recover(segments, records, tornAt) {
  const byId = new Map();
  const tornIndex = Number.isInteger(tornAt) ? tornAt : -1;
  records.forEach((record, index) => {
    byId.set(record.id, { record, index });
  });

  const torn = [];
  const kept = [];
  const tornIds = new Set();
  const tornRecord = tornIndex >= 0 && tornIndex < records.length ? records[tornIndex] : null;
  if (tornRecord) {
    torn.push(tornRecord.id);
    tornIds.add(tornRecord.id);
  }

  // 残尾先整条丢弃（保留集合与残尾不相交），随后逐段校验全部记录。
  for (const record of records) {
    if (!tornIds.has(record.id)) kept.push(record.id);
  }

  let corruptAt = -1;
  let checksumOk = true;
  for (let segmentAt = 0; segmentAt < segments.length; segmentAt += 1) {
    let tornMismatchHere = false;
    for (const id of segments[segmentAt]) {
      const entry = byId.get(id);
      if (!entry) continue;
      const { record } = entry;
      if (record.checksum === undefined || record.checksum === null) continue;
      if (Number(record.checksum) === checksumOf(record)) continue;
      // 校验不符：残尾记录报损坏段位置；保留记录是真损坏，按异常路径抛出。
      if (tornIds.has(id)) { tornMismatchHere = true; continue; }
      const error = new Error("checksum mismatch at segment " + segmentAt);
      error.code = "E_CHECKSUM_MISMATCH";
      error.corrupt_at = segmentAt;
      error.segment = segmentAt;
      error.record = id;
      throw error;
    }
    if (tornMismatchHere) {
      checksumOk = false;
      if (corruptAt === -1) corruptAt = segmentAt;
    }
  }

  const result = { kept, torn, corrupt_at: corruptAt, checksum_ok: checksumOk };
  if (!checksumOk) result.code = "E_CHECKSUM_MISMATCH";
  return result;
}
