import { SQL, Table, Column, sql, or } from 'drizzle-orm';
import { and, asc, desc, eq, gt, gte, lt, lte, like, notLike, ne, inArray, getTableColumns } from 'drizzle-orm';
import { z } from 'zod';

type SortDirection = 'asc' | 'desc';

interface SortParam {
  field: string;
  direction: SortDirection;
}

interface FilterOperator {
  eq?: unknown;
  neq?: unknown;
  gt?: unknown;
  gte?: unknown;
  lt?: unknown;
  lte?: unknown;
  like?: string;
  notLike?: string;
  in?: unknown[];
}

type FilterParams = Record<string, FilterOperator | unknown>;


export interface QueryParams {
  sort?: SortParam[];
  filter?: FilterParams;
  offset?: number;
  limit?: number;
  q?: string;
}

/**
 * Convert camelCase to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Parse sort parameters from Express query
 * Handles Express's automatic array conversion for repeated parameters
 * Example: ?sort=createdAt,desc&sort=title,asc
 * Express parses this to: { sort: ['createdAt,desc', 'title,asc'] }
 */
function parseSortParamsExpress(sort: string | string[] | undefined): SortParam[] | undefined {
  if (!sort) return undefined;
  
  const sortArray = Array.isArray(sort) ? sort : [sort];
  return sortArray.map(s => {
    const [field, direction = 'asc'] = s.split(',');
    if (!field || !['asc', 'desc'].includes(direction.toLowerCase())) {
      throw new Error(`Invalid sort parameter: ${s}. Expected format: field,asc or field,desc`);
    }
    return {
      field,
      direction: direction.toLowerCase() as SortDirection
    };
  });
}

/**
 * Parse filter parameters from Express query
 * Handles Express's automatic object creation for bracket notation
 * Examples: 
 * - ?region=WA becomes { region: { eq: 'WA' } }
 * - ?salary[gt]=100000 becomes { salary: { gt: '100000' } }
 * - ?skills[in]=js,ts becomes { skills: { in: ['js', 'ts'] } }
 */
function parseFilterParamsExpress(query: Record<string, any>): FilterParams | undefined {
  const filter: FilterParams = {};
  
  for (const [key, value] of Object.entries(query)) {
    // Skip pagination and sort parameters
    if (['offset', 'limit', 'sort'].includes(key)) continue;

    // Handle nested objects from Express's bracket notation
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Express has already parsed this into an object due to bracket notation
      const operators = value as Record<string, unknown>;
      const validOperators = Object.entries(operators).filter(([op]) => 
        ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'notLike', 'in'].includes(op)
      );

      if (validOperators.length > 0) {
        filter[key] = Object.fromEntries(validOperators.map(([op, val]) => [
          op,
          op === 'in' && typeof val === 'string' ? val.split(',') : val
        ]));
      }
    } else {
      // Direct value becomes an eq operator
      filter[key] = { eq: value };
    }
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

const queryParamsSchema = z.object({
  offset: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().min(1).optional(),
  sort: z.union([z.string(), z.array(z.string())]).optional(),
  q: z.string().optional(),
}).passthrough(); // Allow additional properties for filtering

/**
 * Parse query parameters from Express request
 * Handles Express's automatic parsing of:
 * - Repeated parameters to arrays
 * - Bracket notation to nested objects
 * - All values as strings (with coercion where needed)
 * 
 * @example
 * URL: /api/jobs?offset=0&limit=10&sort=createdAt,desc&region=WA&salary[gt]=100000
 * Express parses this to:
 * {
 *   offset: '0',
 *   limit: '10',
 *   sort: 'createdAt,desc',
 *   region: 'WA',
 *   salary: { gt: '100000' }
 * }
 */
export function parseQueryParamsExpress(query: any): QueryParams {
  try {
    const parsed = queryParamsSchema.parse(query);
    
    return {
      offset: parsed.offset,
      limit: parsed.limit,
      sort: parseSortParamsExpress(parsed.sort),
      filter: parseFilterParamsExpress(parsed),
      q: parsed.q,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid query parameters: ${error.message}`);
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export interface QueryParts {
  where?: SQL<unknown>;
  orderBy: SQL<unknown>[];
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

export class ResourceQueryBuilder<T extends Table> {
  private table: T;
  private allowedSortFields: Set<keyof T['_']['columns'] & string>;
  private allowedFilterFields: Set<keyof T['_']['columns'] & string>;
  private defaultSort: { field: keyof T['_']['columns'] & string; direction: SortDirection };
  private maxLimit: number;
  private minLimit: number;
  private columns: ReturnType<typeof getTableColumns<T>>;
  constructor(config: {
    table: T;
    allowedSortFields?: Array<keyof T['_']['columns'] & string>;
    allowedFilterFields?: Array<keyof T['_']['columns'] & string>;
    defaultSort?: { field: keyof T['_']['columns'] & string; direction: SortDirection };
    maxLimit?: number;
    minLimit?: number;
  }) {
    this.table = config.table;
    this.allowedSortFields = new Set(config.allowedSortFields || []);
    this.allowedFilterFields = new Set(config.allowedFilterFields || []);
    this.defaultSort = config.defaultSort || { field: 'createdAt' as keyof T['_']['columns'] & string, direction: 'desc' };
    this.maxLimit = config.maxLimit || 100;
    this.minLimit = config.minLimit || 10;
    this.columns = getTableColumns(this.table);
  }

  private getColumn(field: string): Column | undefined {
    return Object.entries(this.columns).find((entry): entry is [string, Column] => entry[0] === field)?.[1];
  }

  private buildWhereCondition(field: string, operator: FilterOperator | unknown): SQL<unknown> | undefined {
    const column = this.getColumn(field);
    if (!column) return undefined;

    if (typeof operator !== 'object' || operator === null) {
      return eq(column, operator);
    }

    const conditions: SQL<unknown>[] = [];
    const ops = operator as FilterOperator;

    if ('eq' in ops) conditions.push(eq(column, ops.eq));
    if ('neq' in ops) conditions.push(ne(column, ops.neq));
    if ('gt' in ops) conditions.push(gt(column, ops.gt));
    if ('gte' in ops) conditions.push(gte(column, ops.gte));
    if ('lt' in ops) conditions.push(lt(column, ops.lt));
    if ('lte' in ops) conditions.push(lte(column, ops.lte));
    if ('like' in ops) conditions.push(like(column, `%${ops.like}%`));
    if ('notLike' in ops) conditions.push(notLike(column, `%${ops.notLike}%`));
    if ('in' in ops && Array.isArray(ops.in)) conditions.push(inArray(column, ops.in));

    return conditions.length === 1 ? conditions[0] : and(...conditions);
  }

  private buildWhereConditions(filter?: FilterParams, q?: string): SQL<unknown>[] {

    if (!filter) return [];

    const conditions: SQL<unknown>[] = [];

    for (const [field, operator] of Object.entries(filter)) {
      if (!this.allowedFilterFields.size || this.allowedFilterFields.has(field as keyof T['_']['columns'] & string)) {
        const condition = this.buildWhereCondition(field, operator);
        if (condition) conditions.push(condition);
      }
    }

    // Handle full-text search query parameter 'q'
    if (filter && q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      
      // Find all text-like columns for full-text search
      const textColumns = Object.entries(this.columns)
        .filter(([_, column]) => {
          const dataType = column.dataType?.toLowerCase();
          return dataType && (
            dataType.includes('text') || 
            dataType.includes('char') || 
            dataType.includes('varchar') ||
            dataType.includes('string')
          );
        })
        .map(([_, column]) => column);
      
      if (textColumns.length > 0) {
        // Create OR conditions for each text column
        const searchConditions = textColumns.map(column => like(column, searchTerm)).filter(Boolean);
        const searchCondition = or(...searchConditions);
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }
    }

    return conditions;
  }

  private buildOrderBy(sort?: SortParam[]): SQL<unknown>[] {
    if (!sort?.length) {
      const column = this.getColumn(this.defaultSort.field);
      if (!column) {
        throw new Error(`Invalid default sort field: ${String(this.defaultSort.field)}`);
      }
      return [this.defaultSort.direction === 'desc' ? desc(column) : asc(column)];
    }

    const orderBy: SQL<unknown>[] = [];

    for (const { field, direction } of sort) {
      if (!this.allowedSortFields.size || this.allowedSortFields.has(field as keyof T['_']['columns'] & string)) {
        const column = this.getColumn(field);
        if (column) {
          orderBy.push(direction === 'desc' ? desc(column) : asc(column));
        }
      }
    }

    return orderBy.length ? orderBy : this.buildOrderBy();
  }

  buildQuery(params: QueryParams): QueryParts {

    const whereConditions = this.buildWhereConditions(params.filter, params.q);
    const orderBy = this.buildOrderBy(params.sort);
    const limit = params.limit ? params.limit : this.minLimit;
    const offset = params.offset ? params.offset : 0;

    return {
      where: whereConditions.length ? and(...whereConditions) : undefined,
      orderBy,
      limit,
      offset,
    };
  }

  buildCountQuery(whereConditions?: SQL<unknown>): SQL<unknown> {
    const baseQuery = sql<number>`SELECT count(*) as count FROM ${this.table}`;
    
    return whereConditions
      ? sql<number>`${baseQuery} WHERE ${and(whereConditions)}`
      : baseQuery;
  }
} 
