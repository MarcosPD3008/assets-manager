export interface ExportEntityOptions {
  fileName?: string;
  title?: string;
}

export interface ExportColumnOptions {
  label: string;
  order?: number;
  enumLabels?: Record<string, string>;
  formatter?: 'date' | 'datetime' | 'json' | 'boolean';
}

export interface ExportColumnMetadata extends ExportColumnOptions {
  propertyKey: string;
}

const EXPORT_ENTITY_METADATA_KEY = Symbol('export:entity');
const EXPORT_COLUMNS_METADATA_KEY = Symbol('export:columns');

type ExportMetadataTarget = {
  [EXPORT_ENTITY_METADATA_KEY]?: ExportEntityOptions;
  [EXPORT_COLUMNS_METADATA_KEY]?: ExportColumnMetadata[];
};

type ExportableConstructor = new (...args: never[]) => object;

export function ExportEntity(options: ExportEntityOptions = {}) {
  return (target: ExportableConstructor): void => {
    const metadataTarget = target as ExportMetadataTarget;
    metadataTarget[EXPORT_ENTITY_METADATA_KEY] = {
      ...metadataTarget[EXPORT_ENTITY_METADATA_KEY],
      ...options,
    };
  };
}

export function ExportColumn(options: ExportColumnOptions): PropertyDecorator {
  return (target, propertyKey) => {
    const metadataTarget = target.constructor as unknown as ExportMetadataTarget;
    const columns = metadataTarget[EXPORT_COLUMNS_METADATA_KEY] ?? [];
    const key = propertyKey.toString();
    const nextColumns = columns.filter((column) => column.propertyKey !== key);

    nextColumns.push({
      propertyKey: key,
      ...options,
    });

    metadataTarget[EXPORT_COLUMNS_METADATA_KEY] = nextColumns;
  };
}

export function getExportEntityOptions(target: object): ExportEntityOptions | undefined {
  const metadataTarget = target as ExportMetadataTarget;
  return metadataTarget[EXPORT_ENTITY_METADATA_KEY];
}

export function getExportColumns(target: object): ExportColumnMetadata[] {
  const metadataTarget = target as ExportMetadataTarget;
  const columns = metadataTarget[EXPORT_COLUMNS_METADATA_KEY] ?? [];

  return [...columns].sort((a, b) => {
    if (a.order === undefined && b.order === undefined) {
      return a.propertyKey.localeCompare(b.propertyKey);
    }
    if (a.order === undefined) {
      return 1;
    }
    if (b.order === undefined) {
      return -1;
    }
    return a.order - b.order;
  });
}
