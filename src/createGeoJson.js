const data = require("../dansData.json");
const { writeToFile } = require("./writeToFile");

const geoJsonArray = data.map(item => {
  const {
    created,
    latitude,
    longitude,
    type,
    event_type,
    fatalities,
    injuries,
  } = item;
  return {
    type: "Feature",
    id: created,
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    properties: {
      type,
      event_type,
      fatalities,
      injuries,
    },
  };
});

const geoJsonFeatureCollection = {
  type: "FeatureCollection",
  features: geoJsonArray,
};

writeToFile(geoJsonFeatureCollection, "tweets.geojson");
