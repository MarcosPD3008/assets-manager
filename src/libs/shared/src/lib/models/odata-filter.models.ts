/**
 * OData Filter Models
 * Shared types for filtering data using OData-like syntax
 */

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
 * OData filter structure
 */
export interface ODataFilter {
  prop: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Parsed filter from query params
 */
export interface ParsedFilter {
  prop: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | null;
}
