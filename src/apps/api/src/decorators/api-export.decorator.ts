import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

interface ApiExportOptions {
  summary: string;
  description?: string;
}

export function ApiExport(options: ApiExportOptions) {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiQuery({
      name: 'format',
      required: false,
      enum: ['excel', 'pdf'],
      description: 'Formato de salida. Default: excel.',
    }),
    ApiQuery({
      name: 'scope',
      required: false,
      enum: ['page', 'all'],
      description: 'Origen de datos: pagina actual o todos los resultados.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Pagina actual (solo para scope=page).',
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: 'Tamano de pagina (solo para scope=page).',
    }),
    ApiQuery({
      name: 'filter',
      required: false,
      type: String,
      description: 'Filtro OData, por ejemplo: status eq AVAILABLE.',
    }),
    ApiQuery({
      name: 'fileName',
      required: false,
      type: String,
      description: 'Nombre base del archivo exportado.',
    }),
    ApiProduces(
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ),
    ApiOkResponse({
      description: 'Archivo generado correctamente.',
      schema: {
        type: 'string',
        format: 'binary',
      },
    }),
    ApiBadRequestResponse({ description: 'Parametros invalidos para exportar.' }),
    ApiInternalServerErrorResponse({ description: 'No se pudo generar el archivo.' }),
  );
}
