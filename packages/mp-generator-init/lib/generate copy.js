const Metalsmith = require("metalsmith");
const async = require("async");
const render = require("consolidate").handlebars.render;
const path = require("path");
const inquirer = require("inquirer");
const { getPrompts } = require("../lib/prompts");
const logger = require("../lib/logger");

module.exports = function generate(name, src, dest, debug) {
  debug && logger.log(`name: ${name}`);
  debug && logger.log(`src: ${src}`);
  debug && logger.log(`dest: ${dest}`);

  const prompts = getPrompts(name);

  return new Promise((resolve, reject) => {
    inquirer
      .prompt(prompts)
      .then((answers) => {
        // 指定 Metalsmith 工作目录
        Metalsmith(path.join(src, "template"))
          .metadata(answers)
          .clean(false)
          .source(".")
          .destination(dest)
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

                // eslint-disable-next-line max-nested-callbacks
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
