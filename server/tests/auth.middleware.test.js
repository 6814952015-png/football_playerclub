const test = require("node:test");
const assert = require("node:assert/strict");
const { authorize } = require("../src/middlewares/auth.middleware");

const invoke = (role) => new Promise((resolve) => {
  const req = { user: { role } };
  const res = { status(code) { this.statusCode = code; return this; }, json(body) { resolve({ statusCode: this.statusCode, body, next: false }); } };
  authorize("admin")(req, res, () => resolve({ next: true }));
});

test("admin-only middleware rejects a player", async () => {
  const result = await invoke("player");
  assert.equal(result.statusCode, 403);
  assert.match(result.body.message, /Administrator/);
});

test("admin-only middleware allows an admin", async () => {
  assert.deepEqual(await invoke("admin"), { next: true });
});
