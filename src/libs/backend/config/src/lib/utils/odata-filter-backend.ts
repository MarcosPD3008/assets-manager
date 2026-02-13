/**
 * OData Filter Backend Utilities
 * Parse OData standard format query parameters and convert to TypeORM FindOptionsWhere
 */

import {
  FindOptionsWhere,
  Equal,
  Not,
  MoreThan,
  MoreThanOrEqual,
  LessThan,
  LessThanOrEqual,
  Like,
  In,
  IsNull,
} from 'typeorm';

/**
 * Supported filter operators
 */
export enum FilterOperator {
  // Comparison operators
  EQ = 'eq', // Equals
  NE = 'ne', // Not equals
  GT = 'gt', // Greater than
  GE = 'ge', // Greater than or equal
  LT = 'lt', // Less than
  LE = 'le', // Less than or equal

  // String operators
  CONTAINS = 'contains', // Contains substring
  STARTSWITH = 'startswith', // Starts with
  ENDSWITH = 'endswith', // Ends with

  // Array operators
  IN = 'in', // In array
  NOT_IN = 'notIn', // Not in array

  // Null operators
  IS_NULL = 'isNull', // Is null
  IS_NOT_NULL = 'isNotNull', // Is not null
}

/**
 * Parsed filter from query params
 */
export interface ParsedFilter {
  prop: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | null;
}


/**
 * Tokenize OData filter expression
 * @param expression OData filter expression (e.g., "email eq 'test@test.com' and status eq active")
 * @returns Array of tokens
 */
function tokenizeODataExpression(expression: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    const nextChar = expression[i + 1];

    // Handle quotes
    if ((char === "'" || char === '"') && (i === 0 || expression[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
        current += char;
      } else if (char === quoteChar) {
        inQuotes = false;
        current += char;
        tokens.push(current);
        current = '';
        quoteChar = '';
        continue;
      } else {
        current += char;
      }
      continue;
    }

    if (inQuotes) {
      current += char;
      continue;
    }

    // Handle whitespace
    if (/\s/.test(char)) {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      continue;
    }

    // Handle parentheses
    if (char === '(' || char === ')') {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      tokens.push(char);
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens.filter((token) => token.length > 0);
}

/**
 * Parse a value from token
 * @param token Token string
 * @returns Parsed value
 */
function parseValue(token: string): string | number | boolean | string[] | null {
  // Handle null
  if (token === 'null') {
    return null;
  }

  // Handle quoted strings
  if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) {
    return token.slice(1, -1).replace(/''/g, "'");
  }

  // Handle arrays (for 'in' operator)
  if (token.startsWith('(') && token.endsWith(')')) {
    const content = token.slice(1, -1);
    return content.split(',').map((v) => parseValue(v.trim()) as string);
  }

  // Handle booleans
  if (token === 'true') return true;
  if (token === 'false') return false;

  // Handle numbers
  if (!isNaN(Number(token)) && token !== '') {
    const num = Number(token);
    if (isFinite(num)) {
      return num;
    }
  }

  return token;
}

/**
 * Parse OData filter expression to array of ParsedFilter
 * @param expression OData filter expression (e.g., "email eq 'test@test.com' and status eq active")
 * @returns Array of parsed filters
 */
function parseODataExpression(expression: string): ParsedFilter[] {
  const tokens = tokenizeODataExpression(expression);
  const filters: ParsedFilter[] = [];
  let i = 0;

  while (i < tokens.length) {
    // Skip logical operators at the start
    const lowerToken = tokens[i].toLowerCase();
    if (lowerToken === 'and' || lowerToken === 'or') {
      i++;
      continue;
    }

    // Parse filter: prop operator value
    if (i + 2 < tokens.length) {
      const prop = tokens[i];
      const operator = tokens[i + 1].toLowerCase();
      let valueToken = tokens[i + 2];

      // Handle array values for 'in' operator
      if (operator === FilterOperator.IN || operator === FilterOperator.NOT_IN) {
        if (valueToken === '(' && i + 3 < tokens.length) {
          // Collect array values
          const arrayValues: string[] = [];
          let j = i + 3;
          while (j < tokens.length && tokens[j] !== ')') {
            if (tokens[j] !== ',' && tokens[j] !== '(') {
              arrayValues.push(tokens[j]);
            }
            j++;
          }
          valueToken = `(${arrayValues.join(', ')})`;
          i = j + 1;
        } else {
          i += 3;
        }
      } else {
        i += 3;
      }

      // Validate operator
      if (Object.values(FilterOperator).includes(operator as FilterOperator)) {
        const parsedValue = parseValue(valueToken);
        filters.push({
          prop,
          operator: operator as FilterOperator,
          value: parsedValue,
        });
      }
    } else {
      i++;
    }
  }

  return filters;
}

/**
 * Parse query parameters in OData standard format (filter=email eq test@test.com)
 * @param query Query parameters object
 * @returns Array of parsed filters
 */
export function parseFilterQueryParams(query: Record<string, any>): ParsedFilter[] {
  const filterExpression = query['filter'];

  if (!filterExpression || typeof filterExpression !== 'string') {
    return [];
  }

  // Split by logical operators (and/or) while preserving them
  const parts: string[] = [];
  let current = '';
  let i = 0;

  while (i < filterExpression.length) {
    const remaining = filterExpression.slice(i);
    const andMatch = remaining.match(/^\s+and\s+/i);
    const orMatch = remaining.match(/^\s+or\s+/i);

    if (andMatch) {
      if (current.trim()) {
        parts.push(current.trim());
        parts.push('AND');
        current = '';
      }
      i += andMatch[0].length;
    } else if (orMatch) {
      if (current.trim()) {
        parts.push(current.trim());
        parts.push('OR');
        current = '';
      }
      i += orMatch[0].length;
    } else {
      current += filterExpression[i];
      i++;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  // For now, we'll combine all filters with AND logic
  // TODO: Support OR logic in the future
  const allFilters: ParsedFilter[] = [];
  for (const part of parts) {
    if (part !== 'AND' && part !== 'OR') {
      const filters = parseODataExpression(part);
      allFilters.push(...filters);
    }
  }

  return allFilters;
}

/**
 * Convert parsed filters to TypeORM FindOptionsWhere
 * @param filters Array of parsed filters
 * @returns TypeORM FindOptionsWhere object
 */
export function convertFiltersToFindOptionsWhere<T = any>(
  filters: ParsedFilter[],
): FindOptionsWhere<T> {
  const where: any = {};

  filters.forEach((filter) => {
    const { prop, operator, value } = filter;

    switch (operator) {
      case FilterOperator.EQ:
        if (value === null) {
          where[prop] = IsNull();
        } else {
          where[prop] = Equal(value);
        }
        break;

      case FilterOperator.NE:
        if (value === null) {
          where[prop] = Not(IsNull());
        } else {
          where[prop] = Not(Equal(value));
        }
        break;

      case FilterOperator.GT:
        where[prop] = MoreThan(value);
        break;

      case FilterOperator.GE:
        where[prop] = MoreThanOrEqual(value);
        break;

      case FilterOperator.LT:
        where[prop] = LessThan(value);
        break;

      case FilterOperator.LE:
        where[prop] = LessThanOrEqual(value);
        break;

      case FilterOperator.CONTAINS:
        where[prop] = Like(`%${value}%`);
        break;

      case FilterOperator.STARTSWITH:
        where[prop] = Like(`${value}%`);
        break;

      case FilterOperator.ENDSWITH:
        where[prop] = Like(`%${value}`);
        break;

      case FilterOperator.IN:
        if (Array.isArray(value) && value.length > 0) {
          where[prop] = In(value);
        }
        break;

      case FilterOperator.NOT_IN:
        if (Array.isArray(value) && value.length > 0) {
          where[prop] = Not(In(value));
        }
        break;

      case FilterOperator.IS_NULL:
        where[prop] = IsNull();
        break;

      case FilterOperator.IS_NOT_NULL:
        where[prop] = Not(IsNull());
        break;

      default:
        // For unknown operators, use equality
        where[prop] = Equal(value);
    }
  });

  return where as FindOptionsWhere<T>;
}

/**
 * Parse query parameters and convert directly to TypeORM FindOptionsWhere
 * @param query Query parameters object
 * @returns TypeORM FindOptionsWhere object
 */
export function parseFiltersFromQuery<T = any>(
  query: Record<string, any>,
): FindOptionsWhere<T> {
  const filters = parseFilterQueryParams(query);
  return convertFiltersToFindOptionsWhere<T>(filters);
}
