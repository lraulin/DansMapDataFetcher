const { writeToFile } = require("./writeToFile");

const fetch = require("node-fetch");

const crisisTypes = {
  "0": "HIGHWAY",
  "1": "MOTORCARRIER",
  "2": "TRANSIT",
  "3": "RAIL",
  "4": "OTHER",
  "5": "PIPELINE",
  "6": "NONE",
  HIGHWAY: 0,
  MOTORCARRIER: 1,
  TRANSIT: 2,
  RAIL: 3,
  OTHER: 4,
  PIPELINE: 5,
  NONE: 6,
};

const incidentTypes = [
  {
    id: "fatalCrash",
    displayName: "Fatal Crash",
    searchString:
      "(fatal %26 crash)|(fatal %26 car %26 crash)|(fatal %26 car %26 accident)|(Pedestrian %26 killed)|(Fatal %26 truck %26 accident)|(Fatal %26 truck %26 crash)|(Truck %26 kill)|(Bus %26 kill)|(Cyclist %26 killed)|(Bicyclist %26 killed)",
    crisisType: 0,
  },
  {
    id: "pedestrianCrash",
    displayName: "Pedestrian Crash",
    searchString: "(Pedestrian %26 crash)|(Pedestrian %26 killed)",
    crisisType: 0,
  },
  {
    id: "cyclistCrash",
    displayName: "Cyclist Crash",
    searchString:
      "(Bicyclist %26 crash)|(Bicyclist %26 killed)|(Cyclist %26 crash)|(Cyclist %26 killed)",
    crisisType: 0,
  },
  {
    id: "truckCrash",
    displayName: "Truck Crash",
    searchString:
      "(Truck %26 crash)|(Truck %26 kill)|(Fatal %26 truck %26 crash)|(Fatal %26 truck %26 accident)",
    crisisType: 1,
  },
  {
    id: "busCrash",
    displayName: "Bus Crash",
    searchString: "(Bus %26 crash)|(Bus %26 kill)",
    crisisType: 1,
  },
  {
    id: "transitCrash",
    displayName: "Transit Crash",
    searchString: "(Transit %26 Crash)|(Transit %26 crash)|(Transit %26 kill)",
    crisisType: 2,
  },
  {
    id: "transSuicide",
    displayName: "Transportation-related Suicide",
    searchString: "(Rail %26 suicide)|(Transit %26 suicide)",
    crisisType: 4,
  },
  {
    id: "pipeline",
    displayName: "Pipeline Incident",
    searchString: "(Pipeline %26 explosion)|(pipeline %26 spills)",
    crisisType: 5,
  },
  {
    id: "hazmat",
    displayName: "HAZMAT Incident",
    searchString: "(Hazardous %26 spill)|(Hazardous %26 spills)",
    crisisType: 6,
  },
  {
    id: "rail",
    displayName: "Rail Incident",
    searchString: "(Train %26 explosion)|(Train %26 explode)",
    crisisType: 3,
  },
  {
    id: "road",
    displayName: "Road Hazard or Closure",
    searchString:
      "(Bike %26 lane %26 blocked)|(Bus %26 lane %26 blocked)|(road %26 closed)|(road %26 closure)|(road %26 flooded)|(road %26 washed)|(bridge %26 closed)|(bridge %26 out)",
    crisisType: 0,
  },
  {
    id: "unsafe",
    displayName: "Unsafe Behavior",
    searchString:
      "(ran %26 red %26 light)|(blew %26 red %26 light)|(blew %26 through %26 red %26 light)",
    crisisType: 0,
  },
  {
    id: "drone",
    displayName: "Drone Incident",
    searchString: "(Drone %26 unauthorized)",
    crisisType: 6,
  },
];

const groupOptions = {
  spiderfyOnMaxZoom: false,
  disableClusteringAtZoom: 17,
};

const fetchAsync = async url => await (await fetch(url)).json();
const postAsync = async (url, data) =>
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

const postJsonServer = async data =>
  await postAsync("http://localhost:3001/incidentReports", data);

const create_DOT_Incident_Map = () => ({
  baseApiUrl: "http://dotdb2.eastus.cloudapp.azure.com:8082/api/twitter/",
  incidentTypes,
  myMap: null,
  addAllMarkerLayers(
    data = [
      {
        created: 0,
        event_type: "",
        fatalities: 0,
        injuries: 0,
        latitude: 0,
        longitude: 0,
        type: "",
      },
    ],
  ) {
    writeToFile(data, "data.json");
  },
  async initMap() {
    const url = this.baseApiUrl + "history";
    try {
      const data = await fetchAsync(url);
      console.log(data);
      writeToFile(data, "data2.json");
    } catch (e) {
      clearInterval(this.interval);
    }
  },
  async reloadMap() {
    const baseQuery = this.appendFromToDates("");
    const query = baseQuery + this.appendSearchText(baseQuery);
    const url = this.baseApiUrl + "history" + query;
    try {
      const data = await fetchAsync(url);
      if (data) {
        //...
      }
    } catch (e) {
      console.log(e);
    }
  },
  async loadLayers(loadCheckboxes) {
    this.incidentTypes.forEach(async incident => {
      const url =
        this.baseApiUrl +
        "history" +
        this.appendFromToDates("?query=" + incident.searchString);
      const data = await fetchAsync(url);
      writeToFile(data, "data3.json");
    });
  },
  getCrisisType(tweetType) {
    incidentTypes.forEach(type => {
      if (type.id === tweetType) {
        return crisisTypes[type.crisisType];
      }
    });
    return crisisTypes[crisisTypes.NONE];
  },
  async populateTweetList(lat, lng, type) {
    let apiURL;
    if (type === "crisis") {
      apiURL = this.baseApiUrl + "crisis";
    } else {
      apiURL = this.baseApiUrl + "history";
    }
    let query = "?lat=" + lat + "&lng=" + lng;
    query = this.appendFromToDates(query);
    query = this.appendSearchText(query);
    const url = apiURL + query;
    console.log(url);
    const data = await fetchAsync(url);
  },
});

const map = create_DOT_Incident_Map();
map.initMap();
