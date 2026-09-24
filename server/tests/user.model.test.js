const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../src/models/user.model");

const userFields = () => ({ displayName: "Test Player", username: `player_${Date.now()}`, email: `player_${Date.now()}@example.com`, password: "password123" });

test("a registered user is a player by default", async () => {
  const user = new User(userFields());
  await user.validate();
  assert.equal(user.role, "player");
  assert.equal(user.walletBalance, 1000);
});

test("a user role must be player or admin", async () => {
  const user = new User({ ...userFields(), role: "owner" });
  await assert.rejects(user.validate(), /role/);
});
