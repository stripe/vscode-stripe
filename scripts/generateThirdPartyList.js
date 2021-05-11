const remark = require("remark");
const gfm = require("remark-gfm");
const remarkPackageDependencies = require("remark-package-dependencies");
const input = "## Dependencies";
const output = remark()
  .use(gfm)
  .use(remarkPackageDependencies)
  .processSync(input)
  .toString();

console.log(output);
