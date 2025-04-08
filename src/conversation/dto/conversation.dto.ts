import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatEntryDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Question about the document',
    example: 'What is this document about?',
  })
  question: string;
}
