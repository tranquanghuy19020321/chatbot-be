import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsAiGeneratedToNotes1733215000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'notes',
      new TableColumn({
        name: 'isAiGenerated',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('notes', 'isAiGenerated');
  }
}
