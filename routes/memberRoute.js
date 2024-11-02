const express = require('express');
const memberController = require('../controllers/memberController.js');
const { protect } = require('../controllers/authController.js');

const router = express.Router();

router.post('/addmember',protect, memberController.addMemberByEmail);
router.get('/suggestions',protect, memberController.getSuggestionsByEmail);

module.exports = router;
