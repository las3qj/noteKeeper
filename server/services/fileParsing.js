const fs = require("fs");

const parseTxtFile = (filePath) => {
  return fs.readFileSync(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
    } else {
      console.log(data);
      return data;
    }
  });
};

module.exports = {
  parseTxtFile,
};
