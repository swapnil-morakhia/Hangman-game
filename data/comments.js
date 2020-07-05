const mongoCollections = require('../config/mongoCollections');
const comments = mongoCollections.comments;
const users = require('./users');
const games = require('./games');
const uuid = require('uuid');

const exportedMethods = {

    async getAllComments() {
        const commentCollection = await comments();
        if(!commentCollection) throw new Error('No comments in system')
        return await commentCollection.find({}).toArray();
    },

    async getCommentById(id) {
        if (!id) throw new Error('You must provide an id');
        if (typeof id !== 'string') throw new TypeError('id must be a string');

        const commentCollection = await comments();
        const post = await commentCollection.findOne({ _id: id });

        if (!post) throw new Error('404: Post not found');

        return post;
    },

    // async getCommentGameId(id) {
    //     if (!id) throw new Error('You must provide an id');
    //     const gameCollection = await games();
    //     const game = await gameCollection.findOne({_id: id});

    //     if (!game) throw 'Post not found';

    //     return game;

    // }

    async addCommentToGame(gameId, commenterId, commentText) {
        if (!gameId) throw new Error('You must provide a game id');
        if (!commentText) throw new Error('You must provide a comment');
        if (!commenterId) throw new Error('You must provide a commenterId');

        if (typeof gameId !== 'string') throw new TypeError('id must be a string');
        if (typeof commentText !== 'string') throw new TypeError('id must be a string');
        if (typeof commenterId !== 'string') throw new TypeError('id must be a string');

        const commentCollection = await comments();

        const userThatCommented = await users.getUserById(commenterId);

        const newComment = {
            _id: uuid.v4(),
            comment: commentText,
            gameId: gameId,
            commenter: {
                commenterId: commenterId,
                name: `${userThatCommented.firstName} ${userThatCommented.lastName}`
            },
        };

        const newInsertInformation = await commentCollection.insertOne(newComment);

        await games.addCommentToGame(gameId, newComment);
        if (newInsertInformation.insertedCount === 0) throw new Error('500: Insert failed!');
        return await this.getCommentById(newComment._id);
    },

    async getCommentByGame(id) {
        if (!id) throw new Error('You must provide an id');
        if (typeof id !== 'string') throw new TypeError('id must be a string');

        const commentCollection = await comments();
        const commentList =  await commentCollection.find({gameId: id}).toArray();
        if(!commentList) throw new Error('No comments in system');
        return commentList;
    },


    //   async removePost(id) {
    //     const commentCollection = await posts();
    //     let post = null;
    //     try {
    //       post = await this.getPostById(id);
    //     } catch (e) {
    //       console.log(e);
    //       return;
    //     }
    //     const deletionInfo = await commentCollection.removeOne({_id: id});
    //     if (deletionInfo.deletedCount === 0) {
    //       throw `Could not delete post with id of ${id}`;
    //     }
    //     await users.removePostFromUser(post.poster.id, id);
    //     return true;
    //   },

    //   async updatePost(id, updatedPost) {
    //     const commentCollection = await posts();

    //     const updatedPostData = {};

    //     if (updatedPost.tags) {
    //       updatedPostData.tags = updatedPost.tags;
    //     }

    //     if (updatedPost.title) {
    //       updatedPostData.title = updatedPost.title;
    //     }

    //     if (updatedPost.body) {
    //       updatedPostData.body = updatedPost.body;
    //     }

    //     await postCollection.updateOne({_id: id}, {$set: updatedPostData});

    //     return await this.getPostById(id);
    //   },

};

module.exports = exportedMethods;
