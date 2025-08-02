const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

const authRoutes = require("./routes/authRoutes");
const { verifyToken } = require("./middleware/verifyToken");

app.use("/auth", authRoutes);

app.get("/protected", verifyToken, (req, res) => {
  res.status(200).json({ message: "Access granted to protected route", user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
