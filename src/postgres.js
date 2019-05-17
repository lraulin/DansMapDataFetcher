const { Client } = require("pg");
const { writeTextAsync, writeJsonAsync } = require("./utils");

const config = {
  user: "postgres",
  host: "localhost",
  database: "map_transition_db",
  password: "postgres",
  port: 5432,
};

const validateData = datum => {
  const keys = Object.keys(datum);
  const neededKeys = ["created", "latitude", "longitude", "type"];
  for (let k of neededKeys) {
    if (!keys.includes(k)) return false;
  }
  if (Number.isNaN(datum.latitude)) return false;
  if (Number.isNaN(datum.longitude)) return false;
  return true;
};

const filterValid = arr => arr.filter(validateData);

const insertSql = (table, values, id = "incident") => {
  values = filterValid(values);
  return `INSERT INTO incident (incident,created,latitude,longitude,type) VALUES
${values
  .map(
    v =>
      `('${v.created}','${v.created}',${v.latitude},${v.longitude},'${
        v.type
      }')`,
  )
  .join(",\n")}
ON CONFLICT (${id}) DO NOTHING;`;
};

const insertOrUpdate = async data => {
  const client = new Client(config);
  client.connect();
  const sql = insertSql("incident", data);
  writeTextAsync("./insert.sql", sql);
  try {
    const res = await client.query(sql, data);
    console.log(res);
  } catch (err) {
    console.log(err);
  } finally {
    client.end();
  }
};

const getUniquePositions = async () => {
  const client = new Client(config);
  client.connect();
  const sql = `SELECT DISTINCT ON (CONCAT (latitude, longitude)) latitude, longitude FROM incident`;
  try {
    const res = await client.query(sql);
    const uniquePositions = res.rows.map(({ latitude, longitude }) => [
      longitude,
      latitude,
    ]);
    writeJsonAsync("unique_positions.json", uniquePositions);
  } catch (e) {
    console.log(e);
  } finally {
    client.end();
  }
};

const updateSql = item => {
  let sql = "UPDATE incident\nSET";
  if (item.event_type) sql += ` event_type = '${item.event_type}',`;
  if (item.user_id) sql += ` user_id = '${item.user_id}',`;
  if (item.description) sql += ` description = '${item.description}',`;
  if (item.id) sql += ` tweet_id = '${item.id}',`;
  sql = sql.slice(0, sql.length - 1);
  sql += `\nWHERE incident = '${item.created}';`;
  return sql;
};

const updateAll = async () => {
  const client = new Client(config);
  client.connect();

  for (let tweet of tweets) {
    const sql = updateSql(tweet);
    console.log("\n" + sql);
    try {
      const res = await client.query(sql);
      console.log(res);
    } catch (e) {
      console.log(e);
    }
  }
  client.end();
};

module.exports = { insertOrUpdate };
