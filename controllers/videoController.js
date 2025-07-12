const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Client');
const pool = require('../config/dBConfig');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { generateSignedUrl } = require('../helpers/s3Signer');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);


// ✅ Upload Handler
exports.uploadVideo = async (req, res) => {
  try {
    console.log('📌 [DEBUG] uploadVideo hit');
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No File Uploaded' });
    }

    const title = path.parse(file.originalname).name;
    const uniqueId = Date.now();
    const folderName = `hls/${title}_${uniqueId}`.replace(/\s+/g, '_');

    const tempInputDir = path.join(__dirname, '../tmp/uploads');
    const tempOutputDir = path.join(__dirname, '../tmp/outputs', folderName);
    await fs.ensureDir(tempInputDir);
    await fs.ensureDir(tempOutputDir);

    const inputFileName = `${uniqueId}_${file.originalname}`;
    const inputFilePath = path.join(tempInputDir, inputFileName);
    await fs.writeFile(inputFilePath, file.buffer);

    const masterPlaylist = path.join(tempOutputDir, 'master.m3u8');
    const segmentPattern = path.join(tempOutputDir, 'segment%d.ts');

    await new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .outputOptions([
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls',
          '-hls_segment_filename', segmentPattern
        ])
        .output(masterPlaylist)
        .on('start', (cmd) => console.log('📌 [FFMPEG] Command:', cmd))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Inspect playlist
    const playlistContent = await fs.readFile(masterPlaylist, 'utf-8');
    console.log('📄 [CHECK] Final master.m3u8:\n', playlistContent);

    if (playlistContent.includes('http')) {
      throw new Error('❌ Playlist should NOT contain full URLs — check ffmpeg config!');
    }

    // Upload all output files
    const files = await fs.readdir(tempOutputDir);
    for (const fileName of files) {
      const fileContent = await fs.readFile(path.join(tempOutputDir, fileName));

      const params = {
        Bucket: process.env.WASABI_BUCKET,
        Key: `${folderName}/${fileName}`,
        Body: fileContent,
        ContentType: fileName.endsWith('.m3u8')
          ? 'application/vnd.apple.mpegurl'
          : 'video/MP2T',
      };

      console.log(`🚀 Uploading: ${params.Key}`);
      const command = new PutObjectCommand(params);
      await s3Client.send(command);
    }

    // Save metadata in DB
    const fileUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${folderName}/master.m3u8`;

    const insertQuery = `
      INSERT INTO videos (user_id, title, url)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [req.user.userId, title, fileUrl]);

    // Clean up
    await fs.remove(tempInputDir);
    await fs.remove(tempOutputDir);

    res.status(200).json({
      message: 'Upload successful',
      video: result.rows[0],
    });

  } catch (err) {
    console.error('❌ uploadVideo error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};


// ✅ Get Video by ID (HLS .m3u8 rewritten with signed .ts URLs)
exports.getVideoById = async (req, res) => {
  try {
     res.setHeader('Access-Control-Allow-Origin', '*');
    const videoId = req.params.id;

    // Get video from DB
    const result = await pool.query('SELECT * FROM videos WHERE id = $1', [videoId]);
    if (!result.rows.length) {
      return res.status(404).json({ message: "Video not found" });
    }
    const video = result.rows[0];

    // Extract bucket key
    const bucketBaseUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/`;
    const m3u8Key = video.url.replace(bucketBaseUrl, '');

    // Download playlist directly from S3 (optional — more efficient: just sign the playlist too!)
    const playlistSignedUrl = await generateSignedUrl(m3u8Key);

    // ✅ Fetch playlist file from S3
    const axios = require('axios');
    const playlistRes = await axios.get(playlistSignedUrl);
    const playlist = playlistRes.data;

    // Rewrite .ts lines to signed
    const lines = playlist.split('\n');
    const rewrittenLines = await Promise.all(
      lines.map(async (line) => {
        if (line.trim().endsWith('.ts')) {
          const segmentKey = m3u8Key.replace(/[^/]+$/, '') + line.trim();
          const signedSegmentUrl = await generateSignedUrl(segmentKey);
          return signedSegmentUrl;
        } else {
          return line;
        }
      })
    );

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.status(200).send(rewrittenLines.join('\n'));

  } catch (error) {
    console.error('🔥 getVideoById error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
