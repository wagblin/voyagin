import { type CommonPowerSyncDatabase, type PowerSyncBackendConnector } from '@powersync/react-native';
import { getToken } from '../authStorage';
import { describeUnexpectedLocalWrite } from '../powerSyncLocalWriteGuard';

const POWERSYNC_ENDPOINT = 'https://6a90523c02481fb31b918cee.powersync.journeyapps.com';

export class PowerSyncConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const token = await getToken();
    if (token === null) {
      return null; // SDK contract: return null when unauthenticated, don't throw
    }
    return { endpoint: POWERSYNC_ENDPOINT, token };
  }

  async uploadData(database: CommonPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) {
      return;
    }
    const [firstOp] = transaction.crud;
    if (firstOp) {
      throw new Error(
        describeUnexpectedLocalWrite({
          op: firstOp.op as unknown as 'PUT' | 'PATCH' | 'DELETE',
          table: firstOp.table,
          id: firstOp.id,
        }),
      );
    }
    await transaction.complete();
  }
}
