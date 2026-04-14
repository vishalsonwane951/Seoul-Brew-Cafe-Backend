import express from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from "uuid";
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ FIX 1: Disable auto-checksum injection
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",  // ← fixes CRC32 header mismatch
  responseChecksumValidation: "WHEN_REQUIRED",  // ← fixes CRC32 header mismatch
});

router.get("/presign", protect, async (req, res) => {
  try {
    const fileType = req.query.type || "image/jpeg";
    const ext = fileType.split("/")[1] || "jpeg";
    const key = `menu/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 });

    res.json({
      url,
      publicUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});

export default router;