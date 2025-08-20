import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsISO8601 } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @MinLength(6)
  confirmPassword!: string;

  @IsOptional()
  @IsISO8601() // формат YYYY-MM-DD или полноценный ISO
  birthdate?: string;
}

export class LoginDto {
  @IsNotEmpty()
  username!: string;

  @IsNotEmpty()
  password!: string;
}
