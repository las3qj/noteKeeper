const express = require("express");

const bagsOfWords = require("./../controllers/bagsOfWords");

const router = express.Router();

router.post("/", bagsOfWords.postBagsOfWords);
router.get("/", bagsOfWords.getBagsOfWords);
router.put("/", bagsOfWords.putBagOfWords);
router.delete("/", bagsOfWords.deleteBagOfWords);

router.put("/text", bagsOfWords.updateText);

router.post("/corpora", bagsOfWords.addCorpora);
router.delete("/corpora", bagsOfWords.removeCorpora);
router.put("/corpora", bagsOfWords.putCorpora);
router.get("/corpora", bagsOfWords.getCorpora);

module.exports = { router };
