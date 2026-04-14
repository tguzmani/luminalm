import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

interface AuthenticatedRequest {
  user: { userId: string; role: string };
}

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateEntryDto) {
    return this.entriesService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.entriesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.entriesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.entriesService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.entriesService.remove(req.user.userId, id);
  }
}
