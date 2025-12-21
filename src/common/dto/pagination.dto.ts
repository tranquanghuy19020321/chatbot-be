import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  @Min(1)
  limit?: number;
}
