const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Room = require("../src/models/room.model");

const userId = new mongoose.Types.ObjectId();

test("a room defaults to exactly two seats and a waiting state", async () => {
  const room = new Room({ name: "Bangkok Derby", host: userId });
  await room.validate();

  assert.equal(room.maxPlayers, 2);
  assert.equal(room.status, "waiting");
  assert.equal(room.budgetLimit, 1000);
  assert.match(room.code, /^[A-Z0-9]{6}$/);
});

test("a room rejects a budget other than its fixed $1,000 limit", async () => {
  const room = new Room({ name: "Invalid budget", host: userId, budgetLimit: 500 });
  await assert.rejects(room.validate(), /budgetLimit/);
});

test("a room rejects a capacity other than two players", async () => {
  const room = new Room({ name: "Invalid room", host: userId, maxPlayers: 3 });
  await assert.rejects(room.validate(), /maxPlayers/);
});

test("a room only accepts supported lifecycle states", async () => {
  const room = new Room({ name: "Invalid status", host: userId, status: "open" });
  await assert.rejects(room.validate(), /status/);
});
