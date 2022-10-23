const express = require(`express`);
const router = express.Router();
const formidableMiddleware = require("express-formidable");
const createStripe = require("stripe");
router.use(formidableMiddleware());

const isAuthenticated = require("../middleware/isAuthenticated");

const stripe = createStripe(process.env.STRIPE);

router.post("/pay", isAuthenticated, async (req, res) => {
  try {
    // send the token to stripe

    let response = await stripe.charges.create({
      amount: (req.fields.amount * 100).toFixed(0), //conversion (if not payment will on cents)
      currency: "eur",
      description: `Paiement vinted by ${req.user.account.username} for ${req.fields.product}`,
      source: req.fields.stripeToken,
    });

    //send the response to front-end

    res.json(response);

    // res.json({ status });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
