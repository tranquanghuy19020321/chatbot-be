import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './entities/note.entity';
import { NotesService } from './notes.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
    name: string;
  };
}

@ApiTags('notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({
    status: 201,
    description: 'The note has been successfully created.',
    type: Note,
  })
  create(
    @Body() createNoteDto: CreateNoteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Note> {
    return this.notesService.create(createNoteDto, req.user.userId);
  }

  @Post('generate-daily-schedule')
  @ApiOperation({ summary: 'Generate daily schedule notes using AI' })
  @ApiResponse({
    status: 201,
    description: 'Daily schedule notes have been successfully generated.',
    type: [Note],
  })
  generateDailySchedule(@Req() req: AuthenticatedRequest): Promise<Note[]> {
    return this.notesService.generateDailySchedule(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all notes.',
    type: [Note],
  })
  findAll(@Req() req: AuthenticatedRequest): Promise<Note[]> {
    return this.notesService.findAll(req.user.userId);
  }

  @Get('importance/:importance')
  @ApiOperation({ summary: 'Get notes by importance level' })
  @ApiResponse({
    status: 200,
    description: 'Return notes by importance.',
    type: [Note],
  })
  findByImportance(
    @Param('importance') importance: 'medium' | 'critical',
    @Req() req: AuthenticatedRequest,
  ): Promise<Note[]> {
    return this.notesService.findByImportance(importance, req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by id' })
  @ApiResponse({
    status: 200,
    description: 'Return a note.',
    type: Note,
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Note> {
    return this.notesService.findOne(+id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({
    status: 200,
    description: 'The note has been successfully updated.',
    type: Note,
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Note> {
    return this.notesService.update(+id, updateNoteDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiResponse({
    status: 200,
    description: 'The note has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.notesService.remove(+id, req.user.userId);
    return { message: 'Note deleted successfully' };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notes for the current user' })
  @ApiResponse({
    status: 200,
    description: 'All notes have been successfully deleted.',
  })
  async removeAll(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string; deleted: number }> {
    const result = await this.notesService.removeAllByUser(req.user.userId);
    return {
      message: 'All notes deleted successfully',
      deleted: result.deleted,
    };
  }
}
