import { IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateActionDto {
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  isDaily?: boolean = false;
}

export class EditActionDto {
  @IsNotEmpty()
  text!: string;
}

export class PublishActionDto {
  @IsInt()
  @Min(1)
  duration!: number; // в минутах (10, 30, 60)
}