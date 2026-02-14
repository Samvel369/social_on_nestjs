import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateActionDto {
  @IsString()
  @IsNotEmpty()
  text!: string; // сырой текст (до нормализации)
}

export class PublishActionDto {
  @IsInt()
  @Min(1)
  id!: number;

  // допустимые длительности публикации (минуты)
  @IsInt()
  @IsIn([10, 30, 60])
  duration!: number;
}

export class DeleteActionDto {
  @IsInt()
  @Min(1)
  id!: number;
}
