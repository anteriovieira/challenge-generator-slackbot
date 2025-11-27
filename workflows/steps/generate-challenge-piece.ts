import { generateText, type ModelMessage, Output } from "ai";
import { z } from "zod";

const ChallengePieceSchema = z.object({
    done: z.boolean().describe("Whether the challenge creation is complete"),
    encouragement: z
        .string()
        .describe("An encouragement to the user to continue refining the challenge"),
    challenge: z
        .object({
            title: z.string().describe("The title of the challenge"),
            description: z.string().describe("The description of the challenge"),
        })
        .optional()
        .describe(
            "The final challenge details (if the challenge creation is complete)",
        ),
});

export async function generateChallengePiece(
    messages: ModelMessage[],
    model: string,
) {
    "use step";

    // Debugging
    console.log(JSON.stringify(messages, null, 2));

    const timerLabel = `Generating challenge piece ${Date.now()}`;
    console.time(timerLabel);
    const result = await generateText({
        model,
        messages,
        experimental_output: Output.object({
            schema: ChallengePieceSchema,
        }),
        experimental_telemetry: { isEnabled: true },
        headers: {
            'Authorization': `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
        },
    });
    console.timeEnd(timerLabel);

    return result.experimental_output;
}
