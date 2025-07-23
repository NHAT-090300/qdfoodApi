import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

import { FileUpload, IS3Config } from 'interface';
import { removeFileLocal } from 'utils';

export class S3Service {
  private config: IS3Config;
  private s3: S3Client;

  constructor(config: IS3Config) {
    this.config = config;
    this.s3 = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload a file from local disk to S3
   */
  async uploadFile(file: Express.Multer.File): Promise<FileUpload> {
    const fileContent = await fs.readFile(file.path);
    const ext = path.extname(file.originalname);
    const key = `${this.config.folderCode}/${uuidv4()}${ext}`;
    const contentType = mime.lookup(ext) || 'application/octet-stream';

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
      }),
    );

    removeFileLocal(file.path);

    return {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      path: `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`,
      size: file.size,
      filename: key,
    };
  }

  /**
   * Replace a file in S3 by deleting the old one and uploading the new one
   */
  async patchFile(fileId: string, file: Express.Multer.File): Promise<FileUpload> {
    await this.delete(fileId);
    return this.uploadFile(file);
  }

  /**
   * Import a file from a remote URL to S3
   */
  async importFile(fileUrl: string, folder?: string): Promise<FileUpload> {
    // Use undici or node-fetch if fetch is not available in your Node.js version
    let response: Response;
    try {
      response = await fetch(fileUrl);
    } catch (err) {
      throw new Error(`Failed to fetch file from URL: ${fileUrl}`);
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const ext = path.extname(new URL(fileUrl).pathname);
    const filename = `${uuidv4()}${ext}`;
    const key = `${folder || this.config.folderCode}/${filename}`;
    const contentType = mime.lookup(ext) || 'application/octet-stream';

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: contentType,
      }),
    );

    return {
      fieldname: filename,
      originalname: filename,
      encoding: '',
      mimetype: contentType,
      path: `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`,
      size: Buffer.byteLength(buffer),
      filename: key,
    };
  }

  /**
   * Delete a file from S3 by key
   */
  async delete(fileKey: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: fileKey,
      }),
    );
  }

  /**
   * Delete multiple files from S3 by their full S3 URLs
   */
  async deleteByPaths(paths: string[]) {
    const objects = paths
      .map((fullPath) => {
        const match = fullPath.match(/\.amazonaws\.com\/(.+)$/);
        const key = match?.[1];
        return key ? { Key: key } : null;
      })
      .filter((obj): obj is { Key: string } => Boolean(obj));

    if (objects.length > 0) {
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.config.bucket,
          Delete: { Objects: objects },
        }),
      );
    }
  }
}
