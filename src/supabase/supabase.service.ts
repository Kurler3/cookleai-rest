import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {

    private supabase: SupabaseClient;
    private imagesBucketName: string;

    constructor(private configService: ConfigService) {

        if (!this.supabase) {
            this.supabase = createClient(
                this.configService.get('SUPABASE_URL'),
                this.configService.get('SUPABASE_KEY')
            );
        }

        this.imagesBucketName = this.configService.get("IMAGES_BUCKET");
    }

    // Delete file
    async deleteFile(
        path: string,
    ) {
        await this.supabase.storage
            .from(this.imagesBucketName)
            .remove([path]);
    }

    // Upload file and return the url
    async uploadFile(
        file: Express.Multer.File,
        path: string,
    ) {
        // Upload the file
        const { data, error } = await this.supabase
          .storage
          .from(
            this.imagesBucketName
          )
          .upload(
                path, 
                file.buffer, 
                {
                    contentType: file.mimetype
                }
            );
    
        if (error) {
          throw new BadRequestException(`Error uploading file: ${error.message}`);
        }
    
        // Get the public url
        const { data: { publicUrl } } = this.supabase
          .storage
          .from(this.imagesBucketName)
          .getPublicUrl(data.fullPath);
    
        return publicUrl;
      }


}
