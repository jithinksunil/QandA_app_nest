import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjestionStatus, UserRole } from '@prisma/client';
import { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AwsService } from 'src/aws/aws.service';
import { getFileExtension } from 'src/common';
import { ResponseDocumentStructure } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AwsService,
    private readonly httpService: HttpService,
  ) {}
  async listAllDocuments(): Promise<ResponseDocumentStructure[]> {
    const documents = await this.prisma.document.findMany({
      select: {
        id: true,
        fileName: true,
        s3BucketKey: true,
        s3BucketLocation: true,
        user: { select: { name: true, id: true } },
      },
    });
    const modifiedData = documents.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      s3BucketKey: document.s3BucketKey,
      s3BucketLocation: document.s3BucketLocation,
      authorId: document.user.id,
      authorName: document.user.name,
    }));
    return modifiedData;
  }

  async viewUploadedDocuments(userId: string): Promise<ResponseDocumentStructure[]> {
    const documents = await this.prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        fileName: true,
        s3BucketKey: true,
        s3BucketLocation: true,
        user: { select: { name: true, id: true } },
      },
    });
    const modifiedData = documents.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      s3BucketKey: document.s3BucketKey,
      s3BucketLocation: document.s3BucketLocation,
      authorId: document.user.id,
      authorName: document.user.name,
    }));
    return modifiedData;
  }

  async uploadDocument({
    multerFile,
    userId,
  }: {
    userId: string;
    multerFile: Express.Multer.File;
  }) {
    const { location, key } = await this.awsService.uploadFile({
      userId,
      multerFile,
    });
    try {
      const document = await this.prisma.document.create({
        data: {
          fileName: multerFile.originalname,
          s3BucketLocation: location,
          s3BucketKey: key,
          userId,
        },
        select: { id: true },
      });
      ///////////////////////////////////////////////////Handle push to que to to process background job by python which is listening to queue
      return {
        id: document.id,
        injestionStatus: InjestionStatus.PENDING,
        message: 'Document uploaded successfully',
      };
    } catch (error) {
      await this.awsService.deleteFile(key);
      throw error;
    }
  }
  async downloadDocument({
    id,
    userId,
    role,
    res,
  }: {
    id: string;
    userId: string;
    role: UserRole;
    res: Response;
  }) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      select: {
        userId: true,
        s3BucketLocation: true,
        s3BucketKey: true,
        fileName: true,
      },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (role == UserRole.VIEWER && userId !== document.userId)
      throw new ForbiddenException(
        'You are not allowed to download this document',
      );
    const signedUrl = await this.awsService.getSignedUrlOfFile(
      document.s3BucketKey,
    );
    const { data } = await firstValueFrom(
      this.httpService.get(signedUrl, {
        responseType: 'arraybuffer',
      }),
    );
    const buffer = Buffer.from(data, 'binary');
    res.set({
      'Content-Disposition': `attachment; filename="${document.fileName}"`,
    });
    res.send(buffer);
  }
  async deleteDocument({
    id,
    userId,
    role,
  }: {
    id: string;
    userId: string;
    role: UserRole;
  }) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      select: { userId: true, injestionStatus: true, s3BucketKey: true },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (role == UserRole.VIEWER && userId !== document.userId)
      throw new ForbiddenException(
        'You are not allowed to delete this document',
      );
    if (document.injestionStatus == 'PENDING')
      throw new ConflictException('Injestion process running!. Delete later');

    await this.prisma.$transaction(async (tx) => {
      await tx.document.delete({ where: { id } });
      const x=await this.awsService.deleteFile(document.s3BucketKey);
      console.log(x);
      
    });
    return { message: 'Deleted successfully' };
  }

  async renameDocument({
    id,
    userId,
    role,
    fileName,
  }: {
    id: string;
    userId: string;
    role: UserRole;
    fileName: string;
  }) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      select: { userId: true, fileName: true },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (role == UserRole.VIEWER && userId !== document.userId)
      throw new ForbiddenException(
        'You are not allowed to delete this document',
      );
    const extension = getFileExtension(document.fileName);

    await this.prisma.document.update({
      where: { id },
      data: { fileName: `${fileName}.${extension}` },
    });
    return { message: 'Renamed successfully' };
  }
}
