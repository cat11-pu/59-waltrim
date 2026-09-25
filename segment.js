// segment.js：按字节上限线性分段
//
// 顺序扫描记录，把记录编号放进当前段并累加字节数；若再放一条会使该段
// 字节数超过 limit，则先新开一段。单次遍历完成，不做嵌套重扫。
// 返回 { segments: 每段的记录编号, sizes: 每段的字节数 }。
export function partition(records, limit) {
  const segments = [];
  const sizes = [];
  let currentIds = null;
  let currentSize = 0;
  for (const record of records) {
    if (currentIds === null || currentSize + record.bytes > limit) {
      currentIds = [];
      currentSize = 0;
      segments.push(currentIds);
      sizes.push(0);
    }
    currentIds.push(record.id);
    currentSize += record.bytes;
    sizes[sizes.length - 1] = currentSize;
  }
  return { segments, sizes };
}
