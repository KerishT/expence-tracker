/**
 * Доменный DTO пользователя — публичная форма без `passwordHash`.
 * Кладётся в `req.user` после JWT-аутентификации и отдаётся в ответах auth.
 */
export class UserDto {
  id!: string;
  email!: string;
  name!: string;
}
