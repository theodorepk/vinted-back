const express = require(`express`);
// const mongoose = require(`mongoose`);
const router = express.Router();
const User = require(`../models/Users`);
const uid2 = require(`uid2`);
const SHA256 = require(`crypto-js/sha256`);
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require(`cloudinary`).v2;

cloudinary.config({
  cloud_name: `drjpsa0tp`,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

router.post(`/users/signup`, async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.fields;
    const userSignUp = await User.findOne({ email });

    if (userSignUp) {
      res.status(409).json({ message: `User already exist` });
    } else {
      if (username) {
        const salt = uid2(16); // je génère mon salt
        const hash = SHA256(salt + password).toString(encBase64); //je génére un hash
        const token = uid2(64);

        const newUser = new User({
          email,
          account: {
            username,
            avatar: null,
          },
          newsletter,
          token,
          hash,
          salt,
        });

        if (req.files.avatar) {
          let pictureToUpload = req.files.avatar.path;
          const userPicture = await cloudinary.uploader.upload(
            pictureToUpload,
            {
              folder: `/vinted/avatar/${newUser._id}`,
            }
          );
          newUser.account.avatar = userPicture;
        }

        await newUser.save();
        return res.json({
          id: newUser._id,
          token,
          account: {
            username,
          },
        });
      } else {
        res.status(412).json({ message: `Please choose an username` });
      }
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.post(`/users/login`, async (req, res) => {
  try {
    const userLogin = await User.findOne({ email: req.fields.email });

    //is mail exist in BDD ?
    if (userLogin) {
      //Get user's salt
      const userSalt = userLogin.salt;
      //Generate the hash with sur UserSalt in BDD and the password given in front
      const hashLogin = SHA256(userSalt + req.fields.password).toString(
        encBase64
      );

      //hash generate is equal to hash in bdd ?
      if (hashLogin === userLogin.hash) {
        res.status(200).json({
          _id: userLogin._id,
          token: userLogin.token,
          account: {
            username: userLogin.account.username,
          },
        });
      } else {
        res.status(401).json({ message: `wrong password` });
      }
    } else {
      res.status(404).json({ message: `User doesn't exist` });
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

module.exports = router;
