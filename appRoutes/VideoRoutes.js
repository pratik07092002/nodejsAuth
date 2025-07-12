const express = require('express');
const router = express.Router();
const multer = require('multer');
const videoController = require('../controllers/videoController');
const verifyToken = require('../middlewares/verifyToken')

// Use multer memory storage for direct streaming
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload',
    verifyToken,
    upload.single('video'), videoController.uploadVideo);

router.get('/:id', videoController.getVideoById);

module.exports = router;
