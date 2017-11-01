#!/usr/bin/env node

'use strict';

const program = require('commander');
const log = console.log;
const chalk = require("chalk");
const glob = require("glob");
const exec = require('child_process').exec;
const pkg = require('./package.json');
const fs = require('fs');
const LineByLineReader = require('line-by-line');

let ignoreGlob = '**/.gitignore'
let defaultOptions = {
  ignore: [
    'node_modules/**'
  ]
}

let getOptions = function(options) {
  if (options.ignore) {
    options.ignore = JSON.parse(options.ignore)
  }
  return Object.assign({}, defaultOptions, options)
}

let cleanLine = function(path, line) {
  if (line.match(/^!/)) {
    line = line.substr(1)
    path = `!${path}`
  }
  if (line.match(/^\//)) {
    line = line.substr(1)
  }
  return path + line;
}

let saveFile = function (output, options, ignores) {
  fs.writeFileSync(output, ignores.join("\n"))
  log(chalk.bgBlue(`Created File: ${output}`));
}

let processFile = function (file) {
  return new Promise((resolve, reject) => {
    let lines = [];
    let path = file.replace('.gitignore', '');
    var rl = new LineByLineReader(file)
    rl.on('line', function (line) {
      if (line !== '') {
        lines.push(cleanLine(path, line));
      }
    })
    rl.on('end', function() {
      resolve(lines)
    })
  })
}

let concat = function (output, params) {
  log(chalk.bgBlue(`Creating Concated ignore File: ${output}`));

  let options = getOptions(params)
  let exists = fs.existsSync(output);
  let promises = [];

  if (!options.force && exists) {
    log(chalk.red.bold.underline("File Already Exsists:"));
  } else {
    glob(ignoreGlob, { ignore: options.ignore}, function (er, files) {
      files.forEach((file) => {
        promises.push(processFile(file))
      });
      Promise.all(promises).then((values) => {
        let gitignores = [];
        values.forEach((ignores) => {
          ignores.forEach((ignore) => gitignores.push(ignore))
        })
        saveFile(output, options, gitignores)
      });
    })
  }
}

program.version(pkg.version)
  .command('to <output>')
  .option('-f, --force', 'force replace file')
  .option('-i, --ignore [file]', 'Ignore globs "|" separated')
  .action(concat);

program.parse(process.argv);

// if program was called with no arguments, show help.
if (program.args.length === 0) program.help();
