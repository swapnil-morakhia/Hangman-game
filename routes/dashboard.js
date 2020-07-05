const express = require('express');
const xss = require('xss');
const router = express.Router();
const data = require("../data");
const games = data.games;
const dictionaries = data.dictionaries;
const users = data.users;
const comments = data.comments;

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const currentUser = req.session.user;

    const userGames = await users.getGamesPlayed(currentUser._id);

    const allDict = await dictionaries.getAllDictionaries();
    const allGames = await games.getAllGames();
    const max = await games.getMostPlayedGames();
    const word = max.word;

    for (g of allGames) {
      if (g.latestPlayerId) {
        let latestPlayer = await users.getUserById(g.latestPlayerId);
        g.latestPlayer = latestPlayer;
      }
    }

    res.render('home', {
      title: 'Hangman Home',
      user: currentUser,
      userGames: userGames,
      allDictionaries: allDict,
      allGames: allGames,
      max: word
    });
  } catch (err) {
    res.status(404).render('error', {
      error: err
    });
  }
});

router.get('/allgames', async (req, res, next) => {
  try {
    const currentUser = req.session.user;

    const allGames = await games.getAllGames();

    let sortedGames = allGames.sort((a, b) => (a.gameNumber > b.gameNumber) ? 1 : -1);

    for (g of sortedGames) {
      if (g.latestPlayerId) {
        let latestPlayer = await users.getUserById(g.latestPlayerId);
        g.latestPlayer = latestPlayer;
      }
    }

    res.render('allgames', {
      title: 'Hangman All Games',
      allGames: sortedGames
    });
  } catch (err) {
    res.status(404).render('error', {
      error: err
    });
  }
});

/* GET high scores page. */
router.get('/highscores', async (req, res, next) => {
  try {
    const allUsers = await users.getAllUsers()

    for (usr of allUsers) {
      let totalGames = usr.gamesWonIDs.length + usr.gamesLostIDs.length;
      usr.winPercentage = (totalGames !== 0) ? ((usr.gamesWonIDs.length / totalGames) * 100) : 0;
    }

    //sorts by # of wins, then as a secondary sort (e.g. if theres a tie) it sorts on the win %
    let sortedUsers = allUsers.sort((a, b) => (a.gamesWonIDs.length < b.gamesWonIDs.length) ? 1 : ((a.winPercentage < b.winPercentage) ? 1 : -1));

    res.render('highscores', {
      title: 'Hangman High Scores',
      user: req.session.user,
      sortedUsers: sortedUsers
    });
  } catch (err) {
    res.render('error', {
      error: err
    });
  }
});

/* GET profile page. */
router.get('/profile', async (req, res, next) => {
  try {
    let totalGames = req.session.user.gamesWonIDs.length + req.session.user.gamesLostIDs.length;
    let winPercentage = (totalGames !== 0) ? ((req.session.user.gamesWonIDs.length / totalGames) * 100) : 0;
    let recentGames = await users.getGamesPlayed(req.session.user._id);

    res.render('profile', {
      title: 'Hangman User Profile',
      user: req.session.user,
      win: winPercentage,
      total: totalGames,
      recentGames: recentGames
    });
  } catch (err) {
    res.status(404).render('error', {
      error: err
    });
  }
});

/* GET profile page for other users */
router.get('/profile/:id', async (req, res, next) => {
  try {
    let user = await users.getUserById(xss(req.params.id));
    let totalGames = user.gamesWonIDs.length + user.gamesLostIDs.length;
    winPercentage = (totalGames !== 0) ? ((user.gamesWonIDs.length / totalGames) * 100) : 0;
    let recentGames = await users.getGamesPlayed(user._id);

    res.render('profile', {
      title: 'Hangman User Profile',
      user: user,
      win: winPercentage,
      total: totalGames,
      recentGames: recentGames
    });
  } catch (err) {
    res.status(404).render('error', {
      error: err
    })
  }
});


/* GET game page. */
router.get('/game', async (req, res, next) => {
  try {
    const gameId = xss((req.query['gameId']) ? req.query['gameId'] : '');
    let word = ''
    if (gameId) {
      g = await games.getGameById(gameId);
      word = g['word'];
    }

    const themeId = xss((req.query['themeId']) ? req.query['themeId'] : '');
    if (req.query['themeId']) {
      t = await dictionaries.getDictionaryById(themeId)
      word = t.words[Math.floor(Math.random() * t.words.length)]
    }

    if (word.length === 0 || !word) {
      res.redirect('/dashboard');
      return;
    }

    const game = await games.getGameByWord(word.toUpperCase());

    // Check to see if the user has already played the game,
    // if they have, redirect them to the results page
    const alreadyPlayed = await users.userHasPlayed(req.session.user._id, game._id);

    if (alreadyPlayed) {
      res.redirect(`/dashboard/comments/${game._id}`);
    } else {
      res.render('game', {
        title: 'Hangman Game',
        user: req.session.user,
        gameId: game._id,
        word: word,
      });
    }
  } catch (err) {
    res.status(404).render('error', {
      error: err
    })
  }
});

/* POST game resuts. */
router.post('/game', async (req, res, next) => {
  try {
    const currentUserID = req.session.user._id;
    const currentGameID = xss(req.body.gameId);
    const gameWon = xss(req.body.gameWon);

    await games.addPlayer(currentGameID, currentUserID);

    if (gameWon) {
      await users.addGameWonID(currentUserID, currentGameID);
    } else {
      await users.addGameLostID(currentUserID, currentGameID);
    }

    // Need to update the current user after game submission
    const user = await users.getUserById(currentUserID);

    let userInfo = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      city: user.city,
      state: user.state,
      gamesPlayedIDs: user.gamesPlayedIDs,
      gamesWonIDs: user.gamesWonIDs,
      gamesLostIDs: user.gamesLostIDs
    }

    req.session.user = userInfo;

    res.end();
  } catch (err) {
    res.status(500).render('error', {
      error: err
    })
  }
});


// TODO: eventually remove this
router.get('/comments', async (req, res, next) => {
  res.redirect('/dashboard');
});

/* GET comments for a game. */
router.get('/comments/:id', async (req, res) => {
  try {
    let game = await games.getGameById(xss(req.params.id));
    let commentList = game.comments;
    let gameWon = await users.userWon(req.session.user._id, game._id);

    if (commentList) {
      res.render('comments', {
        title: 'Game Results',
        comments: commentList,
        gameWon: gameWon,
        game: game
      });
    }
  } catch (err) {
    res.status(404).render('error', {
      error: err
    })
  }
});

router.post('/comments', async (req, res) => {
  try {
    const newComment = await comments.addCommentToGame(xss(req.body.gameId), req.session.user._id, xss(req.body.comment));
    res.render('partials/new-comment', {layout: null, ...newComment});
  } catch (err) {
    res.status(500).render('error', {
      error: err
    })
  }
});

module.exports = router;
