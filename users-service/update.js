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
    const body = req.body;

    const extractUpdateValues = body => {
        let itemsToUpdate = {};
        for (const param in body) {
            console.log(`${ param }: ${ body[ param ] } (Type: ${ typeof param })`);
            itemsToUpdate[ param ] = body[ param ];
        }
        console.log(`Items to update ${ itemsToUpdate }`);
        return itemsToUpdate;
    };

    const fieldsToUpdate = extractUpdateValues(body);

    const timestamp = new Date().getTime();

    const generateUpdateQuery = fields => {
        let updateParams = {
            UpdateExpression: 'set updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':updatedAt': timestamp,
            },
            ExpressionAttributeNames: {
            }
        };
        Object.entries(fields).forEach(([ key, item ]) => {
            if (key === 'subscriptions') {
                updateParams.ExpressionAttributeNames[ '#subs' ] = key;
                updateParams.ExpressionAttributeValues[ ':subscriptions' ] = item;
                updateParams.ExpressionAttributeValues[ ':empty_list' ] = [];
                updateParams.UpdateExpression += ` #subs = list_append(if_not_exists(#subs, :empty_list), :subscriptions)`;
            } else {
                updateParams.ExpressionAttributeNames[ `#${ key }` ] = key;
                updateParams.ExpressionAttributeValues[ `:${ key }` ] = item;
                updateParams.UpdateExpression += ` #${ key } = :${ key },`;
            }
        });
        updateParams.UpdateExpression = updateParams.UpdateExpression.slice(0, -1);
        console.log(`DynamoDB Update Parameters: ${ JSON.stringify(updateParams) }`);
        return updateParams;
    };

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

    const addedParams = generateUpdateQuery(fieldsToUpdate);

    const baseParams = {
        TableName: process.env.USER_TABLE,
        Key: {
            "id": req.params.id
        },
        ...addedParams,
        ReturnValues: 'ALL_NEW',
    };

    updateFunction(baseParams);
});

exports.handler = serverless(app);
