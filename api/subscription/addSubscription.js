'use strict';

module.exports.submit = async (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Serverless is up and running!',
      input: event,
    })
  }
  callback(null, response);
};
