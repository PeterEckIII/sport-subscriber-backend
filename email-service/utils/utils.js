const bcrypt = require('bcrypt');

const createGameObject = (date, time, opponent, location) => {
  let game = {
    date,
    time,
    opponent,
    location,
  };
  return game;
};

const createAllGameObjects = (
  gameCreator,
  dateList,
  timeList,
  opponentList,
  locationList
) => {
  let games = [];
  for (let i = 0; i < dateList.length; i += 1) {
    let gameCreationFunction = gameCreator(
      dateList[ i ],
      timeList[ i ],
      opponentList[ i ],
      locationList[ i ]
    );
    games.push(gameCreationFunction);
  }
  return games;
};

const generateHash = (password) => {
  const saltRounds = 10;
  bcrypt.genSalt(saltRounds, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      return hash;
    });
  });
  return hash;
};

module.exports = {
  createGameObject,
  createAllGameObjects,
  generateHash
}
