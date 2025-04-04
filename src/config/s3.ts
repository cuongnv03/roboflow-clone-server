import AWS from "aws-sdk";
import "../config/dotenv";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;
const bucketName = process.env.S3_BUCKET;

if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
  console.error("FATAL ERROR: Missing required AWS S3 environment variables.");
  throw new Error("Missing required AWS S3 environment variables.");
}

AWS.config.update({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region,
});

const s3 = new AWS.S3();

export { s3, bucketName };
