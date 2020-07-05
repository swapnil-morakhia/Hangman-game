const express = require('express');
const router = express.Router();
const xss = require('xss');
const data = require("../data");
const users = data.users;

router.get('/', async (req, res) => {
  try {
    let search = xss(req.query['searchUser']);
    let searchUserList = await users.searchUser(search);
    res.render('search', {searchUserList});
  } catch (err) {
    res.status(404).render('error', {
      error: err
    })
  }
});

module.exports = router;