import { describe, it, expect, vi } from 'vitest';
import { generateChallengePiece } from '../workflows/steps/generate-challenge-piece';
import { generateText } from 'ai';

vi.mock('ai', () => ({
    generateText: vi.fn(),
    Output: {
        object: vi.fn((config) => config),
    },
}));

describe('generateChallengePiece', () => {
    it('should call generateText with correct parameters', async () => {
        const mockMessages = [{ role: 'user', content: 'test' }];
        const mockModel = 'test-model';
        const mockOutput = {
            done: false,
            encouragement: 'Keep going!',
        };

        (generateText as any).mockResolvedValue({
            experimental_output: mockOutput,
        });

        const result = await generateChallengePiece(mockMessages as any, mockModel);

        expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
            model: mockModel,
            messages: mockMessages,
            experimental_telemetry: { isEnabled: true },
        }));
        expect(result).toEqual(mockOutput);
    });
});
