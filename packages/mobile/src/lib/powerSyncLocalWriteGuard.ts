export interface LocalCrudOperation {
  op: 'PUT' | 'PATCH' | 'DELETE';
  table: string;
  id: string;
}

export function describeUnexpectedLocalWrite(operation: LocalCrudOperation): string {
  return (
    `Unexpected local write (${operation.op} on "${operation.table}" id=${operation.id}): ` +
    'this PowerSync slice is read-only, no mutation should ever reach the local CRUD queue. ' +
    'Use the existing REST mutations in tripsApi.ts instead.'
  );
}
