// recover.js：认出残尾、丢掉、逐段校验
//
// tornAt 是写入中断的记录下标（与样例 torn_at 同义）：该记录是断电留下的
// 半截残尾，整条丢弃并计入 torn，其余记录保留为 kept。-1/0 为“无残尾”哨兵
//（既有自检以 -1 表示无残尾）。
//
// 逐段校验：一条记录的校验和必须等于其字节数异或固定盐值 8，不符即损坏。
// 残尾所在段本身就是截断段，直接定位为损坏段（corrupt_at 给段号，无则 -1）
// 且不抛错；若残尾之外的保留记录出现校验不符，属于硬损坏，抛出
// E_CHECKSUM_MISMATCH 并在 error.segment 上给出段位置。
// 单次线性遍历配合编号到记录的索引表完成，十万记录不嵌套重扫。

const CHECKSUM_SALT = 8;
export const CHECKSUM_ERROR = "E_CHECKSUM_MISMATCH";

export function recover(segments, records, tornAt) {
  const byId = new Map();
  records.forEach((record, index) => byId.set(record.id, { record, index }));

  const torn = [];
  const tornIndex = tornAt >= 1 ? tornAt : -1;
  if (tornIndex >= 0 && tornIndex < records.length) {
    torn.push(records[tornIndex].id);
  }

  const kept = [];
  let corruptAt = -1;

  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
    for (const id of segments[segmentIndex]) {
      const entry = byId.get(id);
      if (!entry) continue;
      const { record, index } = entry;
      if (index === tornIndex) {
        if (corruptAt === -1) corruptAt = segmentIndex;
        continue;
      }
      if (record.checksum !== undefined &&
          record.checksum !== ((record.bytes ^ CHECKSUM_SALT) >>> 0)) {
        const error = new Error(
          "checksum mismatch at segment " + segmentIndex);
        error.code = CHECKSUM_ERROR;
        error.segment = segmentIndex;
        throw error;
      }
      kept.push(id);
    }
  }

  return {
    kept,
    torn,
    corrupt_at: corruptAt,
    checksum_ok: corruptAt === -1,
  };
}
