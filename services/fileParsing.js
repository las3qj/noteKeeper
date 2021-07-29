const fs = require("fs");

const parseTxtFile = (filePath) => {
  return fs.readFile(filePath, "ut8", (err, data) => {
    if (err) {
      console.error(err);
    } else {
      return data;
    }
  });
};

module.exports = {
  parseTxtFile,
};
