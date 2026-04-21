const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000"
}));app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

const testRoute = require("./routes/test.route");

app.use("/db-test", testRoute);

const PORT = process.env.PORT || 5000;

const http = require("http");
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});