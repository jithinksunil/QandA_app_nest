import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

@Injectable()
export class AwsService {
  constructor(private readonly config: ConfigService) {}
  async uploadFile({
    multerFile,
    userId,
  }: {
    userId: string;
    multerFile: Express.Multer.File;
  }) {
    const { originalname: originalName } = multerFile;
    const bucket = this.config.get('AWS_BUCKET_NAME');
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
    const s3 = new S3({
      accessKeyId,
      secretAccessKey,
    });

    const date = new Date();
    const prepend = String(date.getTime());

    const params: S3.PutObjectRequest = {
      Bucket: bucket,
      Key: `${userId}/${prepend}/${originalName}`,
      Body: multerFile.buffer,
    };
    const { Location, Key } = await s3.upload(params).promise();
    return { location: Location, key: Key };
  }

  async deleteFile(key: string): Promise<void> {
    const bucket = this.config.get('AWS_BUCKET_NAME');
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');

    const s3 = new S3({
      accessKeyId,
      secretAccessKey,
    });

    const params: S3.DeleteObjectRequest = {
      Bucket: bucket,
      Key: key,
    };
    await s3.deleteObject(params).promise();
  }

  async getSignedUrlOfFile(key: string) {
    const bucket = this.config.get('AWS_BUCKET_NAME');
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
    const s3 = new S3({
      accessKeyId,
      secretAccessKey,
    });

    const params = {
      Bucket: bucket,
      Key: key,
    };
    return await s3.getSignedUrlPromise('getObject', params);
  }
}
