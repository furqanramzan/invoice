import { dev } from '$app/environment';
import {
  R2_ACCESS_KEY_ID,
  R2_ACCOUNT_ID,
  R2_BUCKET_NAME,
  R2_PUBLIC_DOMAIN,
  R2_SECRET_ACCESS_KEY,
} from '$env/static/private';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

export async function putFile(key: string, file: File) {
  if (dev) {
    return '';
  }

  const arrayBuffer = await file.arrayBuffer();
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
    }),
  );

  // To get the public URL:
  return `${R2_PUBLIC_DOMAIN}/${key}`;
}

export async function delFile(fileUrl: string) {
  if (dev) {
    return;
  }

  const url = new URL(fileUrl);
  let key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  key = decodeURIComponent(key);

  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key, // Use the cleaned key here
    }),
  );
}
