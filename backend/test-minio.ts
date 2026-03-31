import { Client as MinioClient } from 'minio';

async function testMinio() {
  const minioClient = new MinioClient({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'lbaraka',
    secretKey: 'lbaraka123',
  });

  try {
    console.log('Checking bucket exists...');
    const exists = await minioClient.bucketExists('lbaraka-annonces');
    console.log('Bucket exists:', exists);
  } catch (err) {
    console.error('MinIO Error:', err);
  }
}

testMinio();
