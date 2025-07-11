const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Client');

exports.uploadVideo = async (req, res) => {
  console.log('📌 [DEBUG] uploadVideo hit');

  console.log('📌 [DEBUG] req.file:', req.file);
  console.log('📌 [DEBUG] req.body:', req.body);

  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No File Uploaded' });
  }

  const fileName = `${Date.now()}_${file.originalname}`;
  const params = {
    Bucket: process.env.WASABI_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const fileUrl = `https://${process.env.WASABI_BUCKET}.s3.wasabisys.com/${fileName}`;

    return res.status(200).json({ message: 'Upload successful', fileUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};
