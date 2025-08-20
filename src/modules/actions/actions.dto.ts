import { IsNotEmpty, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateActionDto {
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  description?: string;

  @IsIn(['10m', '30m', '1h'])
  duration!: string; // срок действия
}

export class UpdateActionDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;
}
