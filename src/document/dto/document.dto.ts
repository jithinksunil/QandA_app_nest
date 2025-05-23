import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RenameDocumentDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name of the document',
    example: 'Sample document',
  })
  fileName: string;
}
