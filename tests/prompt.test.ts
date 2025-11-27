import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT, IMAGE_GEN_PROMPT } from '../lib/prompt';

describe('Prompts', () => {
    it('SYSTEM_PROMPT should return a string', () => {
        const prompt = SYSTEM_PROMPT();
        expect(typeof prompt).toBe('string');
        expect(prompt).toContain('You are a challenge generating bot');
        expect(prompt).toContain('IMPORTANT: You must ALWAYS return a valid JSON object.');
    });

    it('IMAGE_GEN_PROMPT should return a string with challenge details', () => {
        const challenge = {
            title: 'Test Challenge',
            description: 'This is a test challenge description.',
        };
        const prompt = IMAGE_GEN_PROMPT(challenge);
        expect(typeof prompt).toBe('string');
        expect(prompt).toContain('Test Challenge');
        expect(prompt).toContain('This is a test challenge description.');
    });
});
