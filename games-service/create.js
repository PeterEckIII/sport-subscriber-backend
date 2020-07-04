const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const uuid = require('uuid');
const AWS = require('aws-sdk');

// CONFIGURATION
AWS.config.setPromisesDependency(require('bluebird'));

app.use(bodyParser.json({ strict: false }));

const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb;
if (IS_OFFLINE === 'true') {
    dynamoDb = new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:3001'
    });
    console.log(dynamoDb);
} else {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
}

app.post('/games', (req, res) => {
    const { opponent, date, time, location, videoLink, } = req.body;
    if (typeof opponent !== 'string' || typeof date !== 'string' || typeof location !== 'string' || typeof videoLink !== 'string' || typeof time !== 'string') {
        console.log('Validation Failed');
        res.status(400).json({
            error: 'Couldn\'t submit game because of a validation  error'
        });
    };

    const timestamp = new Date().getTime();
    const newGame = {
        id: uuid.v4(),
        opponent,
        date,
        time,
        location,
        videoLink,
        createdAt: timestamp,
        updatedAt: timestamp
    };

    const newGameInfo = {
        TableName: process.env.GAME_TABLE,
        Item: newGame
    };

    dynamoDb
        .put(newGameInfo)
        .promise()
        .then(data => {
            res.status(201).json({
                message: 'Success adding game',
                game: {
                    ...data
                }
            });
        })
        .catch(err => {
            res.status(400).json({
                message: 'Error adding game',
                error: err
            });
        });
});

exports.handler = serverless(app);
