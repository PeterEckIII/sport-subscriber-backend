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


app.get('/users/:id', (req, res) => {
    const params = {
        TableName: process.env.USER_TABLE,
        Key: {
            id: req.params.id,
        },
    };

    dynamoDb
        .get(params)
        .promise()
        .then(data => {
            res.status(201).json({
                message: 'Success, user listed',
                user: {
                    id: data.Item.id,
                    email: data.Item.email,
                    subscriptions: data.Item.subscriptions
                }
            });
        })
        .catch(err => {
            res.status(400).json({
                message: 'Error finding user',
                error: err
            });
        });
});

exports.handler = serverless(app);
