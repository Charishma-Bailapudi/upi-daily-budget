require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initCronJobs } = require("./src/services/cronService");

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  initCronJobs();

  app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend server:", error);
  process.exit(1);
});
