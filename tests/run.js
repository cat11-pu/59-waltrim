import assert from "node:assert";
import { partition } from "../segment.js";
import { recover } from "../recover.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const records = [{ id: "r0", bytes: 3 }, { id: "r1", bytes: 4 }];

check("partition returns segments", () => {
  assert.ok(Array.isArray(partition(records, 4).segments));
});

check("partition returns sizes", () => {
  assert.ok(Array.isArray(partition(records, 4).sizes));
});

check("recover reports torn list", () => {
  assert.ok(Array.isArray(recover([], records, -1).torn));
});

check("recover reports corrupt_at", () => {
  assert.strictEqual(typeof recover([], records, -1).corrupt_at, "number");
});

check("render exposes checksum_ok", () => {
  assert.strictEqual(typeof render({ records: records, limit: 4, torn_at: -1 }).checksum_ok, "boolean");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
