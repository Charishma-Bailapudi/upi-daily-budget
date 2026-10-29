const templatesByStatus = {
  GREEN: [
    "Spent ₹{amount} at {merchant}? Look at you staying under budget. Don't let this tiny win get to your head.",
    "Only ₹{amount} at {merchant}? Your wallet is actually smiling for once. You still have ₹{remaining} left today.",
    "Responsible adulting detected: ₹{amount} spent at {merchant} on {category}. Still in the safe zone with ₹{remaining} remaining. Don't blow it now!",
    "A rare sight! ₹{remaining} surplus remaining after spending ₹{amount} at {merchant}. Is this self-control or did your card decline on something bigger?",
  ],
  YELLOW: [
    "₹{amount} at {merchant}? You've burned through {percentSpent}% of today's cap. One more impulse buy and dinner is water and sleep.",
    "Careful! You only have ₹{remaining} left for the day. {merchant} was nice, but your bank account is sweating right now.",
    "Warning lights flashing 🟡: ₹{amount} at {merchant} brought today's spend to ₹{totalSpent} out of ₹{dailyCap}.",
    "₹{amount} at {merchant} has you operating at {percentSpent}% of your daily allowance. Proceed with caution unless you enjoy instant noodles.",
  ],
  RED: [
    "🚨 Budget completely annihilated! ₹{amount} at {merchant} shoved you into a ₹{deficit} deficit. Delete your UPI app right now.",
    "Congratulations! That ₹{amount} at {merchant} has you at {percentSpent}% of your daily limit. Your future self is actively filing a grievance against you.",
    "₹{amount} at {merchant} brought today's spend to ₹{totalSpent} against a ₹{dailyCap} cap. Was it worth your financial peace of mind?",
    "₹{amount} at {merchant} breached your budget by ₹{deficit}. If reckless spending was an Olympic sport, you'd take home the gold medal today.",
    "You just gave {merchant} ₹{amount} that you literally did not have. May your remaining balance rest in peace.",
  ],
};

const categoryPunchlines = {
  food: [
    "Your stomach is happy, but your bank statement is in mourning.",
  ],
  shopping: [
    "Retail therapy won't fix this, but a budget check might.",
  ],
  entertainment: [
    "Hope that dopamine hit lasts until your next paycheck.",
  ],
  travel: [
    "Traveling in style while your savings balance travels downhill.",
  ],
  utilities: [
    "Paying the bills hurts, but overshooting the daily cap hurts more.",
  ],
};

const categoryAliases = {
  bills: "utilities",
  food_dining: "food",
  groceries: "food",
};

function getFiniteNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getRoast(context = {}) {
  const healthStatus = ["GREEN", "YELLOW", "RED"].includes(context.healthStatus)
    ? context.healthStatus
    : "GREEN";
  const amount = getFiniteNumber(context.amount);
  const totalSpent = getFiniteNumber(context.totalSpent);
  const dailyCap = getFiniteNumber(context.dailyCap);
  const remaining = getFiniteNumber(context.remaining);
  const percentSpent =
    dailyCap > 0 ? Math.round((totalSpent / dailyCap) * 100) : 100;
  const deficit = remaining < 0 ? Math.abs(remaining) : 0;
  const merchant =
    typeof context.merchant === "string" && context.merchant.trim()
      ? context.merchant.trim()
      : "somewhere";
  const category =
    typeof context.category === "string" && context.category.trim()
      ? context.category.trim()
      : "spending";
  const template = getRandomItem(templatesByStatus[healthStatus]);
  const substitutions = {
    amount: formatAmount(amount),
    merchant,
    category,
    totalSpent: formatAmount(totalSpent),
    dailyCap: formatAmount(dailyCap),
    remaining: formatAmount(remaining),
    deficit: formatAmount(deficit),
    percentSpent,
  };
  let roast = template.replace(/\{(\w+)\}/g, (_, key) => substitutions[key]);

  const normalizedCategory = category.toLowerCase().replace(/[\s-]+/g, "_");
  const punchlineCategory =
    categoryAliases[normalizedCategory] || normalizedCategory;
  const punchlines = categoryPunchlines[punchlineCategory];
  const isHighSeverity = healthStatus === "YELLOW" || healthStatus === "RED";

  if (punchlines && isHighSeverity && Math.random() < 0.5) {
    roast += ` ${getRandomItem(punchlines)}`;
  }

  return roast;
}

module.exports = { getRoast };
