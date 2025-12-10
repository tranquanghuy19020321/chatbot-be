import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTests1733500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tests table
    await queryRunner.createTable(
      new Table({
        name: 'tests',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'userId',
            type: 'int',
          },
        ],
      }),
      true,
    );

    // Create foreign key for userId
    await queryRunner.createForeignKey(
      'tests',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create questions table
    await queryRunner.createTable(
      new Table({
        name: 'questions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'question',
            type: 'text',
          },
          {
            name: 'answer',
            type: 'text',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'testId',
            type: 'int',
          },
        ],
      }),
      true,
    );

    // Create foreign key for testId
    await queryRunner.createForeignKey(
      'questions',
      new TableForeignKey({
        columnNames: ['testId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tests',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const questionsTable = await queryRunner.getTable('questions');
    if (questionsTable) {
      const testsForeignKey = questionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('testId') !== -1,
      );
      if (testsForeignKey) {
        await queryRunner.dropForeignKey('questions', testsForeignKey);
      }
    }

    const testsTable = await queryRunner.getTable('tests');
    if (testsTable) {
      const usersForeignKey = testsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );
      if (usersForeignKey) {
        await queryRunner.dropForeignKey('tests', usersForeignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('questions');
    await queryRunner.dropTable('tests');
  }
}
