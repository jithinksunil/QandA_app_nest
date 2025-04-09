import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjestionStatus, UserRole } from '@prisma/client';
import { ROUTE_PREFIXES, swaggerAccessTokenName } from 'src/common';
import { Roles, User } from 'src/decorators';
import { JwtAuthGuard, RolesGuard } from 'src/guards';
import { DocumentService } from './document.service';
import { RenameDocumentDTO } from './dto/document.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(ROUTE_PREFIXES.DOCUMENT)
@ApiTags('Document')
@ApiBearerAuth(swaggerAccessTokenName)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('/list-documents')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({
    summary: 'List All Documents (Admin and Editor only)',
    description: 'Endpoint to retrieve all documents for Admin.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all documents',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fileName: { type: 'string' },
          s3BucketKey: { type: 'string' },
          s3BucketLocation: { type: 'string' },
          authorId: { type: 'string' },
          authorName: { type: 'string' },
        },
      },
    },
  })
  listAllDocuments() {
    return this.documentService.listAllDocuments();
  }

  @Get('/uploaded-documents')
  @ApiOperation({
    summary: 'View Uploaded Documents',
    description: 'Endpoint to view documents uploaded by the user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of uploaded documents by the user',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fileName: { type: 'string' },
          s3BucketKey: { type: 'string' },
          s3BucketLocation: { type: 'string' },
          authorId: { type: 'string' },
          authorName: { type: 'string' },
        },
      },
    },
  })
  viewUploadedDocuments(@User('id') userId: string) {
    return this.documentService.viewUploadedDocuments(userId);
  }

  @Post('/upload-document')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload Document',
    description: 'Endpoint to upload a document.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Return a json object',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        injestionStatus: {
          type: 'string',
          enum: Object.values(InjestionStatus),
        },
        message: { type: 'string' },
      },
    },
  })
  uploadDocument(
    @User('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentService.uploadDocument({ userId, multerFile: file });
  }

  @Get('/:id/download-document')
  @ApiOperation({
    summary: 'Download Document',
    description: 'Endpoint to download a document by its ID.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID of the document' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a downloadable file',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  downloadDocument(
    @Param('id') id: string,
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Res() res: Response,
  ) {
    return this.documentService.downloadDocument({ id, role, userId, res });
  }

  @Delete('/:id/delete-document')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete Document',
    description: 'Endpoint to delete a document by its ID.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID of the document' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Document deleted successfully',
  })
  deleteDocument(
    @Param('id') id: string,
    @User('id') userId: string,
    @User('role') role: UserRole,
  ) {
    return this.documentService.deleteDocument({ id, role, userId });
  }

  @Patch('/:id/rename-document')
  @ApiOperation({
    summary: 'Rename Document',
    description: 'Endpoint for renaming the document.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID of the document' })
  @ApiBody({ type: RenameDocumentDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document renamed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  renameDocument(
    @Param('id') id: string,
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Body() body: RenameDocumentDTO,
  ) {
    return this.documentService.renameDocument({
      id,
      role,
      userId,
      fileName: body.fileName,
    });
  }

  @Post('/:id/start-injestion')
  @ApiOperation({
    summary: 'Start Injestion',
    description: 'Endpoint for starting the injestion process of a document.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID of the document' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Return a json object including message, status and id of document',
    schema: {
      type: 'object',
      properties: {
        injestionStatus: {
          type: 'string',
          enum: Object.values(InjestionStatus),
        },
        message: { type: 'string' },
        id: { type: 'string' },
      },
    },
  })
  startInjestion(
    @Param('id') id: string,
    @User('id') userId: string,
    @User('role') role: UserRole,
  ) {
    return this.documentService.startInjestion({ id, role, userId });
  }

  @Get('/:id/check-injestion-status')
  @ApiOperation({
    summary: 'Check Injestion Status',
    description: 'Endpoint for checking the injestion status of a document.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID of the document' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return a json object including status and id of document',
    schema: {
      type: 'object',
      properties: {
        injestionStatus: {
          type: 'string',
          enum: Object.values(InjestionStatus),
        },
        id: { type: 'string' },
      },
    },
  })
  checkInjestionStatus(
    @Param('id') id: string,
    @User('id') userId: string,
    @User('role') role: UserRole,
  ) {
    return this.documentService.checkInjestionStatus({ id, role, userId });
  }
}
