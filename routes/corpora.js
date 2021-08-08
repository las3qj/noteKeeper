const express = require("express");

const corpora = require("./../controllers/corpora");

const router = express.Router();

router.get("/", corpora.getCorpora);
router.post("/", corpora.postCorpus);
router.put("/", corpora.putCorpus);
router.delete("/", corpora.deleteCorpus);

router.post("/bags", corpora.addBags);
router.delete("/bags", corpora.removeBags);
router.put("/bags", corpora.putBags);
router.get("/bags", corpora.getBags);

router.post("/token-lengths", corpora.runTokenLengths);

module.exports = { router };
