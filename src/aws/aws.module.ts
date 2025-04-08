import { Global, Module } from '@nestjs/common';
import { AwsService } from './aws.service';

@Global()
@Module({ exports: [AwsService], providers: [AwsService] })
export class AwsModule {}
