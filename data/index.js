const userData = require("./users");
const dictData = require("./dictionaries")
const gameData = require("./games");
const commentData = require("./comments");

module.exports = {
  users: userData,
  games: gameData,
  comments: commentData,
  dictionaries: dictData
};
