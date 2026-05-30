import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT-аутентификации на базе Passport-стратегии `'jwt'`.
 * Навешивается через `@UseGuards(JwtAuthGuard)`; при валидном токене кладёт
 * `UserDto` в `req.user`, иначе отклоняет запрос с 401.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
