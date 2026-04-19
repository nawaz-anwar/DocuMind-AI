import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number = 5;
}
