import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a hex color like #RRGGBB' })
  color!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  icon!: string;
}
