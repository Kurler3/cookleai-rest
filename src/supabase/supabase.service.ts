import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { truncate } from 'fs';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  private supabase: SupabaseClient;
  private imagesBucketName: string;

  constructor(private configService: ConfigService) {
    if (!this.supabase) {
      this.supabase = createClient(
        this.configService.get('SUPABASE_URL'),
        this.configService.get('SUPABASE_SERVICE_ROLE_KEY'),
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
        
      // Upload the file
      const { data, error } = await this.supabase.storage
        .from(this.imagesBucketName)
        .upload(
            path, 
            file.buffer, 
            {
                contentType: file.mimetype,
                upsert: true,
            }
        );

      if (error) {
        throw new BadRequestException(`Error uploading file: ${error.message}`);
      }

      // Get the public url
      const {
        data: { publicUrl },
      } = this.supabase.storage
        .from(this.imagesBucketName)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      this.logger.error(error.stack);

      throw new BadRequestException(`Error uploading file: ${error.message}`);
    }
  }

  // Add user to auth
  async createUser(
    email: string,
    name: {
      givenName: string;
      familyName: string;
    },
    photo: string,
  ) {

    return await this.supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: `${name.givenName} ${name.familyName}`,
        avatar_url: photo,
      }
    })

  }
}
