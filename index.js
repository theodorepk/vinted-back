const express = require(`express`);
const cors = require(`cors`);
const formidable = require(`express-formidable`);
const mongoose = require(`mongoose`);
require(`dotenv`).config();

const app = express();
app.use(formidable());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

const userRoutes = require(`./routes/users`);
const offerRoutes = require(`./routes/offer`);
const payRoutes = require(`./routes/pay`);

app.use(userRoutes);
app.use(offerRoutes);
app.use(payRoutes);

app.all(`*`, (req, res) => {
  try {
    res.status(404).json({ message: `This route doesn't exist` });
  } catch (error) {
    res.status(400).json(error.message);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server start`);
});
