import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import toArrayBuffer from 'src/utils/functions/toArrayBuffer';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  private supabase: SupabaseClient;
  private imagesBucketName: string;

  constructor(private configService: ConfigService) {
    if (!this.supabase) {
      this.supabase = createClient(
        this.configService.get('SUPABASE_URL'),
        this.configService.get('SUPABASE_KEY'),
      );
    }

    this.imagesBucketName = this.configService.get('IMAGES_BUCKET');
  }

  // Delete file
  async deleteFile(path: string) {
    try {
      await this.supabase.storage.from(this.imagesBucketName).remove([path]);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
    }
  }

  // Upload file and return the url
  async uploadFile(file: Express.Multer.File, path: string) {
    try {
        console.log(file, this.imagesBucketName);
      // Upload the file
      const { data, error } = await this.supabase.storage
        .from(this.imagesBucketName)
        .upload(
            "test", 
            file.buffer, 
            {
                contentType: file.mimetype,
            }
        );

      if (error) {
        throw new BadRequestException(`Error uploading file: ${error.message}`);
      }

      return "hello"

    //   // Get the public url
    //   const {
    //     data: { publicUrl },
    //   } = this.supabase.storage
    //     .from(this.imagesBucketName)
    //     .getPublicUrl(data.id);

    //   return publicUrl;
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      this.logger.error(error.stack);

      throw new BadRequestException(`Error uploading file: ${error.message}`);
    }
  }
}
