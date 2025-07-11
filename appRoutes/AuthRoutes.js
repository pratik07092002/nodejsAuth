console.log('✅ routes.js loaded');

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');

router.post('/login', (req,res) =>{
   console.log('✅ Login POST hit');
  authController.login(req,res);
});


router.post('/register', (req, res) => {
  console.log('✅ [REGISTER] POST hit');
  console.log('✅ [REGISTER] Body:', req.body);
  authController.register(req, res);
});

module.exports = router;
