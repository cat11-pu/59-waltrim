// segment.js：按字节上限线性分段
// 贪心单趟扫描：当前段累计字节 + 新记录字节不超过上限就并入，否则新开一段。
export function partition(records, limit) {
  const max = Number.isFinite(Number(limit)) ? Number(limit) : Infinity;
  const segments = [];
  const sizes = [];
  let current = null;
  let currentSize = 0;
  let currentAt = -1;
  for (const record of records) {
    const size = Number.isFinite(Number(record.bytes)) ? Number(record.bytes) : 0;
    if (current !== null && currentSize + size <= max) {
      current.push(record.id);
      currentSize += size;
      sizes[currentAt] = currentSize;
    } else {
      current = [record.id];
      currentSize = size;
      currentAt = segments.length;
      segments.push(current);
      sizes.push(currentSize);
    }
  }
  return { segments, sizes };
}
