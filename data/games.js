const mongoCollections = require('../config/mongoCollections');
const games = mongoCollections.games;
const uuid = require('uuid');
const users = require('./users');

let exportedMethods = {

    async getAllGames() {
        const gameCollection = await games();
        const gameList = await gameCollection.find({}).toArray();
        if (!gameList) throw new Error('404: Game not found');
        return gameList;
    },

    async getGameById(id) {
        if (!id) throw new Error('You must provide an id');
        if (typeof id !== 'string') throw new TypeError('id must be a string');


        const gameCollection = await games();
        const game = await gameCollection.findOne({ _id: id });

        if (!game) throw new Error('404: Game not found');

        return game;
    },

    async getGameByWord(word) {
        if (!word) throw new Error('You must provide a word');
        if (typeof word !== 'string') throw new TypeError('word must be a string');

        const gameCollection = await games();
        const game = await gameCollection.findOne({ word: word });

        if (!game) throw new Error(`404: Game with the word ${word} not found`);

        return game;
    },

    async addGame(word) {
        if (!word) throw new Error('You must provide a word');
        if (typeof word !== 'string') throw new TypeError('word must be a string');

        word = word.toUpperCase();

        let gameExists;
        try {
            const game = await this.getGameByWord(word);
            gameExists = true;
        } catch (err) {
            gameExists = false;
        }

        const allgames = await this.getAllGames();
        const gameNumber = allgames.length + 1;

        if (gameExists) throw new Error(`500: Game with the word ${word} already exists`);
                
        let newGame = {
            _id: uuid.v4(),
            gameNumber: gameNumber,
            word: word,
            lastTimePlayed: new Date().toTimeString(),
            latestPlayerId: "",
            partOf: [], //must get all IDs of dictionaries containing this word
            timesWon: 0,
            timesLost: 0,
            playedBy: [], //must get all IDs of players who have attempted this game
            comments: []
        };
        
        const gameCollection = await games();
        const newInsertInformation = await gameCollection.insertOne(newGame);

        if (newInsertInformation.insertedCount === 0) throw new Error('500: Insert failed!');
        
        return await this.getGameById(newInsertInformation.insertedId);
    },

    async incrementTimesWon(id) {
        if (!id) throw new Error('You must provide an id');
        if (typeof id !== 'string') throw new TypeError('id must be a string');

        const g = await this.getGameById(id);

        let timesWon = g.timesWon;
        timesWon += 1;

        const gameCollection = await games();
        const updateInfo = await gameCollection.updateOne(
            {_id: id},
            {$set: {timesWon: timesWon}}
        );

        return this.getGameById(id);

    },

    async incrementTimesLost(id) {
        if (!id) throw new Error('You must provide an id');
        if (typeof id !== 'string') throw new TypeError('id must be a string');

        const g = await this.getGameById(id);

        let timesLost = g.timesLost;
        
        timesLost += 1;

        const gameCollection = await games();
        const updateInfo = await gameCollection.updateOne(
            {_id: id},
            {$set: {timesLost: timesLost}}
        );

        return this.getGameById(id);

    },

    async removeGame(id) {
        if (!id) throw new Error('You must provide an id');
        if (typeof id !== 'string') throw new TypeError('id must be a string');

        const gameCollection = await games();
        const deletionInfo = await gameCollection.removeOne({ _id: id });
        if (deletionInfo.deletedCount === 0) {
            throw new Error(`Could not delete game with id of ${id}`);
        }
        return true;
    },

    // async updateGame(id, word, lastTimePlayed, latestPlayerId, partOf, timesWon, timesLost, playedBy, comments) {
    //     if (!id) throw new Error('You must provide an id');
    //     if (!word) throw new Error('You must provide a word');
    //     if (!lastTimePlayed) throw new Error('You must provide a date for last time played');
    //     if (!latestPlayerId) throw new Error('You must provide the latest player');
    //     if (!partOf) throw new Error('You must provide an array of dictionary ids that the word is contained in');
    //     if (!timesWon) throw new Error('You must provide the times won');
    //     if (!timesList) throw new Error('You must provide the times lost');
    //     if (!playedBy) throw new Error('You must provide an array of user ids that have played this game');
    //     if (!comments) throw new Error('You must provide array of  times lost');


    //     // if (typeof word != 'string') throw new TypeError('word must be a string');
    //     // if (typeof hashedPassword != 'string') throw new TypeError('hashedPassword must be a string');
    //     // if (typeof firstName != 'string') throw new TypeError('firstName must be a string');
    //     // if (typeof lastName != 'string') throw new TypeError('lastName must be a string');
    //     // if (typeof city != 'string') throw new TypeError('city must be a string');
    //     // if (typeof state != 'string') throw new TypeError('state must be a string');

    //     const game = await this.getGameById(id);
    //     console.log(game);

    //     const gameUpdateInfo = {
    //         word: word,
    //         lastTimePlayed: lastTimePlayed,
    //         latestPlayer: latestPlayer,
    //         partOf: partOf,
    //         timesWon: timesWon,
    //         timesLost: timesLost,
    //         playedBy: playedBy,
    //         comments: comments
    //     };

    //     const gameCollection = await games();
    //     const updateInfo = await gameCollection.updateOne({ _id: id }, { $set: gameUpdateInfo });
    //     if (!updateInfo.matchedCount && !updateInfo.modifiedCount) throw 'Update failed';

    //     return await this.getGameById(id);
    // },

    async addThemeToGame(gameId, dictionaryId) {
        if (!gameId) throw new Error('You must provide a gameId');
        if (!dictionaryId) throw new Error('You must provide a dictionaryId');

        if (typeof gameId !== 'string') throw new TypeError('gameId must be a string');
        if (typeof dictionaryId !== 'string') throw new TypeError('dictionaryId must be a string');



        const game = await this.getGameById(gameId);

        let themeList = game.partOf;

        themeList.push(dictionaryId);

        const gameCollection = await games();
        const updateInfo = await gameCollection.updateOne(
            {_id: gameId},
            {$set: {partOf: themeList}}
        );

        return await this.getGameById(gameId);
    },

    async addCommentToGame(gameId, comment) {
        if (!gameId) throw new Error('You must provide a gameId');
        if (!comment) throw new Error('You must provide a comment');

        if (typeof gameId !== 'string') throw new TypeError('gameId must be a string');

        const commentInfo = {
            commentId: comment._id,
            comment: comment.comment,
            commenter: comment.commenter
        }

        const gameCollection = await games();
        const updateInfo = await gameCollection.updateOne(
            {_id: gameId},
            {$addToSet: {comments: commentInfo}}
        );

        if (!updateInfo.matchedCount && !updateInfo.modifiedCount) throw new Error('Comment add failed');

        return await this.getGameById(gameId);
    },

    async addPlayer(gameId, userId) {
        if (!gameId) throw new Error('You must provide a gameId');
        if (!userId) throw new Error('You must provide a userId');

        if (typeof gameId !== 'string') throw new TypeError('gameId must be a string');
        if (typeof userId !== 'string') throw new TypeError('userId must be a string');

        const game = await this.getGameById(gameId);

        let userPlayedList = game.playedBy;

        userPlayedList.push(userId);


        const gameCollection = await games();
        const updateInfo = await gameCollection.updateOne(
            {_id: gameId},
            {$set: {playedBy: userPlayedList, lastTimePlayed: new Date().toTimeString(), latestPlayerId: userId}}
        );

        return await this.getGameById(gameId);
    },

    async getMostRecent() {
        const gameCollection = await games();
        const gameList = await gameCollection.find({}).limit(10).toArray();
        if (!gameList) throw new Error('404: Game not found');
        return gameList;
    },

    async getMostRecentID(id) {
        if (!id) throw new Error('You must provide an id');
        if (typeof id !== 'string') throw new TypeError('id must be a string');

        const gameCollection = await games();
        const gameList = await gameCollection.find({playedBy: id}).limit(10).toArray();
        if (!gameList) throw new Error('404: Game not found');
        return gameList;
    },
    
    async getMostPlayedGames() {
        let gameplayed = []       
        let word = []
        const games = await this.getAllGames();
        
        for (x in games){
            var high = games[x].playedBy.length
            var wordof =  games[x].word;
            if (high > 0){
                high = games[x].playedBy.length;
                wordof =  games[x].word;    
            }
        }
        word.push(wordof)
        gameplayed.push(high)
        result = {
            word: word,
            max: gameplayed
        }
        return result;
    }

};

module.exports = exportedMethods;
