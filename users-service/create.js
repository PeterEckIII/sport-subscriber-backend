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

app.post('/users', (req, res) => {
    const { id, email, password, subscriptions } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
        console.error('Validation Failed');
        res.status(400).json(
            {
                error: 'Couldn\'t submit user because of a validation error'
            });
    } else {
        const selectedSubscriptions = subscriptions.map(sub => {
            if (sub.isSubscribed) {
                return {
                    ...sub
                };
            } else {
                return;
            }
        });

        const timestamp = new Date().getTime();
        const newUser = {
            id: id,
            email: email,
            password: password,
            subscriptions: selectedSubscriptions,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        const newUserInfo = {
            TableName: process.env.USER_TABLE,
            Item: newUser
        };
        dynamoDb.put(newUserInfo)
            .promise()
            .then(_ => {
                res.status(201).json({
                    message: 'Success adding user',
                    id: newUser.id
                });
            })
            .catch(err => {
                console.log(`Error adding user with Error: ${ err }`);
                res.status(400).json({
                    message: 'Could not create user',
                    error: err
                });
            });
    };
});

exports.handler = serverless(app);
