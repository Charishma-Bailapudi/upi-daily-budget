const assert = require("node:assert/strict");
const { getRoast } = require("../src/services/roastService");

for (const status of ["GREEN", "YELLOW", "RED"]) {
  const roast = getRoast({
    healthStatus: status,
    amount: 250,
    merchant: "Swiggy",
    category: "FOOD",
    totalSpent: status === "GREEN" ? 500 : 1200,
    dailyCap: 1000,
    remaining: status === "RED" ? -200 : 100,
  });

  assert.equal(typeof roast, "string");
  assert.match(roast, /250/);
  assert.match(roast, /Swiggy/);
  assert.doesNotMatch(roast, /undefined|NaN/);
  assert.ok(roast.length > 0);
}

const missingContextRoast = getRoast();
assert.doesNotMatch(missingContextRoast, /undefined|NaN/);

const originalRandom = Math.random;
try {
  Math.random = () => 0.21;
  const zeroCapRoast = getRoast({
    healthStatus: "RED",
    amount: 10,
    merchant: "Cafe",
    dailyCap: 0,
    totalSpent: 20,
    remaining: -20,
  });
  assert.match(zeroCapRoast, /100%/);
  assert.doesNotMatch(zeroCapRoast, /undefined|NaN/);

  Math.random = () => 0;
  const deficitRoast = getRoast({
    healthStatus: "RED",
    amount: 10,
    merchant: "Cafe",
    category: "FOOD",
    dailyCap: 100,
    totalSpent: 120,
    remaining: -20,
  });
  assert.match(deficitRoast, /₹20 deficit/);
  assert.match(deficitRoast, /stomach is happy/);
} finally {
  Math.random = originalRandom;
}

console.log("Day 09 spending alert roast tests passed.");
