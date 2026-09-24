const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

process.env.JWT_SECRET = "test-only-secret";

// Replace only the User model while loading Express. This exercises the real
// registration route/controller without requiring a running MongoDB instance.
const userModelPath = require.resolve("../src/models/user.model");
const users = [];
const publicUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};
const FakeUser = {
  async exists(query) {
    return users.some((user) => query.$or.some((condition) =>
      (condition.email && user.email === condition.email) || (condition.username && user.username === condition.username)
    ));
  },
  async create(data) {
    const user = { _id: String(users.length + 1), walletBalance: 1000, ...data, toJSON() { return publicUser(this); } };
    users.push(user);
    return user;
  },
  findOne(query) {
    const user = users.find((item) => item.email === query.email);
    return { select: async () => user && { ...user, comparePassword: async (password) => password === user.password, toJSON() { return publicUser(this); } } };
  },
};

delete require.cache[userModelPath];
require.cache[userModelPath] = { id: userModelPath, filename: userModelPath, loaded: true, exports: FakeUser };
const app = require("../src/app");

const request = (server, path, body) => new Promise((resolve, reject) => {
  const data = JSON.stringify(body);
  const req = http.request({ port: server.address().port, path, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } }, (res) => {
    let output = "";
    res.on("data", (chunk) => { output += chunk; });
    res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(output) }));
  });
  req.on("error", reject); req.end(data);
});

test("registration creates a player account with the $1,000 starting balance", async () => {
  const server = app.listen(0);
  try {
    const response = await request(server, "/api/users/register", { displayName: "Alex", username: "alex_01", email: "alex@example.com", password: "password123", role: "admin" });
    assert.equal(response.status, 201);
    assert.equal(response.body.user.role, "player");
    assert.equal(response.body.user.walletBalance, 1000);
    assert.ok(response.body.token);
    assert.equal(response.body.user.password, undefined);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test("login returns a token for a registered user", async () => {
  const server = app.listen(0);
  try {
    const response = await request(server, "/api/users/login", { email: "alex@example.com", password: "password123" });
    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, "alex@example.com");
    assert.ok(response.body.token);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
