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

app.put('/users/:id', async (req, res) => {
    const body = req.body;
    const timestamp = new Date().getTime();
    const tableName = process.env.USER_TABLE;
    const id = req.params.id;

    const fetchParams = {
        TableName: tableName,
        Key: {
            id: id
        },
    };
    try {
        const result = await dynamoDb.get(fetchParams).promise();
        let originalCreatedAt = result.Item.createdAt;

        let updatedUser = {
            id: req.params.id,
            createdAt: originalCreatedAt,
            updatedAt: timestamp,
        };

        for (const param in body) {
            updatedUser[param] = body[param];
        };

        const updateParams = {
            TableName: process.env.USER_TABLE,
            Key: {
                id: req.params.id
            },
            Item: updatedUser,
        };
        try {
            const updateRes = await dynamoDb.put(updateParams).promise();
            console.log(updateRes);
            res.status(201).json({
                message: 'Success updating user',
            });
        } catch (e) {
            console.log(`Error putting item: ${e}`);
            res.status(400).json({
                message: `Error putting item`,
                error: `${e}`
            });
        }
    } catch (e) {
        console.log(`Error fetching user: ${e}`);
    }
});

exports.handler = serverless(app);
