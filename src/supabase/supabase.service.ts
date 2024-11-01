import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    if (!this.supabase) {
      this.supabase = createClient(
        this.configService.get('SUPABASE_URL'),
        this.configService.get('SUPABASE_SERVICE_ROLE_KEY'),
      );
    }
  }

  // Get file public url
  async getFilePublicUrl({
    bucket,
    path,
  }: {
    bucket: string;
    path: string;
  }) {

    const {
      data: { publicUrl },
    } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }

  // Move file across buckets
  async moveFile({
    sourceBucket,
    destinationBucket,
    path,
  }: {
    sourceBucket: string;
    destinationBucket: string;
    path: string;
  }) {

    const { error } = await this.supabase.storage.from(sourceBucket).move(path, path, { destinationBucket });

    if (error) {
      console.log("Error while moving file between buckets: ", error)
      throw new BadRequestException('Error while moving file between buckets');
    }

  }

  // Delete file
  async deleteFile(bucket: string, path: string) {
    try {
      await this.supabase.storage.from(bucket).remove([path]);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
    }
  }

  // Upload file and return the url
  async uploadFile(
    bucket: string,
    file: Express.Multer.File,
    path: string,
    getPublicUrl = false,
  ) {
    try {

      // Upload the file
      const { data, error } = await this.supabase.storage
        .from(bucket)
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


      let publicUrl: string;

      if (getPublicUrl) {
        // Get the public url
        const {
          data: { publicUrl: newPublicUrl },
        } = this.supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        publicUrl = newPublicUrl;

      }


      return {
        publicUrl,
        filePath: data.path,
      };

    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      this.logger.error(error.stack);

      throw new BadRequestException(`Error uploading file: ${error.message}`);
    }
  }


  // Generate pre-signed url for a given file.
  async generatePreSignedUrl({
    bucket,
    path,
    duration = 60 * 5 // By default, 5 minutes
  }: {
    bucket: string;
    path: string;
    duration?: number;
  }) {

    const {
      error,
      data: signedUrlRes,
    } = await this.supabase.storage.from(bucket).createSignedUrl(path, duration);

    if (error) {
      console.error("Error while generating presigned url: ", error);
      throw new BadRequestException('Error while generating presigned url')
    }

    return signedUrlRes.signedUrl;
  }




  // // Add user to auth
  // async createUser(
  //   email: string,
  //   name: {
  //     givenName: string;
  //     familyName: string;
  //   },
  //   photo: string,
  // ) {

  //   return await this.supabase.auth.admin.createUser({
  //     email,
  //     email_confirm: true,
  //     user_metadata: {
  //       full_name: `${name.givenName} ${name.familyName}`,
  //       avatar_url: photo,
  //     }
  //   })

  // }

}
