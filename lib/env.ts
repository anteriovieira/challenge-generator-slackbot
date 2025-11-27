/**
 * Environment variable validation
 * Throws clear errors if required variables are missing
 */

export function validateEnv() {
    const required = {
        AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    };

    const missing: string[] = [];

    for (const [key, value] of Object.entries(required)) {
        if (!value) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        const error = `❌ Missing required environment variables: ${missing.join(', ')}
    
Please set these variables in your Vercel project settings:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the missing variables
5. Redeploy your application

For local development, add them to .env.local`;

        console.error(error);
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    console.log('✅ All required environment variables are set');
}

export const env = {
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY!,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
};
