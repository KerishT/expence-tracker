/**
 * CQRS-запрос на получение категории по ID со скоупингом по владельцу.
 * Носитель аргументов для шины `QueryBus`; обрабатывается {@link GetCategoryByIdHandler}.
 * @param id - UUID искомой категории.
 * @param userId - ID пользователя-владельца (категория ищется только в его данных).
 */
export class GetCategoryByIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
