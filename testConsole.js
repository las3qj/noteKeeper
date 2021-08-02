const testScripts = require("./testingScripts");
const prompt = require("prompt-sync")({ sigint: true });

// JavaScript program to get the function
// name/values dynamically
function getParams(func) {
  // String representaation of the function code
  var str = func.toString();

  // Remove comments of the form /* ... */
  // Removing comments of the form //
  // Remove body of the function { ... }
  // removing '=>' if func is arrow function
  str = str
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/(.)*/g, "")
    .replace(/{[\s\S]*}/, "")
    .replace(/=>/g, "")
    .trim();

  // Start parameter names after first '('
  var start = str.indexOf("(") + 1;

  // End parameter names is just before last ')'
  var end = str.length - 1;

  var result = str.substring(start, end).split(", ");

  var params = [];

  result.forEach((element) => {
    // Removing any default value
    element = element.replace(/=[\s\S]*/g, "").trim();

    if (element.length > 0) params.push(element);
  });

  return params;
}

function printHelp(commands, params) {
  console.log("\nA list of commands:");
  for (let i = 0; i < commands.length; i++) {
    process.stdout.write(commands[i] + "  ( ");
    for (let j = 0; j < params[i].length; j++) {
      process.stdout.write(params[i][j]);
      if (j < params[i].length - 1) {
        process.stdout.write(",");
      }
      process.stdout.write(" ");
    }
    process.stdout.write(")\n");
  }
  console.log("...or type 'exit' to quit.\n");
}

const mainLoop = async () => {
  const commands = Object.keys(testScripts);
  const functions = commands.map((command) => testScripts[command]);
  const params = functions.map(getParams);
  let input = "";
  printHelp(commands, params);
  while (input !== "exit") {
    input = prompt("test-console> ");
    if (input === "help") {
      printHelp(commands, params);
    } else if (commands.includes(input)) {
      const index = commands.findIndex((el) => el === input);
      const fnParams = params[index].map((param) => {
        if (param.toLocaleLowerCase().includes("array")) {
          const array = [];
          let arrayInput = " ";
          console.log(param + " = [ ");
          while (arrayInput !== "") {
            arrayInput = prompt("");
            if (arrayInput !== "") {
              array.push(arrayInput);
            }
          }
          console.log("]");
          return array;
        }
        return prompt(param + " = ");
      });
      const res = await functions[index].apply(null, fnParams);
      res.status === 200
        ? console.log("Success!")
        : console.log("Error -- see server logs.");
      input.toLocaleLowerCase().includes("get")
        ? console.log(res.data.data)
        : () => {};
    } else if (input !== "exit") {
      console.log("Command not found. Type 'help' for a list of commands.");
    }
  }
};

mainLoop();
