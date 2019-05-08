const fs = require("fs");
const data = require("../data2.json");
const { saveTweet } = require("./mongo");

// let text = "";
// data.forEach(element => {
//   text += Object.values(element).reduce((a, c) => (a += `"${c}",`), "") + "\n";
// });

const writeToFile = (text, file) => {
  if (typeof text !== "string") text = JSON.stringify(text);
  const stream = fs.createWriteStream(file, { flags: "a" });
  stream.write(text + "\n");
  stream.end();
};

data.forEach(element => {
  saveTweet({
    id: element.created,
    lat: element.latitude,
    lng: element.longitude,
    type: element.type,
    fatalities: element.fatalities,
    injuries: element.injuries,
    incident_type: element.incident_type,
  });
});
