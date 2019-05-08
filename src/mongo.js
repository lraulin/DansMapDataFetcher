const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/incidentmap", {
  useNewUrlParser: true,
});

const DansTweet = mongoose.model("DansTweet", {
  created: String,
  lat: Number,
  lng: Number,
  type: String,
  fatalities: Number,
  injuries: Number,
  incident_type: String,
});

const saveTweet = ({
  created,
  lat,
  lng,
  type,
  fatalities,
  injuries,
  incident_type,
  description,
  id,
  user_id,
}) => {
  const tweet = new DansTweet({
    id,
    lat,
    lng,
    type,
    fatalities,
    injuries,
    incident_type,
    created,
    description,
    user_id,
  });
  tweet
    .save()
    .then(() => console.log("Tweet Saved!"))
    .catch(err => console.log(err));
};

module.exports = { saveTweet };
