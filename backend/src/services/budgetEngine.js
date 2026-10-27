const { getDaysInCurrentMonth } = require("../utils/dateUtils");

function calculateDailyAllowance(
  monthlyIncome,
  monthlySavingsGoal = 0,
  customDaysInMonth = null,
) {
  if (typeof monthlyIncome !== "number" || !Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
    throw new TypeError("Monthly income must be a number greater than zero");
  }

  if (
    typeof monthlySavingsGoal !== "number" ||
    !Number.isFinite(monthlySavingsGoal) ||
    monthlySavingsGoal < 0 ||
    monthlySavingsGoal >= monthlyIncome
  ) {
    throw new TypeError(
      "Monthly savings goal must be a non-negative number less than monthly income",
    );
  }

  const daysInMonth = customDaysInMonth ?? getDaysInCurrentMonth();

  if (!Number.isInteger(daysInMonth) || daysInMonth <= 0) {
    throw new TypeError("Days in month must be a positive integer");
  }

  return Math.floor((monthlyIncome - monthlySavingsGoal) / daysInMonth);
}

module.exports = { calculateDailyAllowance };
