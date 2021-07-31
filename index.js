const express = require("express");
const app = express();

app.use(express.json());

const { router: bagsOfWordsRouter } = require("./routes/bagsOfWords");
const { router: corporaRouter } = require("./routes/corpora");

app.get("/", (req, res) => res.send("App is working"));

app.use("/bagOfWords", bagsOfWordsRouter);
app.use("/corpus", corporaRouter);

app.listen(3000, () => console.log("Example app listening on port 3000!"));

module.exports = {
  app,
};
