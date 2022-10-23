const express = require(`express`);
const router = express.Router();
const cloudinary = require(`cloudinary`).v2;

const Offer = require(`../models/Offer`);
const isAuthenticated = require("../middleware/isAuthenticated");

cloudinary.config({
  cloud_name: `drjpsa0tp`,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

router.post(`/offer/publish`, isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.fields;

    //setup a new offer
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { MARQUE: brand },
        { TAILLE: size },
        { ETAT: condition },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],
      owner: req.user,
    });

    //Get the picture path from the request
    let pictureToUpload = req.files.picture.path;

    //Upload the picture on cloudinary
    const productPicture = await cloudinary.uploader.upload(pictureToUpload, {
      folder: `/vinted/offres/${newOffer._id}`,
    });

    newOffer.product_image = productPicture;
    await newOffer.save();

    return res.json(newOffer);
  } catch (error) {
    return res.status(400).json(error.message);
  }
});

router.put(`/offer/update`, isAuthenticated, async (req, res) => {
  try {
    const {
      id,
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
      picture,
    } = req.fields;

    const offerToModify = await Offer.findById(id);

    // console.log(req.token);
    console.log(offerToModify.owner);
    console.log(req.user._id);

    if (String(req.user._id) === String(offerToModify.owner)) {
      offerToModify.product_name = title;
      offerToModify.description = description;
      offerToModify.product_price = price;
      offerToModify.product_details[0].MARQUE = brand;
      offerToModify.product_details[1].TAILLE = size;
      offerToModify.product_details[2].ETAT = condition;
      offerToModify.product_details[3].COULEUR = color;
      offerToModify.product_details[4].EMPLACEMENT = city;

      offerToModify.markModified(`product_details`);
      await offerToModify.save();

      res.status(200).json({ offerToModify });
    } else {
      res
        .status(400)
        .json({ message: `You are not authorized to modify this offer` });
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.delete(`/offer/delete`, isAuthenticated, async (req, res) => {
  try {
    const offerToDelete = await Offer.findById(req.fields.id);

    await cloudinary.api.delete_resources_by_prefix(
      `vinted/offres/${req.fields.id}`
    );

    await cloudinary.api.delete_folder(`vinted/offres/${req.fields.id}`);

    await offerToDelete.delete();

    res.json(offerToDelete);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get(`/offers`, async (req, res) => {
  try {
    let { title, priceMin, priceMax, sort, page, limit } = req.query;
    const filters = {};
    if (title) {
      filters.product_name = new RegExp(title, `i`);
    }
    if (priceMin) {
      filters.product_price = {
        $gte: Number(priceMin),
      };
    }
    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(priceMax);
      } else {
        filters.product_price = {
          $lte: Number(priceMax),
        };
      }
    }
    if (sort) {
      if (sort === `price-desc`) {
        sort = { product_price: -1 };
      } else if (sort === `price-asc`) {
        sort = { product_price: 1 };
      }
    }
    if (limit) {
      limit;
    } else {
      limit = 50;
    }
    if (page) {
      page = (page - 1) * limit;
    } else {
      page = 0;
    }

    const offerToFind = await Offer.find(filters)
      .populate(`owner`, "_id account")
      .sort(sort)
      .skip(page)
      .limit(limit);

    res.status(200).json(offerToFind);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.get(`/offer/:id`, async (req, res) => {
  try {
    const offertToFind = await Offer.findById(req.params.id)
      .populate({
        path: `owner`,
        select: `account`,
      })
      .select(
        `product_image.secure_url product_name product_description product_price product_details`
      );

    res.status(200).json(offertToFind);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

module.exports = router;
