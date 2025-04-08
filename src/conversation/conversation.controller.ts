import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ROUTE_PREFIXES, swaggerAccessTokenName } from 'src/common';
import { User } from 'src/decorators';
import { JwtAuthGuard } from 'src/guards';
import { ConversationService } from './conversation.service';
import { ChatEntryDTO } from './dto/conversation.dto';
import {
  ResponseChatEntryStructure,
  ResponseDocumentStructure,
} from 'src/interfaces';

@Controller(ROUTE_PREFIXES.CONVERSATION)
@UseGuards(JwtAuthGuard)
@ApiTags('Conversation')
@ApiBearerAuth(swaggerAccessTokenName)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get('/document/:documentId/get-conversation')
  @ApiOperation({ summary: 'Get conversation and chat entries for a document' })
  @ApiParam({
    name: 'documentId',
    description: 'Document ID to fetch conversation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully fetched conversation and its chat entries',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        document: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fileName: { type: 'string' },
            authorId: { type: 'string' },
            authorName: { type: 'string' },
            s3BucketKey: { type: 'string' },
            s3BucketLocation: { type: 'string' },
          },
        },
        chatEntries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              question: { type: 'string' },
              answer: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              conversationId: { type: 'string' },
            },
          },
        },
      },
    },
  })
  getConversation(
    @User('id') userId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.conversationService.getConversation({ documentId, userId });
  }

  @Get('/chat-entry/:chatEntryId')
  @ApiOperation({ summary: 'Get a specific chat entry' })
  @ApiParam({ name: 'chatEntryId', description: 'Chat entry ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully fetched chat entry',
    schema: {
      properties: {
        id: { type: 'string' },
        question: { type: 'string' },
        answer: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        conversationId: { type: 'string' },
      },
    },
  })
  getChatEntry(
    @User('id') userId: string,
    @Param('chatEntryId') chatEntryId: string,
  ) {
    return this.conversationService.getChatEntry({ id: chatEntryId, userId });
  }

  @Post('/document/:documentId/ask-question')
  @ApiOperation({ summary: 'Ask a question related to a document' })
  @ApiParam({
    name: 'documentId',
    description: 'Document ID to ask question about',
  })
  @ApiBody({ type: ChatEntryDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully asked a question and created chat entry',
    schema: {
      properties: {
        id: { type: 'string' },
        question: { type: 'string' },
        answer: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        conversationId: { type: 'string' },
      },
    },
  })
  askQuestion(
    @Body() body: ChatEntryDTO,
    @User('id') userId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.conversationService.askQuestion({
      documentId,
      question: body.question,
      userId,
    });
  }
}
