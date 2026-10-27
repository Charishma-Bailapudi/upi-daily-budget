function getDateParts(timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );
}

function getTodayDateString(timeZone = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getDaysInCurrentMonth(timeZone = "Asia/Kolkata") {
  const { year, month } = getDateParts(timeZone);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

module.exports = { getTodayDateString, getDaysInCurrentMonth };
