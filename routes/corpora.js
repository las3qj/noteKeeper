const express = require("express");

const corpora = require("./../controllers/corpora");

const router = express.Router();

//router.get("/", corpora.getCorpora);
router.post("/", corpora.postCorpus);
//router.put("/", corpora.putCorpus);
//router.delete("/", corpora.deleteCorpora);

router.post("/bags", corpora.addBags);
router.delete("/bags", corpora.removeBags);
router.put("/bags", corpora.putBags);

module.exports = { router };
