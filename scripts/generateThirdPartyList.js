const remark = require("remark");
const remarkPackageDependencies = require("remark-package-dependencies");
const input = "## Dependencies";
const output = remark()
  .use(remarkPackageDependencies)
  .processSync(input)
  .toString();

console.log("output", output);
