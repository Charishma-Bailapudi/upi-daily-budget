const assert = require("node:assert/strict");
const { calculateDailyAllowance } = require("../src/services/budgetEngine");
const { classifyMerchant } = require("../src/services/categoryClassifier");
const {
  getDaysInCurrentMonth,
  getTodayDateString,
} = require("../src/utils/dateUtils");

assert.equal(calculateDailyAllowance(100_000, 0, 31), 3_225);

assert.equal(classifyMerchant("Starbucks"), "food_dining");
assert.equal(classifyMerchant("starbucks coffee"), "food_dining");
assert.equal(classifyMerchant("SWIGGY"), "food_dining");

assert.equal(classifyMerchant("Blinkit"), "groceries");
assert.equal(classifyMerchant("Zepto"), "groceries");
assert.equal(classifyMerchant("Uber"), "travel");
assert.equal(classifyMerchant("Airtel"), "bills");
assert.equal(classifyMerchant("Unknown merchant"), "other");

assert.throws(() => calculateDailyAllowance(0), /income/i);
assert.throws(() => calculateDailyAllowance(100, 100), /savings goal/i);
assert.throws(() => calculateDailyAllowance(100, 0, 0), /days in month/i);

assert.match(getTodayDateString(), /^\d{4}-\d{2}-\d{2}$/);
assert.ok(getDaysInCurrentMonth() >= 28 && getDaysInCurrentMonth() <= 31);

console.log("Day 05 budget math and category classifier tests passed.");
