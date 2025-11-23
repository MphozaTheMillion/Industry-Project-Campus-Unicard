'use server';
/**
 * @fileOverview An AI flow for validating user-submitted ID photos.
 *
 * - validatePhoto - A function that handles the photo validation process.
 * - ValidatePhotoInput - The input type for the validatePhoto function.
 * - ValidatePhotoOutput - The return type for the validatePhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidatePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person for a digital ID card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ValidatePhotoInput = z.infer<typeof ValidatePhotoInputSchema>;

const PhotoIssueSchema = z.object({
    code: z.enum(["NOT_NECK_UP", "NOT_NEUTRAL_EXPRESSION", "EYES_NOT_VISIBLE", "HAS_HAT_OR_GLASSES", "HAS_SHADOWS_OR_REFLECTIONS", "NOT_A_PERSON", "LOW_QUALITY"]),
    feedback: z.string().describe("A user-friendly message explaining the issue and how to fix it."),
});

const ValidatePhotoOutputSchema = z.object({
  isValid: z.boolean().describe('Whether or not the photo is valid for an ID card.'),
  issues: z.array(PhotoIssueSchema).describe('A list of issues found with the photo.'),
});
export type ValidatePhotoOutput = z.infer<typeof ValidatePhotoOutputSchema>;

export async function validatePhoto(input: ValidatePhotoInput): Promise<ValidatePhotoOutput> {
  return validatePhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validatePhotoPrompt',
  input: {schema: ValidatePhotoInputSchema},
  output: {schema: ValidatePhotoOutputSchema},
  prompt: `You are an expert at validating photos for official ID cards. Your task is to analyze the provided photo and determine if it meets all the required guidelines.

**Photo Guidelines:**
1.  **Framing:** The photo must be a clear, front-facing shot from the person's neck up.
2.  **Expression:** The person must have a neutral expression with their mouth closed. No smiling, frowning, or other exaggerated expressions.
3.  **Eyes:** The person's eyes must be open and clearly visible.
4.  **Accessories:** The person must not be wearing a hat, sunglasses, or regular glasses. Religious head coverings are acceptable as long as they do not obscure the face.
5.  **Lighting:** The photo must be well-lit, with no shadows on the face or reflections in the background.
6.  **Quality:** The photo must not be blurry or low-resolution.
7.  **Subject:** The photo must clearly be of a single person.

Analyze the following image and determine if it is valid. For each rule that is violated, provide a specific issue code and user-friendly feedback. If the photo is valid, return \`isValid: true\` and an empty issues array.

Photo: {{media url=photoDataUri}}`,
});

const validatePhotoFlow = ai.defineFlow(
  {
    name: 'validatePhotoFlow',
    inputSchema: ValidatePhotoInputSchema,
    outputSchema: ValidatePhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
