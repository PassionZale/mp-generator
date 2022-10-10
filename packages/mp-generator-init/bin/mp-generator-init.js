#!/usr/bin/env node

"use strict";

const program = require("commander");
const chalk = require("chalk");
const inquirer = require("inquirer");
const path = require("path");
const fse = require("fs-extra");
const exists = require("fs").existsSync;
const ora = require("ora");
const downloadGitRepo = require("download-git-repo");
const { homedir } = require("os");
const {
  TEMPLATE_CACH_DIRNAME,
  TEMPLATE_REPO_PATH,
} = require("../lib/constants");
const logger = require("../lib/logger");
const generate = require("../lib/generate");

// Usage
program.usage("<projectName>");

// Help
program.on("--help", () => {
  console.log();
  console.log("  示例:");
  console.log();
  console.log("    $ npx create-mp-generator my-project");
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

// 原始名称
const [rawName] = program.args;

createApp().catch(logger.fatal);

async function createApp() {
  // { projectName, projectPath }
  const project = await initProject();

  // { templateName, templatePath }
  const template = await selectTemplate();

  await generate(template, project);

  console.log();
  logger.success(`${project.projectName} 生成完毕`);

  console.log();

  console.log("   To get startted:");

  console.log("   cd %s/", project.projectName);

  console.log("   npm install");
  console.log("   打开项目，填充 .env.dev 中的 APPID")
  console.log("   npm run start");

  console.log();
}

async function initProject() {
  // 是否以当前目录为根目录
  const inPlace = !rawName || rawName === ".";

  // 目录名称
  const projectName = inPlace ? path.relative("../", process.cwd()) : rawName;

  // 目标目录绝对路径
  const projectPath = path.resolve(rawName || ".");

  if (inPlace || exists(projectPath)) {
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

  return {
    projectPath,
    projectName,
  };
}

async function selectTemplate() {
  return new Promise((resolve, reject) => {
    const spinner = ora("正在下载应用模板...");

    spinner.start();

    const output = path.join(homedir(), TEMPLATE_CACH_DIRNAME);

    // 同步的清空缓存目录
    fse.emptyDirSync(output);

    downloadGitRepo(
      `direct:${TEMPLATE_REPO_PATH}#main`,
      output,
      { clone: true },
      async (err) => {
        spinner.stop();

        if (err) {
          return reject("Failed to download repo : " + err.message.trim());
        }

        const meta = fse.readJsonSync(path.join(output, "src/meta.json"), {
          throws: false,
        });

        if (meta && meta.length > 1) {
          const { templateName } = await inquirer.prompt([
            {
              message: "请选择应用模板",
              type: "list",
              name: "templateName",
              default: meta[0].name,
              choices: meta.map((item) => ({
                name: `${item.name} ${chalk.gray(`(${item.desc})`)}`,
                value: item.name,
              })),
            },
          ]);

          return resolve({
            templatePath: path.join(output, `src/${templateName}`),
            templateName,
          });
        } else {
          return resolve({
            templatePath: path.join(output, `src/${meta[0].name}`),
            templateName: meta[0].name,
          });
        }
      }
    );
  });
}
