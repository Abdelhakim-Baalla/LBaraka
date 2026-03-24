import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly bucketName: string;
    private readonly publicBaseUrl: string;
    private readonly minioClient: MinioClient;

    constructor(private readonly configService: ConfigService) {
        const endPoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
        const port = Number(this.configService.get<string>('MINIO_PORT', '9000'));
        const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY', 'lbaraka');
        const secretKey = this.configService.get<string>('MINIO_SECRET_KEY', 'lbaraka123');
        const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';

        this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'lbaraka-annonces');
        this.publicBaseUrl = this.configService.get<string>('MINIO_PUBLIC_URL', 'http://localhost:9000');

        this.minioClient = new MinioClient({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
    }

    async onModuleInit() {
        const exists = await this.minioClient.bucketExists(this.bucketName);

        if (!exists) {
            await this.minioClient.makeBucket(this.bucketName);
        }
    }

    async uploadAnnoncePhotosBase64(photos: Array<{ name: string; type: string; base64: string }>): Promise<string[]> {
        const uploadedUrls: string[] = [];

        for (const photo of photos) {
            const buffer = Buffer.from(photo.base64, 'base64');
            const objectName = this.buildObjectName(photo.name);

            await this.minioClient.putObject(
                this.bucketName,
                objectName,
                buffer,
                buffer.length,
                { 'Content-Type': photo.type || 'image/jpeg' },
            );

            uploadedUrls.push(`${this.publicBaseUrl}/${this.bucketName}/${objectName}`);
        }

        return uploadedUrls;
    }

    async uploadAnnoncePhotos(files: Express.Multer.File[]): Promise<string[]> {
        const uploadedUrls: string[] = [];

        for (const file of files) {
            const objectName = this.buildObjectName(file.originalname);

            await this.minioClient.putObject(
                this.bucketName,
                objectName,
                file.buffer,
                file.size,
                { 'Content-Type': file.mimetype || 'application/octet-stream' },
            );

            uploadedUrls.push(`${this.publicBaseUrl}/${this.bucketName}/${objectName}`);
        }

        return uploadedUrls;
    }

    async uploadBuffer(buffer: Buffer, originalName: string, contentType: string): Promise<string> {
        const objectName = this.buildObjectName(originalName);

        await this.minioClient.putObject(
            this.bucketName,
            objectName,
            buffer,
            buffer.length,
            { 'Content-Type': contentType },
        );

        return `${this.publicBaseUrl}/${this.bucketName}/${objectName}`;
    }

    private buildObjectName(originalName: string): string {
        const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '-');
        const extension = originalName.split('.').pop() || 'dat';
        const base = safeName.substring(0, safeName.lastIndexOf('.')) || safeName;
        return `documents/${Date.now()}-${Math.round(Math.random() * 1e9)}-${base}.${extension}`;
    }
}

