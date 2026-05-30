/**
 * Доменный DTO категории — форма, отдаваемая наружу и через CQRS-запросы
 * (без `userId` и служебных полей).
 */
export class CategoryDto {
  id!: string;
  name!: string;
  color!: string;
  icon!: string;
}
