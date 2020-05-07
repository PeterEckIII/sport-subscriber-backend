'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.submit = async (event, _, callback) => {
  const body = JSON.parse(event.body);
  const subscriptionName = body.subScriptionName;
  if (typeof subscriptionName !== 'string') {
    console.error('Validation Failed');
    callback(new Error('Couldn\t submit candidate because of a validation error'));
    return;
  }
  submitSubscription(subscriptionInfo(subscriptionName))
};

const submitSubscription = subscription => {
  console.log(`Submitting subscription...`)
  const subscriptionInfo = {
    TableName: process.env.SUBSCRIPTION_TABLE,
    Item: subscription
  }
  return dynamoDb
    .put(subscriptionInfo)
    .promise()
    .then(res => subscription)
    .catch(err => {
      console.warn(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to add subscription ${ subscription }`
        })
      })
    })
}

const subscriptionInfo = (subscriptionName, id) => {
  const timestamp = new Date().getTime();
  return {
    id: uuid.v1(),
    name: subscriptionName
  };
};
