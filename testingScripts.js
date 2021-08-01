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

const testPostCorpus = async (name, description, bagIDs) => {
  const response = await axios.post("http://localhost:3000/corpus", {
    name,
    description,
    bagIDs,
  });
  return response;
};

const testAddBags = async (corpusID, bagIDs) => {
  const response = await axios.put("http://localhost:3000/corpus/addBags", {
    corpusID,
    bagIDs,
  });
  return response;
};

const testAddCorpora = async (bagID, corporaIDs) => {
  const response = await axios.put(
    "http://localhost:3000/bagOfWords/addCorpora",
    {
      bagID,
      corporaIDs,
    }
  );
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

const testPCSuite = () => {
  const testParams = [
    {
      name: "testCorpus",
      description: "testDescription",
      bagIDs: ["61022df1213b94825db82a96", "61022e13213b94825db82a97"],
    },
  ];
  for (test of testParams) {
    console.log("Testing ... " + test.name);
    testPostCorpus(test.name, test.description, test.bagIDs).then(
      (response) => {
        console.log(response);
      }
    );
    console.log("End test suite ...");
  }
};

const constABSuite = () => {
  const testParams = [
    {
      corpusID: "6105a5706a26f24cb23c7fc3",
      bagIDs: ["61058acfa0b2ed02b01a652a", "6105a34ef610e8b0f767e248"],
    },
  ];
  for (test of testParams) {
    console.log("Testing ..." + test.corpusID);
    testAddBags(test.corpusID, test.bagIDs).then((response) => {
      console.log(response);
    });
    console.log("End test suite ...");
  }
};

const testACSuite = () => {
  const testParams = [
    {
      bagID: "6106f39cab6982f8852677d1",
      corporaIDs: ["6106d819d96affc3c35a32d4"],
    },
  ];
  for (test of testParams) {
    console.log("Testing ..." + test.bagID);
    testAddCorpora(test.bagID, test.corporaIDs).then((response) => {
      console.log(response);
    });
    console.log("End test suite ...");
  }
};

testACSuite();
