const express = require("express");

const bagsOfWords = require("./../controllers/bagsOfWords");

const router = express.Router();

router.post("/", bagsOfWords.postBagOfWords);

module.exports = { router };
