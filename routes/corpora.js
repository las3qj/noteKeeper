const express = require("express");

const corpora = require("./../controllers/corpora");

const router = express.Router();

router.post("/", corpora.postCorpus);
router.put("/addBags", corpora.addBags);

module.exports = { router };
