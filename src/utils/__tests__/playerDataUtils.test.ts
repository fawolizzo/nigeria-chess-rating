import { initializePlayerData } from '@/lib/playerDataUtils';
import { FLOOR_RATING } from '@/lib/ratingCalculation';

describe('initializePlayerData', () => {
  it('initializes missing fields with default values', () => {
    const input = { id: 'P1', name: 'Test Player' } as any;
    const result = initializePlayerData(input)!;

    expect(result.rating).toBe(FLOOR_RATING);
    expect(result.tournamentResults).toEqual([]);
    expect(result.ratingHistory).toHaveLength(1);
    expect(result.ratingHistory[0].rating).toBe(FLOOR_RATING);
    expect(result.rapidRating).toBe(FLOOR_RATING);
    expect(result.blitzRating).toBe(FLOOR_RATING);
  });

  it('enforces FLOOR_RATING when provided rating is falsy', () => {
    const input = { id: 'P2', name: 'Low Rated', rating: 0 } as any;
    const result = initializePlayerData(input)!;

    expect(result.rating).toBe(FLOOR_RATING);
    expect(result.ratingHistory[0].rating).toBe(FLOOR_RATING);
  });
});
