const axios = require("axios");
const fs = require("fs");
const incidentTypes = require("./incidentTypes");

const baseApiUrl = "http://dotdb2.eastus.cloudapp.azure.com:8082/api/twitter/";

let dataDict = {};

const writeToFile = (text, file) => {
  const stream = fs.createWriteStream(file, { flags: "a" });
  stream.write(text + "\n");
  stream.end();
};

const writeJsonToFile = (obj, file) => writeToFile(JSON.stringify(obj), file);

const readFile = (path, opts = "utf8") =>
  new Promise((res, rej) => {
    fs.readFile(path, opts, (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });

const readJsonFile = async path => JSON.parse(await readFile(path));

const historyUrl = baseApiUrl + "history";

const getData = () => {
  axios
    .get(historyUrl)
    .then(res => {
      res.data.forEach(item => {
        if (dataDict[item.created]) {
          dataDict[item.created] = { ...dataDict[item.created], ...item };
        } else {
          dataDict[item.created] = { ...item };
        }
      });
    })
    .catch(e => console.log(e));
};

const loadLayers = async () => {
  let dups = 0;
  let newOnes = 0;
  await Promise.all(
    incidentTypes.map(async incident => {
      const url = historyUrl + "?query=" + incident.searchString;
      console.log(url);
      try {
        const data = await axios.get(url);
        if (data) {
          data.data.forEach(item => {
            if (dataDict[item.created]) {
              dataDict[item.created] = {
                ...dataDict[item.created],
                ...item,
                incidentType: incident.id,
              };
              dups++;
            } else {
              dataDict[item.created] = { ...item, incidentType: incident.id };
              newOnes++;
            }
          });
        }
      } catch (e) {
        console.log(e);
      }
    }),
  );
  console.log(`Dups: ${dups}; New: ${newOnes}`);
};

const getTweet = async (lat, lng, type) => {
  const apiUrl = baseApiUrl + (type === "crisis" ? "crisis" : "history");
  const query = `?lat=${lat}&lng=${lng}`;
  const url = apiUrl + query;
  try {
    const res = await axios.get(url);
    return res.data[1];
  } catch (e) {
    console.log(e);
  }
};

const mockData = {
  created: 1482635860000,
  injuries: 0,
  fatalities: 0,
  longitude: -178.5868389,
  type: "tweets",
  event_type: "",
  latitude: -52.6291128,
};

const combineData = async () => {
  for (let key in dataDict) {
    console.log(`Fetching for ${key}...`);
    const { latitude, longitude, type } = dataDict[key];
    const tweetData = await getTweet(latitude, longitude, type);
    dataDict[key] = { ...dataDict[key], ...tweetData };
    console.log(dataDict[key]);
  }
};

const save = () => writeJsonToFile(dataDict, "dansData.json");

const main = async () => {
  await getData();
  await loadLayers();
  save();
  await combineData();
  save();
  console.log("Done");
};

main();
