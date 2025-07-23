import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, FileText, Trophy } from 'lucide-react';
import { PDFExportService } from '../services/pdfExportService';

interface Player {
  id: string;
  full_name: string;
  state: string | null;
}

interface Pairing {
  id: string;
  board_number: number;
  white_player: Player;
  black_player: Player | null;
  result: string | null;
}

interface Round {
  id: string;
  number: number;
  status: string;
  pairings: Pairing[];
}

interface Standing {
  rank: number;
  player_id: string;
  player_name: string;
  score: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  seed_rating: number;
}

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  state: string;
  format: string;
  status: string;
}

interface PDFExportButtonsProps {
  tournament: Tournament;
  rounds?: Round[];
  standings?: Standing[];
  currentRound?: number;
  className?: string;
}

export function PDFExportButtons({
  tournament,
  rounds = [],
  standings = [],
  currentRound,
  className = '',
}: PDFExportButtonsProps) {
  const [exportingPairings, setExportingPairings] = useState<number | null>(
    null
  );
  const [exportingStandings, setExportingStandings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportPairings = async (round: Round) => {
    if (
      !PDFExportService.validateTournamentData(tournament) ||
      !PDFExportService.validateRoundData(round)
    ) {
      setError('Invalid tournament or round data');
      return;
    }

    setExportingPairings(round.number);
    setError(null);

    try {
      await PDFExportService.exportPairings(tournament, round);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to export pairings'
      );
    } finally {
      setExportingPairings(null);
    }
  };

  const handleExportStandings = async () => {
    if (
      !PDFExportService.validateTournamentData(tournament) ||
      !PDFExportService.validateStandingsData(standings)
    ) {
      setError('Invalid tournament or standings data');
      return;
    }

    setExportingStandings(true);
    setError(null);

    try {
      await PDFExportService.exportStandings(tournament, standings, {
        currentRound,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to export standings'
      );
    } finally {
      setExportingStandings(false);
    }
  };

  const publishedRounds = rounds.filter(
    (round) => round.status === 'published' || round.status === 'completed'
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pairings Export */}
      {publishedRounds.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Export Pairings</h4>
          <div className="flex flex-wrap gap-2">
            {publishedRounds.map((round) => (
              <Button
                key={round.id}
                variant="outline"
                size="sm"
                onClick={() => handleExportPairings(round)}
                disabled={exportingPairings === round.number}
                className="flex items-center gap-2"
              >
                {exportingPairings === round.number ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                Round {round.number}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Standings Export */}
      {standings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Export Standings
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportStandings}
            disabled={exportingStandings}
            className="flex items-center gap-2"
          >
            {exportingStandings ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trophy className="h-3 w-3" />
            )}
            Current Standings
          </Button>
        </div>
      )}

      {publishedRounds.length === 0 && standings.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No data available for export</p>
          <p className="text-xs">
            Pairings and standings will be available once rounds are published
          </p>
        </div>
      )}
    </div>
  );
}

// Simplified version for quick access
interface QuickExportProps {
  tournament: Tournament;
  round?: Round;
  standings?: Standing[];
  type: 'pairings' | 'standings';
  size?: 'sm' | 'default' | 'lg';
}

export function QuickExportButton({
  tournament,
  round,
  standings,
  type,
  size = 'sm',
}: QuickExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      if (type === 'pairings' && round) {
        await PDFExportService.exportPairings(tournament, round);
      } else if (type === 'standings' && standings) {
        await PDFExportService.exportStandings(tournament, standings);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const isDisabled =
    exporting ||
    (type === 'pairings' && !round) ||
    (type === 'standings' && (!standings || standings.length === 0));

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleExport}
      disabled={isDisabled}
      className="flex items-center gap-2"
    >
      {exporting ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Download className="h-3 w-3" />
      )}
      Export PDF
    </Button>
  );
}
