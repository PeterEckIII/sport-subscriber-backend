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


app.put('/users/:id', (req, res) => {
    const { username, email, password } = req.body;

    const updateFunction = (params) => {
        dynamoDb
            .update(params)
            .promise()
            .then(result => {
                res.status(201).json({
                    message: `Success updating record`,
                });
            })
            .catch(err => {
                console.log(`Error adding user with Error: ${ err }`);
                res.status(401).json({
                    message: `Error updating user`,
                    error: err
                });
            });
    };

    const timestamp = new Date().getTime();
    const baseParams = {
        TableName: process.env.USER_TABLE,
        Key: {
            "id": req.params.id
        },
        ReturnValues: 'ALL_NEW'
    };
    let fieldToUpdate;
    if (typeof username === 'string') {
        fieldToUpdate = username;
        let params = {
            ...baseParams,
            ExpressionAttributeValues: {
                ':userName': fieldToUpdate,
                ':updatedAt': timestamp
            },
            UpdateExpression: 'SET username = :userName, updatedAt = :updatedAt'
        };
        updateFunction(params);
    }
    if (typeof password === 'string') {
        fieldToUpdate = password;
        let params = {
            ...baseParams,
            ExpressionAttributeValues: {
                ':userHash': password,
                ':updatedAt': timestamp
            },
            ExpressionAttributeNames: {
                '#h': 'hash'
            },
            UpdateExpression: 'SET #h = :userHash, updatedAt = :updatedAt'
        };
        updateFunction(params);

    }
    if (typeof email === 'string') {
        fieldToUpdate = email;
        let params = {
            ...baseParams,
            ExpressionAttributeValues: {
                ':userEmail': email,
                ':updatedAt': timestamp
            },
            UpdateExpression: 'SET email = :userEmail, updatedAt = :updatedAt'
        };
        updateFunction(params);
    }
});

exports.handler = serverless(app);
