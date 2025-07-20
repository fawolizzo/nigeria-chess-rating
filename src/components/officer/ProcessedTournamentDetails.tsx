import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tournament } from '@/lib/mockData';
import { calculatePostRoundRatings } from '@/lib/ratingCalculation';

interface ProcessedTournamentDetailsProps {
  tournament: Tournament;
}

const ProcessedTournamentDetails: React.FC<ProcessedTournamentDetailsProps> = ({
  tournament,
}) => {
  // Placeholder data for demonstration
  const results = calculatePostRoundRatings(
    [
      { id: '1', name: 'Player A', rating: 1200 },
      { id: '2', name: 'Player B', rating: 1500 },
      { id: '3', name: 'Player C', rating: 1300 },
    ],
    []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Results</CardTitle>
        <CardDescription>
          Details of the rating changes after the tournament.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableCaption>
            Rating changes for each player in the tournament.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Player</TableHead>
              <TableHead>Rating Change</TableHead>
              <TableHead className="text-right">Initial Rating</TableHead>
              <TableHead className="text-right">Final Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.playerId}>
                <TableCell className="font-medium">{result.playerId}</TableCell>
                <TableCell>
                  <span
                    className={
                      result.ratingChange > 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }
                  >
                    {result.ratingChange > 0 ? '+' : ''}
                    {result.ratingChange}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-right">
                  {(result as any).initialRating || result.rating || 'N/A'}
                </TableCell>
                <TableCell className="font-mono text-right">
                  {(result as any).finalRating ||
                    (result.rating
                      ? result.rating + result.ratingChange
                      : 'N/A')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProcessedTournamentDetails;
