import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryRateLimiter } from "./rate-limit.js";

test("memory limiter allows the configured count and returns retry metadata", () => {
  const limiter = createMemoryRateLimiter(1000);
  assert.equal(limiter.check("otp:127.0.0.1", 2).allowed, true);
  assert.equal(limiter.check("otp:127.0.0.1", 2).allowed, true);
  const blocked = limiter.check("otp:127.0.0.1", 2);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);
});
