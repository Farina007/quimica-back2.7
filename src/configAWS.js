import { S3Client } from "@aws-sdk/client-s3";
import 'dotenv/config'

// Inicialize o cliente S3 com as credenciais e região corretas
const s3Client = new S3Client({
  region: 'sa-east-1',
  credentials: { 
      accessKeyId: 'AKIA2HVQ5S572LOQGTXB',
      secretAccessKey: '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' 
  }
});

export default s3Client
