import { Controller, Get, ParseIntPipe } from '@nestjs/common';
import { CookbookService } from './cookbook.service';
import { GetUser } from 'src/user/decorator/user.decorator';
import { GetPagination } from 'src/utils/decorators/pagination.decorator';
import { IPagination, ISelection } from 'src/types';
import { GetSelection } from 'src/utils/decorators/selector.decorator';
import { GetSearchTerm } from 'src/utils/decorators/search.decorator';

@Controller('cookbooks')
export class CookbookController {
  constructor(private readonly cookbookService: CookbookService) {}

  // @Post()
  // create(
  //   @GetUser('id') userId: number,
  //   @Body() createCookbookDto: CreateCookbookDto,
  // ) {
  //   return this.cookbookService.create(userId, createCookbookDto);
  // }

  @Get('my-cookbooks')
  getMyCookbooks(
    @GetUser('id') userId: number,
    @GetPagination() pagination?: IPagination,
    @GetSelection() selection?: ISelection,
    @GetSearchTerm() search?: string,
  ) {
    return this.cookbookService.getMyCookbooks(
      userId, 
      pagination,
      selection,
      search,
    );
  }

  // //TODO
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.cookbookService.findOne(+id);
  // }

  // //TODO
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCookbookDto: UpdateCookbookDto) {
  //   return this.cookbookService.update(+id, updateCookbookDto);
  // }

  // //TODO
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.cookbookService.remove(+id);
  // }

  //TODO Find public
}
