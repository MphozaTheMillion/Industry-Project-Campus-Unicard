'use server';
/**
 * @fileOverview An AI flow for verifying a user's identity via a liveness check.
 *
 * - verifyLiveness - A function that handles the liveness verification process.
 * - VerifyLivenessInput - The input type for the verifyLiveness function.
 * - VerifyLivenessOutput - The return type for the verifyLiveness function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyLivenessInputSchema = z.object({
  originalPhotoDataUri: z
    .string()
    .describe(
      "The user's original profile photo, as a data URI."
    ),
  neutralPhotoDataUri: z
    .string()
    .describe(
      'A fresh photo of the user looking straight at the camera with a neutral expression.'
    ),
  blinkPhotoDataUri: z
    .string()
    .describe(
      'A photo taken while the user was instructed to blink.'
    ),
  turnRightPhotoDataUri: z
    .string()
    .describe(
      'A photo taken while the user was instructed to turn their head to the right.'
    ),
});
export type VerifyLivenessInput = z.infer<typeof VerifyLivenessInputSchema>;

const VerifyLivenessOutputSchema = z.object({
  isSamePerson: z
    .boolean()
    .describe(
      'Whether the person in the new photos is the same as the person in the original profile photo.'
    ),
  isLive: z
    .boolean()
    .describe(
      'Whether the user appears to be a live person performing the requested actions.'
    ),
  verificationFeedback: z
    .string()
    .describe(
      'A summary of the verification result. E.g., "Verification successful." or "Liveness check failed: eyes were not closed in the blink photo."'
    ),
});
export type VerifyLivenessOutput = z.infer<typeof VerifyLivenessOutputSchema>;

export async function verifyLiveness(input: VerifyLivenessInput): Promise<VerifyLivenessOutput> {
  return verifyLivenessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyLivenessPrompt',
  input: { schema: VerifyLivenessInputSchema },
  output: { schema: VerifyLivenessOutputSchema },
  prompt: `You are a highly advanced security AI. Your task is to perform a face verification and liveness check.

You will be given four images:
1.  **Original Photo:** The trusted profile picture of the user.
2.  **Neutral Photo:** A new photo of the user looking straight ahead.
3.  **Blink Photo:** A photo taken moments after the user was asked to blink.
4.  **Turn Right Photo:** A photo taken moments after the user was asked to turn their head to the right.

Your analysis has two parts:

**Part 1: Face Verification**
Compare the face in the **Original Photo** with the face in the **Neutral Photo**. Determine if they are the same person. Set \`isSamePerson\` to \`true\` or \`false\`. If they are not the same person, the entire check fails.

**Part 2: Liveness Check**
Assuming they are the same person, analyze the sequence of new photos to determine if the user is a live person performing the requested actions.
- Compare the **Neutral Photo** and the **Blink Photo**. The eyes in the **Blink Photo** should be closed or mostly closed.
- Compare the **Neutral Photo** and the **Turn Right Photo**. The head in the **Turn Right Photo** should be oriented to the right relative to the neutral pose.

Set \`isLive\` to \`true\` only if BOTH liveness actions (blinking and head turning) are clearly detected. Otherwise, set it to \`false\`.

Finally, provide a brief summary of your findings in \`verificationFeedback\`.

**Images:**
- Original Photo: {{media url=originalPhotoDataUri}}
- Neutral Photo: {{media url=neutralPhotoDataUri}}
- Blink Photo: {{media url=blinkPhotoDataUri}}
- Turn Right Photo: {{media url=turnRightPhotoDataUri}}
`,
});

const verifyLivenessFlow = ai.defineFlow(
  {
    name: 'verifyLivenessFlow',
    inputSchema: VerifyLivenessInputSchema,
    outputSchema: VerifyLivenessOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
