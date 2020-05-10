const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/users/:id', async (req, res) => {
    const params = {
        TableName: process.env.USER_TABLE,
        Key: {
            id: req.params.id,
        },
    };

    await dynamoDb.get(params, (err, res) => {
        if (err) {
            console.error(err);
            res.status(400).json({ error: 'Could not get user' });
        }
        if (res.Item) {
            const { id, name } = res.Item;
            res.json({ id, name });
        } else {
            res.status(404).json({ error: 'User not found' });
        }

    });
});

app.post('/users', async (req, res) => {
    const { username, email, password } = req.body;
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        console.error('Validation Failed');
        res.status(400).json(
            {
                error: 'Couldn\'t submit candidate because of a validation error'
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
    try {
        const userInfo = {
            TableName: process.env.USER_TABLE,
            Item: newUser
        };
        const response = await dynamoDb.put(userInfo);
        if (response) {
            res.json({ message: 'Success', username, email });
        } else {
            res.status(500).json({ error: 'AWS Server Error' });
        }
    } catch (err) {
        console.log(`Error adding user with Error: ${ err }`);
        res.status(400).json({
            message: 'Could not create user',
            error: err
        });
    }
});

exports.handler = serverless(app);
