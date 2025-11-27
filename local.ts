import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import readline from "node:readline/promises";
import { generateText, type ModelMessage, Output } from "ai";
import { z } from "zod";
import terminalImage from "terminal-image";
import { SYSTEM_PROMPT, IMAGE_GEN_PROMPT } from "./lib/prompt.ts";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const messages: ModelMessage[] = [
	{
		role: "system",
		content: SYSTEM_PROMPT(),
	},
	{
		role: "user",
		content: "Let's start creating a challenge.",
	},
];

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

let finalChallenge: { title: string; description: string } | undefined;

while (true) {
	const result = await generateText({
		//model: "openai/gpt-5-mini",
		//model: "anthropic/claude-4-sonnet",
		//model: "xai/grok-4",
		model: "meta/llama-4-scout",
		messages,
		experimental_output: Output.object({
			schema: ChallengePieceSchema,
		}),
	});
	console.log(result.experimental_output);

	messages.push({
		role: "assistant",
		content: result.text,
	});

	if (
		result.experimental_output?.done &&
		result.experimental_output?.challenge
	) {
		finalChallenge = result.experimental_output.challenge;
		break;
	}

	// read user input
	console.log("");
	const userInput = await rl.question("Enter your feedback: ");

	messages.push({
		role: "user",
		content: userInput,
	});
}

rl.close();

if (!finalChallenge) {
	console.error("Failed to generate challenge");
	process.exit(1);
}

console.log("");
console.log("Here is the final challenge:");
console.log(finalChallenge.title);
console.log(finalChallenge.description);

const result = await generateText({
	model: "google/gemini-2.5-flash-image-preview",
	prompt: IMAGE_GEN_PROMPT(finalChallenge),
});

console.log(await terminalImage.buffer(result.files[0].uint8Array));
