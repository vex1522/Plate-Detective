'use server';
/**
 * @fileOverview Extracts the number plate from an image using OCR.
 *
 * - extractPlateNumber - A function that handles the number plate extraction process.
 * - ExtractPlateNumberInput - The input type for the extractPlateNumber function.
 * - ExtractPlateNumberOutput - The return type for the extractPlateNumber function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ExtractPlateNumberInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a car's number plate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractPlateNumberInput = z.infer<typeof ExtractPlateNumberInputSchema>;

const ExtractPlateNumberOutputSchema = z.object({
  plateNumber: z.string().describe('The extracted number plate from the image.'),
});
export type ExtractPlateNumberOutput = z.infer<typeof ExtractPlateNumberOutputSchema>;

export async function extractPlateNumber(input: ExtractPlateNumberInput): Promise<ExtractPlateNumberOutput> {
  return extractPlateNumberFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPlateNumberPrompt',
  input: {
    schema: z.object({
      photoDataUri: z
        .string()
        .describe(
          "A photo of a car's number plate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    }),
  },
  output: {
    schema: z.object({
      plateNumber: z.string().describe('The extracted number plate from the image.'),
    }),
  },
  prompt: `You are an expert OCR reader specializing in car number plates.\n\nYou will use this information to extract the number plate from the image.\n\nExtract the number plate from the following image:\n\n{{media url=photoDataUri}}`,
});

const extractPlateNumberFlow = ai.defineFlow<
  typeof ExtractPlateNumberInputSchema,
  typeof ExtractPlateNumberOutputSchema
>(
  {
    name: 'extractPlateNumberFlow',
    inputSchema: ExtractPlateNumberInputSchema,
    outputSchema: ExtractPlateNumberOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
