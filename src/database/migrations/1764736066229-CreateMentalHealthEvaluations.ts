import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateMentalHealthEvaluations1764736066229
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'mental_health_evaluations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'emotion_state',
            type: 'enum',
            enum: ['HAPPY', 'SAD', 'ANGRY', 'NEUTRAL'],
            isNullable: false,
          },
          {
            name: 'stress_level',
            type: 'tinyint',
            unsigned: true,
            isNullable: false,
            comment: 'Stress level from 0 to 100',
          },
          {
            name: 'gad7_score',
            type: 'tinyint',
            unsigned: true,
            isNullable: false,
            comment: 'GAD-7 score from 0 to 21',
          },
          {
            name: 'gad7_assessment',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'pss10_score',
            type: 'tinyint',
            unsigned: true,
            isNullable: false,
            comment: 'PSS-10 score from 0 to 40',
          },
          {
            name: 'pss10_assessment',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'mbi_emotional_exhaustion',
            type: 'tinyint',
            unsigned: true,
            isNullable: false,
            comment: 'MBI Emotional Exhaustion from 0 to 30',
          },
          {
            name: 'mbi_cynicism',
            type: 'tinyint',
            unsigned: true,
            isNullable: false,
            comment: 'MBI Cynicism from 0 to 30',
          },
          {
            name: 'mbi_professional_efficacy',
            type: 'tinyint',
            unsigned: true,
            isNullable: false,
            comment: 'MBI Professional Efficacy from 0 to 30',
          },
          {
            name: 'mbi_assessment',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'overall_mental_health',
            type: 'text',
            isNullable: false,
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
      }),
      true,
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'mental_health_evaluations',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Add index for user_id and created_at for faster queries
    await queryRunner.query(
      `CREATE INDEX idx_user_created ON mental_health_evaluations(user_id, created_at DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('mental_health_evaluations');
  }
}
