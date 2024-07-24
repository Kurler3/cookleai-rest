import { BadRequestException, PipeTransform } from "@nestjs/common";


export class FileTypesValidator implements PipeTransform {

    availableTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    transform(
        value: Express.Multer.File,
    ) {

        const { mimetype } = value;

        if(!this.availableTypes.includes(mimetype)) {
            throw new BadRequestException(
                `Invalid file type. Available types: ${this.availableTypes.join(', ')}`
            );
        }
 
        return value;
    }
}