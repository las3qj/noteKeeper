const axios = require("axios");
const testPostBagOfWords = async (testFileLoc) => {
  const response = await axios.post("http://localhost:3000/bagOfWords", {
    filePath: testFileLoc,
  });
  return response;
};

const testGetBagsOfWords = async (ids) => {
  const response = await axios.get("http://localhost:3000/bagOfWords", {
    params: { ids: ids },
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
  console.log("End test suite ...");
};

const testGBOWSuite = () => {
  const testIDs = [["61022df1213b94825db82a96", "61022e13213b94825db82a97"]];
  for (ids of testIDs) {
    console.log("Testing ... " + ids);
    testGetBagsOfWords(ids).then((response) => {
      console.log(response.data);
    });
  }
  console.log("End test suite ...");
};

testGBOWSuite();
