const express = require('express');
const router = express.Router();
const multer = require('multer');
const videoController = require('../controllers/videoController');

// Use multer memory storage for direct streaming
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('video'), videoController.uploadVideo);

module.exports = router;
