const axios = require("axios");
const fs = require("fs");
const incidentTypes = require("./incidentTypes");
const { insertOrUpdate } = require("./postgres");
const { writeJson, readJsonFile } = require("./utils");

const baseApiUrl = "http://dotdb2.eastus.cloudapp.azure.com:8082/api/twitter/";

let dataDict = {};

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

const getType = ({ id, searchString }) =>
  new Promise(async (res, rej) => {
    const url = `${historyUrl}?query=${searchString}`;
    const r = await axios.get(url);
    if (r.data) {
      res(r.data.map(o => ({ ...o, incident_type: id })));
    } else {
      rej("No data");
    }
  });

const loadLayers = async () => {
  const promises = incidentTypes.map(incident => getType(incident));
  const data = (await Promise.all(promises)).flat();
  console.log(data);
  data.forEach(datum => saveIncident(datum));
};

const getTweet = async (lat, lng, type = "crisis") => {
  const apiUrl = baseApiUrl + (type === "crisis" ? "crisis" : "history");
  const query = `?lat=${lat}&lng=${lng}`;
  const url = apiUrl + query;
  console.log(url);
  try {
    const res = await axios.get(url);
    console.log("Success!");
    if (res.data && res.data.length === 0) console.log("No data");
    return res.data;
  } catch (e) {
    console.log("getData.js:getTweet() ERROR:");
    console.log(e);
  }
};

const getAllTweets = async () => {
  let allData = [];
  let i = 1;
  const uniquePositions = require("./unique_positions.json");
  const total = uniquePositions.length;
  for (let [lng, lat] of uniquePositions) {
    console.log(`${i} of ${total}`);
    const res = await getTweet(lat, lng);
    if (res && res.length) {
      allData = [...allData, ...res];
    }
    i++;
  }
  console.log(allData);
  writeJson("allTweets.json", allData);
  //const promises = uniquePositions.map(([lat, lng]) => getTweet(lat, lng));
  // const res = await Promise.all(promises).catch(e => console.log(e));
  // console.log(res);
  // writeJson("allTweets.json", res);
};

getAllTweets();

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

const per = (n, t) => `${Math.round((n / t) * 100)}%`;

const summarize = async () => {
  let total = 0,
    withTypes = 0,
    withTweets = 0,
    crisis = 0,
    twitter = 0;

  Object.keys(dataDict).forEach(key => {
    total++;
    if (dataDict[key].incidentType) withTypes++;
    if (dataDict[key].id) withTweets++;
    if (dataDict[key].type === "crisis") crisis++;
    if (dataDict[key].type === "tweets") twitter++;
  });

  const summary = `
TOTAL:       ${total}
Categorized: ${withTypes} (${per(withTypes, total)})
Tweet:       ${withTweets} (${per(withTweets, total)})
Crisis Mngt: ${crisis} (${per(crisis, total)})
Twitter:     ${twitter} (${per(twitter, total)})
`;
  fs.writeFile("./summary.log", summary, e => console.log(e));
};

const main = async () => {
  dataDict = await readJsonFile("./dansData.json");
  await loadLayers();
  save();
  summarize();
  console.log("Done");
};

const countTypes = async () => {
  const count = {};
  dataDict = await readJsonFile("./dansData.json");
  Object.values(dataDict).forEach(item => {
    let thisCount = 0;
    incidentTypes.forEach(type => {
      // if (item[type.id]) thisCount++;
    });
    if (count[thisCount]) count[thisCount]++;
    else count[thisCount] = 1;
  });
  console.log(count);
};

// Add Tweet data to database records that don't any.
const addTweetInfo = async () => {
  const data = await idsWhereNeedsTweet();
  const promises = data.map(datum =>
    getTweet(datum.latitude, datum.longitude, datum.type),
  );
  const results = await Promise.all(promises.map(p => p.catch(e => e)));
  const validResults = results.filter(result => !(result instanceof Error));
  console.log(validResults);
};

const saveJsonToPostgres = async () => {
  const data = Object.values(await readJsonFile("./dansData.json"));
  console.log(data.length);
  data.forEach(async (datum, i) => {
    console.log(`Saving item ${i}`);
    await saveIncident({ ...datum, incident_type: datum.incidentType });
  });
};

const mapToObj = data => {
  const newObj = {};
  [
    "incident",
    "created",
    "injuries",
    "fatalities",
    "latitude",
    "longitude",
    "type",
    "crisis_type",
    "incident_type",
    "tweet_id",
    "user_id",
  ].forEach(prop => {
    if (data[prop]) newObj[prop] = data[prop];
  });
  if (!newObj.incident) newObj.incident = data.created;
  return newObj;
};

const addAllToDb = async () => {
  const data = Object.values(await readJsonFile("./dansData.json")).map(o =>
    mapToObj(o),
  );
  insertOrUpdate(data);
};
