const fs = require("fs");

const writeTextAsync = (path, text) =>
  new Promise((res, rej) => {
    fs.writeFile(path, text, "utf8", err => {
      if (err) {
        rej(err);
      } else {
        res(null);
      }
    });
  });

const writeJson = (path, obj) =>
  fs.writeFile(path, JSON.stringify(obj), err => console.log(err));

const writeJsonAsync = (path, obj) =>
  new Promise((res, rej) => {
    fs.writeFile(path, JSON.stringify(obj), err => {
      if (err) {
        rej(err);
      } else {
        res(null);
      }
    });
  });

const readFile = (path, opts = "utf8") =>
  new Promise((res, rej) => {
    fs.readFile(path, opts, (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });

const readJsonFile = async path => JSON.parse(await readFile(path));

module.exports = {
  writeJson,
  writeJsonAsync,
  writeTextAsync,
  readFile,
  readJsonFile,
};
