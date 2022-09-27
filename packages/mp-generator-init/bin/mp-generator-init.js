#!/usr/bin/env node

const program = require("commander");
const chalk = require("chalk");
const path = require("path");

// Usage
program
  .usage("<template-name> [project-name]")
  .option("--offline", "use cached template");

// Help
program.on("--help", () => {
  console.log();
  console.log("  Examples:");
  console.log();
  console.log(chalk.gray("    # create a new project with target template"));
  console.log(chalk.gray("    # using npm?"));
  console.log(chalk.green("    $ npx init mp-generator my-project"));
  console.log(chalk.gray("    # using npx?"));
  console.log(chalk.green("    $ npx create-mp-generator my-project"));
  console.log("    $ cd my-project");
  console.log("    $ npm install");
  console.log("    $ npm run start");
  console.log();
});

function help() {
  program.parse(process.argv);
  if (program.args.length < 1) return program.help();
}

help();

const {
  TEMPLATE_CACH_DIRNAME,
  TEMPLATE_REPO_PATH,
} = require("../lib/constants");

// 模板名称, 原始名称
let [rawName] = program.args;

// 是否以当前目录为根目录
const inPlace = !rawName || rawName === ".";

// 目录名称
const name = inPlace ? path.relative("../", process.cwd()) : rawName;

// 目标目录绝对路径
const to = path.resolve(rawName || '.')

// 缓存 templates 绝对路径
const tmp = path.join(home, TEMPLATE_CACH_DIRNAME, template)