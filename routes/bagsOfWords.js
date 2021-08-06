const express = require("express");

const bagsOfWords = require("./../controllers/bagsOfWords");

const router = express.Router();

router.post("/", bagsOfWords.postBagOfWords);
router.get("/", bagsOfWords.getBagsOfWords);
router.put("/", bagsOfWords.putBagOfWords);

router.put("/text", bagsOfWords.updateText);

router.post("/corpora", bagsOfWords.addCorpora);
router.delete("/corpora", bagsOfWords.removeCorpora);
router.put("/corpora", bagsOfWords.putCorpora);

module.exports = { router };
