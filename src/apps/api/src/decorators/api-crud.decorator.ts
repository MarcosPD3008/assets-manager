import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

interface ApiCrudOptions {
  summary: string;
  description?: string;
  responseType?: Type<any>;
  bodyType?: Type<any>;
  paramName?: string;
  paramDescription?: string;
}

export function ApiGet(options: ApiCrudOptions & { isArray?: boolean; isPaginated?: boolean }) {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
  ];

  if (options.responseType) {
    if (options.isPaginated) {
      // For paginated responses, use a custom schema
      decorators.push(
        ApiExtraModels(options.responseType),
        ApiOkResponse({
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(options.responseType) },
              },
              total: {
                type: 'number',
                example: 100,
              },
            },
          },
        }),
      );
    } else if (options.isArray) {
      decorators.push(ApiOkResponse({ type: options.responseType, isArray: true }));
    } else {
      decorators.push(ApiOkResponse({ type: options.responseType }));
    }
  } else {
    decorators.push(ApiOkResponse());
  }

  decorators.push(
    ApiNotFoundResponse({ description: 'Resource not found' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );

  if (options.paramName) {
    decorators.push(
      ApiParam({
        name: options.paramName,
        description: options.paramDescription || `${options.paramName} identifier`,
        type: String,
      }),
    );
  }

  return applyDecorators(...decorators);
}

export function ApiPost(options: ApiCrudOptions) {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
  ];

  if (options.bodyType) {
    decorators.push(ApiBody({ type: options.bodyType }));
  }

  if (options.responseType) {
    decorators.push(ApiOkResponse({ type: options.responseType }));
  } else {
    decorators.push(ApiOkResponse());
  }

  decorators.push(
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );

  return applyDecorators(...decorators);
}

export function ApiPut(options: ApiCrudOptions) {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
  ];

  if (options.bodyType) {
    decorators.push(ApiBody({ type: options.bodyType }));
  }

  if (options.responseType) {
    decorators.push(ApiOkResponse({ type: options.responseType }));
  } else {
    decorators.push(ApiOkResponse());
  }

  if (options.paramName) {
    decorators.push(
      ApiParam({
        name: options.paramName,
        description: options.paramDescription || `${options.paramName} identifier`,
        type: String,
      }),
    );
  }

  decorators.push(
    ApiNotFoundResponse({ description: 'Resource not found' }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );

  return applyDecorators(...decorators);
}

export function ApiDelete(options: ApiCrudOptions) {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiOkResponse({ description: 'Resource deleted successfully' }),
  ];

  if (options.paramName) {
    decorators.push(
      ApiParam({
        name: options.paramName,
        description: options.paramDescription || `${options.paramName} identifier`,
        type: String,
      }),
    );
  }

  decorators.push(
    ApiNotFoundResponse({ description: 'Resource not found' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );

  return applyDecorators(...decorators);
}

export function ApiPatch(options: ApiCrudOptions) {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
  ];

  if (options.bodyType) {
    decorators.push(ApiBody({ type: options.bodyType }));
  }

  if (options.responseType) {
    decorators.push(ApiOkResponse({ type: options.responseType }));
  } else {
    decorators.push(ApiOkResponse());
  }

  if (options.paramName) {
    decorators.push(
      ApiParam({
        name: options.paramName,
        description: options.paramDescription || `${options.paramName} identifier`,
        type: String,
      }),
    );
  }

  decorators.push(
    ApiNotFoundResponse({ description: 'Resource not found' }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );

  return applyDecorators(...decorators);
}
