/**
 * OData Filter Frontend Utilities
 * Convert filter objects to OData standard format query parameters
 */

import { ODataFilter, FilterOperator } from '../models/odata-filter.models';

/**
 * Format a filter value for OData expression
 * @param value Filter value
 * @returns Formatted string value
 */
function formatFilterValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (Array.isArray(value)) {
    // For 'in' and 'notIn' operators, format as array
    const formattedValues = value.map((v) => {
      if (typeof v === 'string' && (v.includes(' ') || v.includes("'") || v.includes('"'))) {
        return `'${v.replace(/'/g, "''")}'`;
      }
      return typeof v === 'string' ? v : String(v);
    });
    return `(${formattedValues.join(', ')})`;
  }

  if (typeof value === 'boolean') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    // Add quotes if string contains spaces or special characters
    if (value.includes(' ') || value.includes("'") || value.includes('"') || value.includes('@')) {
      return `'${value.replace(/'/g, "''")}'`;
    }
    return value;
  }

  return String(value);
}

/**
 * Convert a single filter to OData expression string
 * @param filter Filter object
 * @returns OData expression string (e.g., "email eq 'test@test.com'")
 */
function filterToODataExpression(filter: ODataFilter): string {
  const { prop, operator, value } = filter;

  // Handle null operators
  if (operator === FilterOperator.IS_NULL) {
    return `${prop} isNull`;
  }

  if (operator === FilterOperator.IS_NOT_NULL) {
    return `${prop} isNotNull`;
  }

  // Handle array operators
  if (operator === FilterOperator.IN || operator === FilterOperator.NOT_IN) {
    const formattedValue = formatFilterValue(value);
    return `${prop} ${operator} ${formattedValue}`;
  }

  // Handle other operators
  const formattedValue = formatFilterValue(value);
  return `${prop} ${operator} ${formattedValue}`;
}

/**
 * Convert an array of OData filters to OData standard format query parameter
 * @param filters Array of filter objects
 * @param logicalOperator Logical operator to join filters ('and' or 'or'), default: 'and'
 * @returns Object with 'filter' query parameter
 */
export function buildFilterQueryParams(
  filters: ODataFilter[],
  logicalOperator: 'and' | 'or' = 'and',
): Record<string, string> {
  if (filters.length === 0) {
    return {};
  }

  const expressions = filters.map(filterToODataExpression);
  const filterExpression = expressions.join(` ${logicalOperator} `);

  return {
    filter: filterExpression,
  };
}

/**
 * Convert a single filter to query parameter format
 * @param prop Property name
 * @param operator Filter operator
 * @param value Filter value
 * @returns Object with query parameter key and value
 */
export function buildSingleFilterQueryParam(
  prop: string,
  operator: FilterOperator,
  value: any,
): Record<string, string> {
  return buildFilterQueryParams([{ prop, operator, value }]);
}

/**
 * Convert filters object to query string
 * @param filters Array of filter objects
 * @param logicalOperator Logical operator to join filters ('and' or 'or'), default: 'and'
 * @returns Query string (e.g., "filter=email eq 'test@test.com' and status eq active")
 */
export function buildFilterQueryString(
  filters: ODataFilter[],
  logicalOperator: 'and' | 'or' = 'and',
): string {
  const params = buildFilterQueryParams(filters, logicalOperator);
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}
