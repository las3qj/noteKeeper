const axios = require("axios");
const testPostBagOfWords = async (testFileLoc) => {
  const response = await axios.post("http://localhost:3000/bagOfWords", {
    filePath: testFileLoc,
  });
  return response;
};

const testPBOWSuite = () => {
  const testFilePrefix = "./testFiles/";
  const testFiles = ["test1.txt"];
  for (file of testFiles) {
    console.log("Testing ... " + testFilePrefix + file);
    testPostBagOfWords(testFilePrefix + file).then((response) =>
      console.log(response.status)
    );
  }
  console.log("End test suite...");
};

testPBOWSuite();
