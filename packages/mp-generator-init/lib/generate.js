const path = require("path");
const async = require("async");
const Metalsmith = require("metalsmith");
const render = require("consolidate").handlebars.render;
const inquirer = require("inquirer");
const { getPrompts } = require("./prompts");

module.exports = function generate(template, project) {
  const { templatePath } = template;
  const { projectName, projectPath } = project;

  const prompts = getPrompts(projectName);

  return new Promise((resolve, reject) => {
    inquirer
      .prompt(prompts)
      .then((answers) => {
        Metalsmith(path.join(templatePath))
          .metadata(answers)
          .clean(false)
          .source(".")
          .destination(projectPath)
          .use((files, metalsmith, done) => {
            const keys = Object.keys(files);
            const metadata = metalsmith.metadata();

            async.each(
              keys,
              (file, next) => {
                const str = files[file].contents.toString();

                // 跳过不需要 render 的文件，例如图片等字节流中没有 {{xxx}} 模板字符标识的文件
                if (!/{{([^{}]+)}}/g.test(str)) {
                  return next();
                }

                render(str, metadata, (err, res) => {
                  if (err) {
                    err.message = `[${file}] ${err.message}`;
                    return next(err);
                  }

                  files[file].contents = Buffer.from(res);
                  next();
                });
              },
              done
            );
          })
          .build((error) => {
            error ? reject(error) : resolve();
          });
      })
      .catch((error) => reject(error));
  });
};
