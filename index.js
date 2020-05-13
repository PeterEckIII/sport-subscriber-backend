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

// ROUTES
app.get('/', (req, res) => {
    res.send('Hello World!');
});

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
                message: 'Success, user listed below',
                user: data
            });
        })
        .catch(err => {
            res.status(400).json({
                message: 'Error finding users',
                error: err
            });
        });
});

app.post('/users', (req, res) => {
    const { username, email, password } = req.body;
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        console.error('Validation Failed');
        res.status(400).json(
            {
                error: 'Couldn\'t submit user because of a validation error'
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

app.put('/users/:id', (req, res) => {
    const {
        username,
        email,
        password
    } = req.body;

    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        console.error('Validation Failed');
        res.status(400).json({
            error: 'Couldn\'t edit candidate because of a validation error'
        });
    }

    const timestamp = new Date().getTime();
    const params = {
        TableName: process.env.USER_TABLE,
        Key: {
            id: req.params.id
        },
        ExpressionAttributeNames: {
            "#h": "hash"
        },
        ExpressionAttributeValues: {
            ':userName': username,
            ':userEmail': email,
            ':userHash': password,
            ':updatedAt': timestamp
        },
        UpdateExpression: 'SET username = :userName, email = :userEmail, #h = :userHash, updatedAt = :updatedAt',
        ReturnValues: 'ALL_NEW'
    };
    dynamoDb.update(params).promise().then(result => {
        res.status(201).json({
            message: `Success updating record`,
            data: [ ...result ]
        });
    }).catch(err => {
        res.status(401).json({
            message: `Error updating user`,
            error: { ...err }
        });
    });
});

app.delete('/users/:id', (req, res) => {
    const id = req.params.id;
    const params = {
        TableName: process.env.USER_TABLE,
        Key: {
            id: id
        }
    };
    dynamoDb.delete(params).promise().then(data => {
        res.status(201).json({
            message: `Success deleting user`
        });
    }).catch(err => {
        res.status(401).json({
            message: `Error deleting user`,
            error: err
        });
    });
});

exports.handler = serverless(app);
