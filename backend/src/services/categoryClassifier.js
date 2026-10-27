const merchantCategories = [
  {
    category: "food_dining",
    patterns: ["Starbucks", "Swiggy", "Zomato", "McDonalds", "KFC"],
  },
  {
    category: "groceries",
    patterns: ["Blinkit", "Zepto", "Instamart", "BigBasket"],
  },
  {
    category: "travel",
    patterns: ["Uber", "Ola", "Rapido", "Metro"],
  },
  {
    category: "shopping",
    patterns: ["Amazon", "Flipkart", "Myntra", "Zara"],
  },
  {
    category: "bills",
    patterns: ["Airtel", "Jio", "BESCOM", "Electricity", "Wifi"],
  },
];

function classifyMerchant(merchantString) {
  if (typeof merchantString !== "string") {
    return "other";
  }

  const merchant = merchantString.toLowerCase();
  const match = merchantCategories.find(({ patterns }) =>
    patterns.some((pattern) => merchant.includes(pattern.toLowerCase())),
  );

  return match ? match.category : "other";
}

module.exports = { classifyMerchant };
