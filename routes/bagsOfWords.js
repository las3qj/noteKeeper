const express = require("express");

const bagsOfWords = require("./../controllers/bagsOfWords");

const router = express.Router();

router.post("/", bagsOfWords.postBagOfWords);

router.get("/", bagsOfWords.getBagsOfWords);

router.put("/addCorpora", bagsOfWords.addCorpora);

router.put("/updateText", bagsOfWords.updateText);

module.exports = { router };
