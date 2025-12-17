import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTestMentalHealthEvaluations1734374400000
  implements MigrationInterface
{
  name = 'CreateTestMentalHealthEvaluations1734374400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'test_mental_health_evaluations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'test_id',
            type: 'int',
            isUnique: true,
          },
          {
            name: 'emotion_state',
            type: 'enum',
            enum: ['HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'STRESSED', 'NEUTRAL'],
          },
          {
            name: 'stress_level',
            type: 'tinyint',
            unsigned: true,
          },
          {
            name: 'gad7_score',
            type: 'tinyint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'gad7_assessment',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'pss10_score',
            type: 'tinyint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'pss10_assessment',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'phq9_score',
            type: 'tinyint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'phq9_assessment',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'mbi_emotional_exhaustion',
            type: 'tinyint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'mbi_cynicism',
            type: 'tinyint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'mbi_professional_efficacy',
            type: 'tinyint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'mbi_assessment',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'overall_mental_health',
            type: 'text',
          },
          {
            name: 'recommendations',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'risk_level',
            type: 'enum',
            enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['test_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'tests',
            onDelete: 'CASCADE',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('test_mental_health_evaluations');
  }
}
