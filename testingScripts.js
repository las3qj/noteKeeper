const axios = require("axios");
const postBag = async (testFileLoc) => {
  const response = await axios.post("http://localhost:3000/bagOfWords", {
    filePath: testFileLoc,
  });
  return response;
};

const getBags = async (idArray) => {
  const response = await axios.get("http://localhost:3000/bagOfWords", {
    params: { ids: idArray },
  });
  return response;
};

const putBag = async (bagID, filePath, corporaIDsArray) => {
  const response = await axios.put("http://localhost:3000/bagOfWords", {
    bagID,
    filePath,
    corporaIDs: corporaIDsArray,
  });
  return response;
};

const postCorpus = async (name, description, bagIDArray) => {
  const response = await axios.post("http://localhost:3000/corpus", {
    name,
    description,
    bagIDs: bagIDArray,
  });
  return response;
};

const addBags = async (corpusID, bagIDArray) => {
  const response = await axios.post("http://localhost:3000/corpus/bags", {
    corpusID,
    bagIDs: bagIDArray,
  });
  return response;
};

const addCorpora = async (bagID, corporaIDArray) => {
  const response = await axios.post(
    "http://localhost:3000/bagOfWords/corpora",
    {
      bagID,
      corporaIDs: corporaIDArray,
    }
  );
  return response;
};

const updateText = async (bagID, filePath) => {
  const response = await axios.put("http://localhost:3000/bagOfWords/text", {
    bagID,
    filePath,
  });
  return response;
};

const removeCorpora = async (bagID, corporaIDArray) => {
  const response = await axios.delete(
    "http://localhost:3000/bagOfWords/corpora",
    { data: { bagID, corporaIDs: corporaIDArray } }
  );
  return response;
};

const removeBags = async (corpusID, bagsIDArray) => {
  const response = await axios.delete("http://localhost:3000/corpus/bags", {
    data: {
      corpusID,
      bagIDs: bagsIDArray,
    },
  });
  return response;
};

const putBags = async (corpusID, bagsIDArray) => {
  const response = await axios.put("http://localhost:3000/corpus/bags", {
    corpusID,
    bagIDs: bagsIDArray,
  });
  return response;
};

const putCorpora = async (bagID, corporaIDArray) => {
  const response = await axios.put("http://localhost:3000/bagOfWords/corpora", {
    bagID,
    corporaIDs: corporaIDArray,
  });
  return response;
};

const testPBOWSuite = () => {
  const testFilePrefix = "./testFiles/";
  const testFiles = ["Baldwin1.txt", "Baldwin2.txt"];
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
      name: "James Baldwin",
      description: "James Baldwin quotes from  'The Fire Next Time.'",
      bagIDs: ["61076257cbe7e5440eb17620", "61076257cbe7e5440eb17621"],
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
      corpusID: "610760964076ff7c9db6aeb8",
      bagIDs: ["610760224076ff7c9db6aeb7"],
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

module.exports = {
  postBag,
  putBag,
  getBags,
  postCorpus,
  addBags,
  removeBags,
  putBags,
  addCorpora,
  removeCorpora,
  putCorpora,
  updateText,
};
