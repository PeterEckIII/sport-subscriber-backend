const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.submit = async (event, _, callback) => {
    const body = JSON.parse(event.body);
    const { username, email, password } = body;
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        console.error('Validation Failed');
        callback(new Error('Couldn\'t submit candidate because of a validation error'));
        return;
    };
    try {
        const result = await submitUser(userInfo(username, email, password), callback);
        callback(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully added user ${ result.username } with email ${ result.email }`,
                user: {
                    "id": result.id,
                    "username": result.username,
                    "email": result.email,
                    "createdAt": result.createdAt,
                    "updatedAt": result.updatedAt
                }
            })
        });
    } catch (err) {
        console.error(`Error adding user ${ username }. Failed with error: ${ err }`);
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                message: `Unable to add user ${ username } because of ${ err }`
            })
        });
    }
};

const submitUser = async (user, callback) => {
    console.log(`Submitting user...`);
    const userInfo = {
        TableName: process.env.USER_TABLE,
        Item: user
    };
    try {
        const response = await dynamoDb.put(userInfo);
        return response;
    } catch (err) {
        console.warn(err);
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                message: `Unable to add user '${ user.username } with error ${ err }'`
            })
        });
    }
};

const userInfo = (username, email, password) => {
    const timestamp = new Date().getTime();
    return {
        id: uuid.v1(),
        username: username,
        email: email,
        hash: password,
        createdAt: timestamp,
        updatedAt: timestamp
    };
};
