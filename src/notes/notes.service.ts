import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';
import { ChatService } from '../chat/chat.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './entities/note.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
    private chatService: ChatService,
    private configService: ConfigService,
  ) {}

  async create(createNoteDto: CreateNoteDto, userId: number): Promise<Note> {
    const note = this.notesRepository.create({
      ...createNoteDto,
      userId,
    });
    return await this.notesRepository.save(note);
  }

  async createMany(
    createNoteDtos: CreateNoteDto[],
    userId: number,
  ): Promise<Note[]> {
    const notes = this.notesRepository.create(
      createNoteDtos.map((dto) => ({
        ...dto,
        userId,
      })),
    );
    return await this.notesRepository.save(notes);
  }

  async findAll(userId: number): Promise<Note[]> {
    const allNotes = await this.notesRepository.find({
      where: { userId },
      order: { time: 'ASC' },
    });

    // Lọc notes có time >= hiện tại
    return allNotes.filter((note) => {
      return dayjs(note.time, 'YYYY-MM-DDTHH:mm:ss.sssZ').isAfter(dayjs());
    });
  }

  async findOne(id: number, userId: number): Promise<Note> {
    const note = await this.notesRepository.findOne({
      where: { id, userId },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    return note;
  }

  async update(
    id: number,
    updateNoteDto: UpdateNoteDto,
    userId: number,
  ): Promise<Note> {
    const note = await this.findOne(id, userId);

    Object.assign(note, updateNoteDto);
    return await this.notesRepository.save(note);
  }

  async remove(id: number, userId: number): Promise<void> {
    const note = await this.findOne(id, userId);
    await this.notesRepository.remove(note);
  }

  async removeAllByUser(userId: number): Promise<{ deleted: number }> {
    const result = await this.notesRepository.delete({ userId });
    return { deleted: result.affected || 0 };
  }

  async findByImportance(
    importance: 'medium' | 'critical',
    userId: number,
  ): Promise<Note[]> {
    return await this.notesRepository.find({
      where: { importance, userId },
      order: { time: 'DESC' },
    });
  }

  async generateDailySchedule(userId: number): Promise<Note[]> {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const currentDate = now.toLocaleDateString('vi-VN');

    const prompt = `Create a daily schedule for the user.
      Current time: ${currentTime}, date: ${currentDate} GMT+7.

      Task:
      Based on the context, evaluate and return the following fields in JSON format, no more extra text outside the JSON:
    
      [
        {
          "time": "YYYY-MM-DDTHH:mm:ss.sssZ" con vert to UTC+0,
          "content": "Description of the activity",
          "importance": "medium" or "critical",
          "isAiGenerated": true
        }
      ]

      Requirements:
      - Generate a schedule from the current time (${currentTime}) until the end of the day (23:59)
      - Each activity should have a specific time (format: HH:mm)
      - The content should be practical and beneficial for mental and physical health
      - Include activities such as: rest, meals, exercise, entertainment, work/study
      - Assign an importance level: "medium" or "critical"
      - Alway return valid JSON format
      - Alway return content in Vietnamese
      `;

    // Gọi AI để generate schedule
    const model = this.chatService['ai'].getGenerativeModel({
      model: this.configService.get<string>(
        'GEMINI_SUPER_MODEL',
        'gemini-2.5-flash',
      ),
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON response
    const clean = text
      .replace(/```json/i, '')
      .replace(/```/g, '')
      .trim();

    let scheduleData: CreateNoteDto[];
    try {
      scheduleData = JSON.parse(clean);
    } catch (error) {
      throw new Error(
        `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}. Response: ${clean}`,
      );
    }

    // Validate and create notes
    if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
      throw new Error('AI response is not a valid array or is empty');
    }

    // Create many notes
    await this.removeAllByUser(userId); // Xóa lịch cũ trước khi tạo mới
    return await this.createMany(scheduleData, userId);
  }
}
