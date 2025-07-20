import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getAllPlayers } from '@/services/player/playerQueryService';
import { Player } from '@/lib/mockData';

const PlayerLoadTest: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testLoadPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🧪 Testing player load...');
      const result = await getAllPlayers({ status: 'approved' });
      console.log('🧪 Test result:', result);
      setPlayers(result);
    } catch (err) {
      console.error('🧪 Test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
      <h3 className="font-bold mb-2">Player Load Test</h3>
      <Button onClick={testLoadPlayers} disabled={loading}>
        {loading ? 'Loading...' : 'Test Load Players'}
      </Button>

      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}

      {players.length > 0 && (
        <div className="mt-2">
          <p className="font-medium">Loaded {players.length} players:</p>
          <ul className="text-sm">
            {players.slice(0, 5).map((player) => (
              <li key={player.id}>
                {player.name} - {player.rating || 'Unrated'}
              </li>
            ))}
            {players.length > 5 && <li>... and {players.length - 5} more</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlayerLoadTest;
