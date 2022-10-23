const User = require("../models/Users");

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization.replace(`Bearer `, ``);

    const user = await User.findOne({ token }).select(`account _id`);
    if (user) {
      req.user = user;
      next();
    } else {
      res.status(401).json({ message: `Unauthorized` });
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
};

module.exports = isAuthenticated;
