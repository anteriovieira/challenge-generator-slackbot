import { waitUntil } from "@vercel/functions";
import { start } from "workflow/api";
import { createChallenge } from "@/workflows/create";

async function startChallengeCreation(formData: URLSearchParams) {
	console.log("Starting Challenge Creation workflow");
	const w = await start(createChallenge, [formData]);
	console.log(w);
}

export async function POST(req: Request) {
	const rawBody = await req.text();
	const formData = new URLSearchParams(rawBody);

	// We start the workflow in the background since
	// Slack expects a response immediately
	waitUntil(startChallengeCreation(formData));

	return new Response(`Let's create a challenge!`);
}
