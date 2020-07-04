const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
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

app.delete('games/:id', (req, res) => {
    const params = {
        TableName: process.env.GAME_TABLE,
        Key: {
            id: req.params.id
        }
    };
    dynamoDb
        .delete(params)
        .promise()
        .then(data => {
            res.status(201).json({
                message: 'Success deleting user'
            });
        })
        .catch(err => {
            res.status(401).json({
                message: 'Error deleting user',
                error: err
            });
        });
});

exports.handler = serverless(app);
