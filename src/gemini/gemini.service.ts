import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateRecipeDto } from 'src/recipe/dto/create-recipe.dto';
import { GEMINI_MODEL_CONTEXT } from 'src/utils/constants/geminiAi.constants';

@Injectable()
export class GeminiService {
    private model: GenerativeModel;

    constructor(
        private readonly configService: ConfigService
    ) {

        const genAI = new GoogleGenerativeAI(this.configService.get("GEMINI_API_KEY"));

        this.model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: GEMINI_MODEL_CONTEXT
        });
    }

    // Get text from prompt.
    private async generateTextFromTextPrompt(prompt: string) {
        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }

    // Generate recipe from prompt.
    async generateRecipeFromPrompt(prompt: string) {

        const result = await this.generateTextFromTextPrompt(prompt);

        try {
    
            const recipePayload = JSON.parse(result);

            if(!recipePayload.title) {
                throw new BadRequestException('Error while generating the recipe...');
            }

            return recipePayload as CreateRecipeDto;
        } catch (error) {
            console.error('Error while parsing recipe...', error);
            throw new BadRequestException('Error while generating the recipe...');
        }

    }


    //TODO Generate image from prompt?

}
