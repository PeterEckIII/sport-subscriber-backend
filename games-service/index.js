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

app.put('games/:id', (req, res) => {
    const { opponent, date, time, location, videoLink, } = req.body;
    const updateFunction = params => {
        dynamoDb
            .update(params)
            .promise()
            .then(data => {
                res.status(201).json({
                    message: 'Success updating game',
                });
            })
            .catch(err => {
                res.status(400).json({
                    message: 'Error updating game',
                    error: err
                });
            });
    };

    const timestamp = new Date().getTime();
    const baseParams = {
        TableName: process.env.GAME_TABLE,
        Key: {
            'id': req.params.id
        },
        ReturnValues: 'ALL_NEW'
    };
    let fieldToUpdate;
    if (typeof opponent === 'string') {
        fieldToUpdate = opponent;
        let params = {
            ...baseParams,
            ExpressionAttributeValues: {
                ':opponent': fieldToUpdate,
                ':updatedAt': timestamp
            },
            UpdateExpression: 'SET opponent = :opponent, updatedAt = :updatedAt'
        };
        updateFunction(params);
    }
    if (typeof date === 'string') {
        fieldToUpdate = date;
        let params = {
            ...baseParams,
            ExpressionAttributeNames: {
                "#d": "date"
            },
            ExpressionAttributeValues: {
                ':date': fieldToUpdate,
                ':updatedAt': timestamp
            },
            UpdateExpression: 'SET #d = :date, updatedAt = :updatedAt'
        };
        updateFunction(params);
    }
    if (typeof time === 'string') {
        fieldToUpdate = time;
        let params = {
            ...baseParams,
            ExpressionAttributeNames: {
                "#tim": "time"
            },
            ExpressionAttributeValues: {
                ':time': fieldToUpdate,
                ':updatedAt': timestamp
            },
            UpdateExpression: 'SET #tim = :time, updatedAt = :updatedAt'
        };
        updateFunction(params);
    }
    if (typeof location === 'string') {
        fieldToUpdate = location;
        let params = {
            ...baseParams,
            ExpressionAttributeNames: {
                "#loc": "location"
            },
            ExpressionAttributeValues: {
                ':location': fieldToUpdate,
                ':updatedAt': timestamp
            },
            UpdateExpression: 'SET #loc = :location, updatedAt = :updatedAt'
        };
        updateFunction(params);
    }
    if (typeof videoLink === 'string') {
        fieldToUpdate = videoLink;
        let params = {
            ...baseParams,
            ExpressionAttributeValues: {
                ':videoLink': fieldToUpdate,
                ':updatedAt': timestamp
            },
            UpdateExpression: 'SET videoLink = :videoLink, updatedAt = :updatedAt'
        };
        updateFunction(params);
    }
});

exports.handler = serverless(app);
