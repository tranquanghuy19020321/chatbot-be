import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsCompletedToTest1765898825210 implements MigrationInterface {
  name = 'AddIsCompletedToTest1765898825210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`tests\` ADD \`isCompleted\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`tests\` DROP COLUMN \`isCompleted\``,
    );
  }
}
