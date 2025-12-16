import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateQuestionEntity1765883141024 implements MigrationInterface {
  name = 'UpdateQuestionEntity1765883141024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`questions\` ADD \`questionType\` enum ('gad', 'mbi', 'phq', 'pss') NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`answer\``);
    await queryRunner.query(
      `ALTER TABLE \`questions\` ADD \`answer\` int NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`answer\``);
    await queryRunner.query(
      `ALTER TABLE \`questions\` ADD \`answer\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`questions\` DROP COLUMN \`questionType\``,
    );
  }
}
