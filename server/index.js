const keys = require('./keys');
//connect to FN, redis and progres
// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.connect().then(async ()=>{
    console.log('23, pg connected');
  
    await pgClient
      .query('CREATE TABLE IF NOT EXISTS values (number INT)')
      .catch((err) => console.log(err));
})

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000, // reconnect after 1000 if lose connection
});
//duplicate connection
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/hi', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async (req, res) => {
  // await pgClient
  //   .query('CREATE TABLE IF NOT EXISTS values (number INTEGER)')
  //   .catch((err) => console.log(err));

  const values = await pgClient.query('SELECT * FROM values');
  // no other info, just the data of rows
  res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
  //only callback in redis
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  // await pgClient
  //   .query('CREATE TABLE IF NOT EXISTS values (number INTEGER)')
  //   .catch((err) => console.log(err));

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

app.listen(5000, (err) => {
  console.log('Listening 5000');
});


