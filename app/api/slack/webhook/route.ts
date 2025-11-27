import { z } from "zod";
import { slackMessageHook } from "@/workflows/create";

const slackMessageSchema = z.object({
	event: z.object({
		type: z.literal("message"),
		channel: z.string(),
		thread_ts: z.string(),
		text: z.string(),
		ts: z.string(),
		bot_id: z.string().optional(),
	}),
});

export async function POST(req: Request) {
	const body = await req.json();

	console.log(body);

	// Slack Events API URL Verification
	if (body.type === "url_verification") {
		return new Response(body.challenge, {
			headers: {
				"Content-Type": "text/plain",
			},
		});
	}

	// TODO: validate webhook body
	// https://api.slack.com/authentication/verifying-requests-from-slack

	const parsedBody = slackMessageSchema.safeParse(body);
	if (parsedBody.success) {
		const { channel, thread_ts, bot_id } = parsedBody.data.event;
		if (bot_id) {
			console.log(`Ignoring bot message`);
		} else {
			const token = `slack-message-webhook:${channel}:${thread_ts}`;
			try {
				const hook = await slackMessageHook.resume(token, parsedBody.data.event);
				if (hook) {
					console.log(`Hook resumed for token: ${token} (${hook.runId})`);
				} else {
					console.log(`No hook found for token: ${token}`);
				}
			} catch (error) {
				console.log(`Failed to resume hook for token: ${token}`, error);
			}
		}
	}

	return new Response("OK");
}
