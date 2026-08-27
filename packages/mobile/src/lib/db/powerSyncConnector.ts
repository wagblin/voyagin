import { type CommonPowerSyncDatabase, type PowerSyncBackendConnector } from '@powersync/react-native';
import { getToken } from '../authStorage';
import { fetchPowerSyncToken } from '../authApi';
import { describeUnexpectedLocalWrite } from '../powerSyncLocalWriteGuard';

const POWERSYNC_ENDPOINT = 'https://6a90523c02481fb31b918cee.powersync.journeyapps.com';

export class PowerSyncConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const sessionToken = await getToken();
    if (sessionToken === null) {
      return null; // SDK contract: return null when unauthenticated, don't throw
    }
    try {
      const { token } = await fetchPowerSyncToken();
      return { endpoint: POWERSYNC_ENDPOINT, token };
    } catch {
      return null; // SDK contract: return null when credentials can't be obtained, don't throw
    }
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
