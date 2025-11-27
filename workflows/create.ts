import type { ModelMessage } from "ai";
import { defineHook, FatalError } from "workflow";
import { SYSTEM_PROMPT } from "../lib/prompt";
import { validateEnv } from "../lib/env";

// Look ma no queues or kv!

// Steps
import { generateChallengePiece } from "./steps/generate-challenge-piece";
import {
	broadcastChallengeImage,
	generateChallengeImage,
} from "./steps/generate-challenge-image";
import {
	addReactionToMessage,
	postSlackMessage,
	removeReactionFromMessage,
	updateSlackMessage,
} from "./steps/post-slack-message";

export const slackMessageHook = defineHook<{
	text: string;
	ts: string;
}>();

export async function createChallenge(slashCommand: URLSearchParams) {
	"use workflow";

	// Validate environment variables
	validateEnv();

	// Initialize the workflow
	const channelId = slashCommand.get("channel_id");
	if (!channelId) {
		throw new FatalError("`channel_id` is required");
	}

	const model = "google/gemini-1.5-pro";

	// ...including local state like the entire message history
	let finalChallenge: { title: string; description: string } | undefined;
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

	const introText = `Let's create a challenge! I'll help you refine your idea.`;

	const [{ ts, message }, aiResponse] = await Promise.all([
		// Create the initial top-level message in the channel with a placeholder
		postSlackMessage({
			channel: channelId,
			text: `${introText}\n\n> _Thinking…_ :thinking_face:`,
		}),
		// Ask the LLM to initiate the challenge creation
		generateChallengePiece(messages, model),
	]);

	const botId = message?.user;
	if (!botId) {
		throw new FatalError("Failed to get bot ID");
	}

	await updateSlackMessage({
		channel: channelId,
		ts,
		text: `${introText}\n\n> _${aiResponse.encouragement}_`,
	});

	messages.push({
		role: "assistant",
		content: aiResponse.encouragement,
	});

	// Subscribe to new messages in the thread
	const slackMessageEvent = slackMessageHook.create({
		token: `slack-message-webhook:${channelId}:${ts}`,
	});

	// Post the initial encouragement message to start the thread
	await postSlackMessage({
		channel: channelId,
		text: aiResponse.encouragement,
		thread_ts: ts,
	});

	// Process user messages in the thread (via the webhook) in
	// a loop until the LLM decides that the challenge is complete
	for await (const data of slackMessageEvent) {
		messages.push({
			role: "user",
			content: data.text,
		});

		// Submit user's message to the LLM to continue the challenge creation
		const [aiResponse] = await Promise.all([
			generateChallengePiece(messages, model),
			addReactionToMessage({
				channel: channelId,
				timestamp: data.ts,
				name: "thinking_face",
			}),
		]);

		messages.push({
			role: "assistant",
			content: aiResponse.encouragement,
		});

		await Promise.all([
			postSlackMessage({
				channel: channelId,
				thread_ts: ts,
				text: aiResponse.encouragement,
			}),
			removeReactionFromMessage({
				channel: channelId,
				timestamp: data.ts,
				name: "thinking_face",
			}),
		]);

		// If the LLM has decided that the challenge is complete, break the loop.
		// No more user messages will be processed in the thread after this.
		if (aiResponse.done && aiResponse.challenge) {
			finalChallenge = aiResponse.challenge;
			break;
		}
	}

	if (!finalChallenge) {
		throw new FatalError("Failed to generate challenge");
	}

	const finalText = `*Here is the final challenge:*\n\n*${finalChallenge.title}*\n${finalChallenge.description}`;

	// Post the final challenge and generate the challenge image
	const [{ ts: finalTs }, fileId] = await Promise.all([
		postSlackMessage({
			channel: channelId,
			text: `${finalText}\n\n_Generating challenge image…_ :thinking_face:`,
			thread_ts: ts,
			reply_broadcast: true,
		}),
		generateChallengeImage(channelId, ts, finalChallenge),
	]);

	// Update the final challenge message to remove the "generating challenge image" message
	await updateSlackMessage({
		channel: channelId,
		ts: finalTs,
		text: finalText,
	});

	// Broadcast the challenge image to the thread
	await broadcastChallengeImage(channelId, ts, fileId);
}
