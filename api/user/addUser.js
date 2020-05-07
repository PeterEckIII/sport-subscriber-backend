const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.submit = async (event, _, callback) => {
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
                message: `Successfully added user ${ username } with email ${ email }`,
                userId: `${ result.id }`
            })
        });
    } catch (err) {
        console.error(`Error adding user ${ username }. Failed with error: ${ err }`);
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                message: `Unable to add user ${ username }`
            })
        });
    }
};

const submitUser = (user, callback) => {
    console.log(`Submitting user...`);
    const userInfo = {
        TableName: process.env.USER_TABLE,
        Item: user
    };
    return dynamoDb
        .put(userInfo)
        .promise()
        .then(_ => user)
        .catch(err => {
            console.warn(err);
            callback(null, {
                statusCode: 500,
                body: JSON.stringify({
                    message: `Unable to add user`
                })
            });
        });
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
