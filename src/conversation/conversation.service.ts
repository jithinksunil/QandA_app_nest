import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjestionStatus } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import {
  ResponseChatEntryStructure,
  ResponseDocumentStructure,
} from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getConversation({
    documentId,
    userId,
  }: {
    userId: string;
    documentId: string;
  }): Promise<{
    id: string;
    document: ResponseDocumentStructure;
    chatEntries: ResponseChatEntryStructure[];
  }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { documentId, userId },
      select: {
        id: true,
        document: {
          select: {
            id: true,
            fileName: true,
            user: { select: { name: true, id: true } },
            s3BucketKey: true,
            s3BucketLocation: true,
          },
        },
        chatEntries: {
          select: {
            id: true,
            conversationId: true,
            question: true,
            answer: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    const modifiedData = {
      ...conversation,
      document: {
        id: conversation.document.id,
        fileName: conversation.document.fileName,
        s3BucketKey: conversation.document.s3BucketKey,
        s3BucketLocation: conversation.document.s3BucketLocation,
        authorId: conversation.document.user.id,
        authorName: conversation.document.user.name,
      },
    };
    return modifiedData;
  }

  async getChatEntry({
    id,
    userId,
  }: {
    userId: string;
    id: string;
  }): Promise<ResponseChatEntryStructure> {
    const chatEntry = await this.prisma.chatEntry.findUnique({
      where: { id, conversation: { userId } },
      select: {
        id: true,
        question: true,
        answer: true,
        createdAt: true,
        conversationId: true,
      },
    });
    if (!chatEntry) throw new NotFoundException('Chat entry not found');
    return chatEntry;
  }

  async askQuestion({
    documentId,
    question,
    userId,
  }: {
    documentId: string;
    question: string;
    userId: string;
  }): Promise<ResponseChatEntryStructure> {
    let document = await this.prisma.document.findUnique({
      where: { id: documentId, userId },
      select: { conversation: { select: { id: true } }, injestionStatus: true },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (document.injestionStatus !== InjestionStatus.COMPLETED) {
      throw new BadRequestException(
        document.injestionStatus == InjestionStatus.FAILED
          ? 'Injestion status is failed. You cannot ask question about this document'
          : 'Injestion status is pending. Try later',
      );
    }
    if (!document.conversation) {
      document = await this.prisma.document.update({
        where: { id: documentId, userId },
        data: {
          conversation: {
            upsert: {
              create: {
                userId,
              },
              update: {},
            },
          },
        },
        select: {
          conversation: { select: { id: true } },
          injestionStatus: true,
        },
      });
    }
    const {
      data: { answer },
    } = await firstValueFrom(
      this.httpService.post(
        `${this.config.get('PYTHON_BACKEND_BASE_URL')!}/conversation/document/${documentId}/ask-question`,
        { question },
        {
          auth: {
            password: this.config.get('SERVER_SHARED_PASSWORD')!,
            username: this.config.get('SERVER_SHARED_USERNAME')!,
          },
        },
      ),
    );
    const chatEntry = await this.prisma.chatEntry.create({
      data: {
        question,
        answer,
        conversationId: document.conversation!.id,
      },
      select: {
        id: true,
        question: true,
        answer: true,
        createdAt: true,
        conversationId: true,
      },
    });
    return chatEntry;
  }
}
