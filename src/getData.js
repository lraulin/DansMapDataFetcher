const axios = require("axios");
const fs = require("fs");
const incidentTypes = require("./incidentTypes");

const baseApiUrl = "http://dotdb2.eastus.cloudapp.azure.com:8082/api/twitter/";

let dataDict = {};

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

const doit = async () => {
  await writeText("./test.txt", words);
  console.log("DONE!");
};

// writeText("./test.txt", "testing...");
fs.writeFile("./test.txt", words, e => console.log(e));
// doit();

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

const save = () => writeJson("./dansData.json", dataDict);

const summarize = async () => {
  let total = 0,
    withTypes = 0,
    withTweets = 0;

  Object.keys(dataDict).forEach(key => {
    total++;
    if (data[key].incidentType) withTypes++;
    if (data[key].id) withTweets++;
  });

  const summary = `
TOTAL:       ${total}
Categorized: ${withTypes} (${Math.round((withTypes / total) * 100)}%)
Tweet:       ${withTweets} (${Math.round((withTweets / total) * 100)}%)
`;
  fs.writeFile("./summary.log", summary, e => console.log(e));
};

const main = async () => {
  await getData();
  await loadLayers();
  save();
  await combineData();
  save();
  summarize();
  console.log("Done");
};

main();
