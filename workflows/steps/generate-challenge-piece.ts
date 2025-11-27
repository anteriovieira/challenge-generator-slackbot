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
    console.log("=== Input Messages ===");
    console.log(JSON.stringify(messages, null, 2));

    const timerLabel = `Generating challenge piece ${Date.now()}`;
    console.time(timerLabel);

    try {
        const result = await generateText({
            model,
            messages,
            experimental_output: Output.object({
                schema: ChallengePieceSchema,
            }),
            experimental_telemetry: { isEnabled: true },
        });
        console.timeEnd(timerLabel);

        console.log("=== AI Response (Parsed) ===");
        console.log(JSON.stringify(result.experimental_output, null, 2));

        return result.experimental_output;
    } catch (error) {
        console.timeEnd(timerLabel);
        console.error("=== Schema Validation Error ===");
        console.error("Error:", error);

        // Log the error details if available
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }

        // Try to extract and log the raw response if available
        try {
            const errorObj = error as any;
            if (errorObj.response) {
                console.error("=== Raw AI Response ===");
                console.error(JSON.stringify(errorObj.response, null, 2));
            }
            if (errorObj.text) {
                console.error("=== Raw Text Response ===");
                console.error(errorObj.text);
            }
        } catch (logError) {
            console.error("Could not extract raw response from error");
        }

        // Re-throw the error to be handled by the workflow
        throw error;
    }
}
