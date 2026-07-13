import { DatabaseError } from 'fyo/utils/errors';
import { SchemaMap } from 'schemas/types';
import { DatabaseDemuxBase, DatabaseMethod } from 'utils/db/types';
import { BackendResponse } from 'utils/ipc/types';

export class DatabaseDemux extends DatabaseDemuxBase {
  #isElectron = false;
  constructor(isElectron: boolean) {
    super();
    this.#isElectron = isElectron;
  }

  async #handleDBCall(func: () => Promise<BackendResponse>): Promise<unknown> {
    const response = await func();

    if (response.error?.name) {
      const { name, message, stack } = response.error;
      const dberror = new DatabaseError(`${name}\n${message}`);
      dberror.stack = stack;

      throw dberror;
    }

    return response.data;
  }

  async getSchemaMap(): Promise<SchemaMap> {
    if (!this.#isElectron) {
      return {};
    }

    return (await this.#handleDBCall(async () => {
      return await window.ipc.db.getSchema();
    })) as SchemaMap;
  }

  async createNewDatabase(
    dbPath: string,
    countryCode?: string
  ): Promise<string> {
    if (!this.#isElectron) {
      return countryCode ?? '';
    }

    return (await this.#handleDBCall(async () => {
      return window.ipc.db.create(dbPath, countryCode);
    })) as string;
  }

  async connectToDatabase(
    dbPath: string,
    countryCode?: string
  ): Promise<string> {
    if (!this.#isElectron) {
      return countryCode ?? '';
    }

    return (await this.#handleDBCall(async () => {
      return window.ipc.db.connect(dbPath, countryCode);
    })) as string;
  }

  async call(method: DatabaseMethod, ...args: unknown[]): Promise<unknown> {
    if (!this.#isElectron) {
      return {};
    }

    return await this.#handleDBCall(async () => {
      return await window.ipc.db.call(method, ...args);
    });
  }

  async callBespoke(method: string, ...args: unknown[]): Promise<unknown> {
    if (!this.#isElectron) {
      return [];
    }

    return await this.#handleDBCall(async () => {
      return await window.ipc.db.bespoke(method, ...args);
    });
  }
}
