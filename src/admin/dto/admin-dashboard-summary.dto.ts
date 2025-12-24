import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardSummaryDto {
  @ApiProperty({
    description: 'Total number of members',
    example: 180,
    type: 'number',
  })
  totalMember: number;

  @ApiProperty({
    description:
      'Number of members who have completed mental health evaluation',
    example: 100,
    type: 'number',
  })
  memberEvaluateMentalHealth: number;
}
