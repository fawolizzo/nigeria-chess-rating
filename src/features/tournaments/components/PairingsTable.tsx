import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, Users, Clock } from 'lucide-react';
import { QuickExportButton } from '@/features/pdf/components/PDFExportButtons';

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
  created_at: string;
  pairings: Pairing[];
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

interface PairingsTableProps {
  rounds: Round[];
  tournamentStatus: string;
  tournament?: Tournament;
}

export function PairingsTable({
  rounds,
  tournamentStatus,
  tournament,
}: PairingsTableProps) {
  if (rounds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament Rounds
          </CardTitle>
          <CardDescription>No rounds have been generated yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              Rounds will appear here once the tournament is activated and
              pairings are generated.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getResultDisplay = (
    result: string | null,
    whitePlayer: Player,
    blackPlayer: Player | null
  ) => {
    if (!result) return '-';

    if (result === 'bye') return 'Bye';
    if (result === 'white_win') return `1-0 (${whitePlayer.full_name})`;
    if (result === 'black_win')
      return blackPlayer ? `0-1 (${blackPlayer.full_name})` : '0-1';
    if (result === 'draw') return '½-½';
    if (result === 'white_forfeit')
      return `0-1 (${whitePlayer.full_name} forfeit)`;
    if (result === 'black_forfeit')
      return blackPlayer ? `1-0 (${blackPlayer.full_name} forfeit)` : '1-0';
    if (result === 'double_forfeit') return '0-0 (Both forfeit)';

    return result;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {rounds.map((round) => (
        <Card key={round.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Round {round.number}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(round.status)}
                <Badge variant="outline">
                  {round.pairings.length}{' '}
                  {round.pairings.length === 1 ? 'Pairing' : 'Pairings'}
                </Badge>
                {tournament &&
                  (round.status === 'published' ||
                    round.status === 'completed') && (
                    <QuickExportButton
                      tournament={tournament}
                      round={round}
                      type="pairings"
                      size="sm"
                    />
                  )}
              </div>
            </CardTitle>
            <CardDescription>
              {round.status === 'published' &&
                'Pairings are published and games can begin'}
              {round.status === 'completed' &&
                'All games completed, results recorded'}
              {round.status === 'pending' && 'Round is being prepared'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {round.pairings.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pairings generated yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Board</TableHead>
                      <TableHead>White</TableHead>
                      <TableHead>Black</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {round.pairings.map((pairing) => (
                      <TableRow key={pairing.id}>
                        <TableCell className="font-medium">
                          {pairing.board_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {pairing.white_player.full_name}
                            </div>
                            {pairing.white_player.state && (
                              <div className="text-sm text-gray-500">
                                {pairing.white_player.state}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {pairing.black_player ? (
                            <div>
                              <div className="font-medium">
                                {pairing.black_player.full_name}
                              </div>
                              {pairing.black_player.state && (
                                <div className="text-sm text-gray-500">
                                  {pairing.black_player.state}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">Bye</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {getResultDisplay(
                              pairing.result,
                              pairing.white_player,
                              pairing.black_player
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
