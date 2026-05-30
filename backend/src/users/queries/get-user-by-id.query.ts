/**
 * CQRS-запрос на получение пользователя по ID. Носитель аргументов для шины
 * `QueryBus`; обрабатывается {@link GetUserByIdHandler}.
 * @param id - UUID искомого пользователя.
 */
export class GetUserByIdQuery {
  constructor(public readonly id: string) {}
}
