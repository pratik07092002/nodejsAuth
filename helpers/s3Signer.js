const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = require('../config/s3Client');  // ✅ reuse the working one

exports.generateSignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.WASABI_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 6000 }); // 10 mins
};
