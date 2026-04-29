const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000"
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

// Routes
const testRoute = require("./routes/test.route");
const authRoutes = require("./modules/auth/auth.routes");
const propertyRoutes = require("./modules/property/property.routes");
const unitRoutes = require("./modules/unit/unit.routes");
const tenancyRoutes = require("./modules/tenancy/tenancy.routes");
const { protect } = require("./middleware/auth.middleware");
const rentRoutes = require("./modules/rent/rent.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const receiptRoutes = require("./modules/receipt/receipt.routes");

app.use("/db-test", testRoute);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/tenancies", tenancyRoutes);
app.use("/api/rent", rentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/receipts", receiptRoutes);

app.get("/protected", protect, (req, res) => {
  res.json({ message: "Protected route", user: req.user });
});

const PORT = process.env.PORT || 5000;

const http = require("http");
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
