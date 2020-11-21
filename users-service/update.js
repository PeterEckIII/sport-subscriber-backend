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

    // SET FETCH PARAMS
    const fetchParams = {
        TableName: tableName,
        Key: {
            id: id
        },
    };
    try {
        const res = await dynamoDb.get(fetchParams).promise();
        let originalCreatedAt = res.Item.createdAt;

        let updatedUser = {
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
            ReturnValues: 'ALL_NEW'
        };
        const updateRes = await dynamoDb.put(updateParams);
        console.log(updateRes.response.httpResponse.statusCode);
        console.log(updateRes);
    } catch (e) {
        console.log(`Error fetching user: ${e}`);
    }
    // dynamoDb
    //     .get(fetchParams)
    //     .promise()
    //     .then(res => {
    //         return res.Item;
    //     })
    //     .then(user => {
    //         originalCreatedAt = String(user.createdAt);
    //         console.log(`Stringified created date: ${originalCreatedAt}`);
    //         return originalCreatedAt;
    //     })
    //     .catch(e => console.log(`Error fetching user: ${e}`));

    // const updateParams = {
    //     TableName: process.env.USER_TABLE,
    //     Key: {
    //         "id": req.params.id
    //     },
    //     Item: updatedUser
    // };
});

exports.handler = serverless(app);

/*eslint no-trailing-spaces: ["error", { "ignoreComments": true }]*/

//     // ====================== OLD CODE ====================== 
//     const extractUpdateValues = body => {
//         let itemsToUpdate = {};
//         for (const param in body) {
//             console.log(`${ JSON.stringify(param) }: ${ JSON.stringify(body[ param ]) } (Type: ${ typeof param })`);
//             itemsToUpdate[ param ] = body[ param ];
//         }
//         console.log(`Items to update ${ JSON.stringify(itemsToUpdate) }`);
//         return itemsToUpdate;
//     };

//     const fieldsToUpdate = extractUpdateValues(body);

//     const timestamp = new Date().getTime();

//     const generateUpdateQuery = fields => {
//         let updateParams = {
//             UpdateExpression: 'set updatedAt = :updatedAt',
//             ExpressionAttributeValues: {
//                 ':updatedAt': timestamp,
//             },
//             ExpressionAttributeNames: {
//             }
//         };
//         Object.entries(fields).forEach(([ key, item ]) => {
//             if (key === 'subscriptions') {
//                 updateParams.Key['subscriptions'];
//                 updateParams.ExpressionAttributeNames[ '#subs' ] = key;
//                 updateParams.ExpressionAttributeValues[ ':subscriptions' ] = item;
//                 updateParams.ExpressionAttributeValues[ ':empty_list' ] = [];
//                 updateParams.UpdateExpression += ` #subs = list_append(if_not_exists(#subs, :empty_list), :subscriptions)`;
//             } else {
//                 updateParams.ExpressionAttributeNames[ `#${ key }` ] = key;
//                 updateParams.ExpressionAttributeValues[ `:${ key }` ] = item;
//                 updateParams.UpdateExpression += ` #${ key } = :${ key },`;
//             }
//         });
//         updateParams.UpdateExpression = updateParams.UpdateExpression.slice(0, -1);
//         console.log(`DynamoDB Update Parameters: ${ JSON.stringify(updateParams) }`);
//         return updateParams;
//     };

//     const updateFunction = (params) => {
//         dynamoDb
//             .update(params)
//             .promise()
//             .then(result => {
//                 res.status(201).json({
//                     message: `Success updating record`,
//                 });
//             })
//             .catch(err => {
//                 console.log(`Error adding user with Error: ${ err }`);
//                 res.status(401).json({
//                     message: `Error updating user`,
//                     error: err
//                 });
//             });
//     };

//     const addedParams = generateUpdateQuery(fieldsToUpdate);

//     const baseParams = {
//         TableName: process.env.USER_TABLE,
//         Key: {
//             "id": req.params.id
//         },
//         ...addedParams,
//         ReturnValues: 'ALL_NEW',
//     };

//     updateFunction(baseParams);
// });
