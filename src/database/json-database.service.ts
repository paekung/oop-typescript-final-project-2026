import { Injectable, OnModuleInit } from '@nestjs/common';
import { constants } from 'fs';
import { access } from 'fs/promises';
import jsonfile from 'jsonfile';
import { join } from 'path';
import { DatabaseSchema } from './database-schema.interface';

const defaultData: DatabaseSchema = {
  services: [],
  appointments: [],
};

@Injectable()
export class JsonDatabaseService implements OnModuleInit {
  private readonly filePath = join(process.cwd(), 'database.json');

  async onModuleInit(): Promise<void> {
    await this.ensureFile();
  }

  private async ensureFile(): Promise<void> {
    try {
      await access(this.filePath, constants.F_OK);
    } catch {
      await jsonfile.writeFile(this.filePath, defaultData, { spaces: 2 });
    }
  }

  async read(): Promise<DatabaseSchema> {
    await this.ensureFile();

    const data = (await jsonfile.readFile(this.filePath)) as DatabaseSchema;

    return {
      services: data.services ?? [],
      appointments: data.appointments ?? [],
    };
  }

  async write(data: DatabaseSchema): Promise<void> {
    await jsonfile.writeFile(this.filePath, data, { spaces: 2 });
  }

  async reset(): Promise<void> {
    await this.write({
      services: [],
      appointments: [],
    });
  }
}