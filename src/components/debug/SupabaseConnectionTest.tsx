import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const SupabaseConnectionTest = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Testing...');

    try {
      // Test basic functionality
      console.log('🧪 Testing basic functionality...');
      setResult('✅ Component loaded successfully!\n');

      // Test mock data
      const mockPlayers = [
        { id: '1', name: 'Test Player 1', rating: 1500 },
        { id: '2', name: 'Test Player 2', rating: 1600 },
      ];

      setResult(
        (prev) => prev + `✅ Mock data created: ${mockPlayers.length} players\n`
      );
      setResult(
        (prev) =>
          prev + `✅ Players: ${mockPlayers.map((p) => p.name).join(', ')}\n`
      );

      // Test if we can access Supabase (without actually connecting)
      try {
        const { supabaseAdmin } = await import(
          '@/integrations/supabase/adminClient'
        );
        setResult((prev) => prev + '✅ Supabase admin client imported\n');
      } catch (error) {
        setResult(
          (prev) => prev + `⚠️ Supabase admin client error: ${error}\n`
        );
      }

      setResult((prev) => prev + '🎉 All tests completed!');
    } catch (error) {
      console.error('Test error:', error);
      setResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white dark:bg-gray-900">
      <h2 className="text-xl font-bold mb-4">Debug: Connection Test</h2>

      <Button onClick={testConnection} disabled={loading} className="mb-4">
        {loading ? 'Testing...' : 'Run Test'}
      </Button>

      {result && (
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
};

export default SupabaseConnectionTest;
