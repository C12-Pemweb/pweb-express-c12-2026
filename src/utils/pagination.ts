export interface PaginationMeta {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(query: Record<string, unknown>, defaultLimit = 10): PaginationQuery {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || defaultLimit);

  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(page: number, limit: number, totalItems: number): PaginationMeta {
  return {
    currentPage: page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
}
