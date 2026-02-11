import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

export function ApiStandardResponses<T>(responseType?: Type<T>) {
  const decorators = [];

  if (responseType) {
    decorators.push(ApiOkResponse({ type: responseType }));
  } else {
    decorators.push(ApiOkResponse());
  }

  decorators.push(
    ApiNotFoundResponse({ description: 'Resource not found' }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );

  return applyDecorators(...decorators);
}

export function ApiCreatedResponseWithType<T>(responseType: Type<T>) {
  return applyDecorators(
    ApiCreatedResponse({ type: responseType }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );
}
