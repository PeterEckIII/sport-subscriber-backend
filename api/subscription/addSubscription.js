const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();
app.use(bodyParser.json({ strict: false }));

app.post('/users', (req, res) => {
  const { username, email, password } = req.body;
  if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    console.error('Validation Failed');
    res.status(400).json(
      {
        error: 'Couldn\'t submit candidate because of a validation error'
      });
  };

  const timestamp = new Date().getTime();
  const newUser = {
    id: uuid.v1(),
    username: username,
    email: email,
    hash: password,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const newUserInfo = {
    TableName: process.env.USER_TABLE,
    Item: newUser
  };
  dynamoDb.put(newUserInfo)
    .promise()
    .then(data => {
      res.status(201).json({
        message: 'Success adding user',
        email: data.email,
        id: data.id,
        username: data.username
      });
    })
    .catch(err => {
      console.log(`Error adding user with Error: ${ err }`);
      res.status(400).json({
        message: 'Could not create user',
        error: err
      });
    });
});