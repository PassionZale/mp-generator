#!/usr/bin/env node

"use strict";

const program = require("commander");
const chalk = require("chalk");
const inquirer = require("inquirer");
const path = require("path");
const exists = require("fs").existsSync;
const { homedir } = require("os");
const {
  TEMPLATE_CACH_DIRNAME,
  TEMPLATE_REPO_PATH,
} = require("../lib/constants");
const logger = require("../lib/logger");

// Usage
program.usage("[projectName]").option("--offline", "use cached template");

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

createApp().catch(logger.fatal);

async function createApp() {
  const output = await init();

  console.log(output);
}

async function init() {
  // 项目名称
  let [projectName] = program.args;

  // 是否以当前目录为根目录
  const inPlace = !projectName || projectName === ".";

  // 目录名称
  const name = inPlace ? path.relative("../", process.cwd()) : projectName;

  // 目标目录绝对路径
  const output = path.resolve(projectName || ".");

  console.log(projectName, inPlace, name, output);

  if (inPlace || exists(output)) {
    const { ok } = await inquirer.prompt([
      {
        type: "confirm",
        message: inPlace ? "是否在当前目录创建项目" : "目录已存在，是否继续",
        name: "ok",
      },
    ]);

    if (!ok) {
      process.exit(1);
    }
  }

  return output;
}

function downloadAndGenerate(template) {}
