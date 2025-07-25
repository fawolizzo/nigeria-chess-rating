import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Player } from '@/lib/mockData';
import { FLOOR_RATING } from '@/lib/ratingCalculation';
import { BadgeCheck, AlertCircle } from 'lucide-react';

interface ResultRecorderProps {
  pairings: Array<{
    whiteId: string;
    blackId: string;
    result?: '1-0' | '0-1' | '1/2-1/2' | '*' | '1F-0' | '0-1F' | '0F-0F';
  }>;
  players: Player[];
  roundNumber: number;
  onSaveResults: (
    results: Array<{
      whiteId: string;
      blackId: string;
      result: '1-0' | '0-1' | '1/2-1/2' | '*' | '1F-0' | '0-1F' | '0F-0F';
    }>
  ) => void;
  tournamentType?: 'classical' | 'rapid' | 'blitz';
}

const ResultRecorder = ({
  pairings,
  players,
  roundNumber,
  onSaveResults,
  tournamentType = 'classical',
}: ResultRecorderProps) => {
  const [results, setResults] = useState<
    Array<{
      whiteId: string;
      blackId: string;
      result: '1-0' | '0-1' | '1/2-1/2' | '*' | '1F-0' | '0-1F' | '0F-0F';
    }>
  >(
    pairings.map((pair) => ({
      whiteId: pair.whiteId,
      blackId: pair.blackId,
      result: pair.result || '*',
    }))
  );

  useEffect(() => {
    // Update results when pairings change
    setResults(
      pairings.map((pair) => ({
        whiteId: pair.whiteId,
        blackId: pair.blackId,
        result: pair.result || '*',
      }))
    );
  }, [pairings]);

  const handleResultChange = (
    pairingIndex: number,
    newResult: '1-0' | '0-1' | '1/2-1/2' | '*' | '1F-0' | '0-1F' | '0F-0F'
  ) => {
    const newResults = [...results];
    newResults[pairingIndex] = {
      ...newResults[pairingIndex],
      result: newResult,
    };
    setResults(newResults);
  };

  const handleSave = () => {
    // Pass results to parent component
    onSaveResults(results);
  };

  const getPlayerById = (id: string) => {
    return players.find((p) => p.id === id);
  };

  // Function to get the appropriate rating based on tournament type
  const getPlayerRating = (player: Player) => {
    if (tournamentType === 'rapid') {
      return player.rapidRating ?? FLOOR_RATING;
    } else if (tournamentType === 'blitz') {
      return player.blitzRating ?? FLOOR_RATING;
    }
    return player.rating;
  };

  // Function to get the appropriate rating status based on tournament type
  const getPlayerRatingStatus = (player: Player) => {
    if (tournamentType === 'rapid') {
      return player.rapidRatingStatus ?? 'provisional';
    } else if (tournamentType === 'blitz') {
      return player.blitzRatingStatus ?? 'provisional';
    }
    return player.ratingStatus ?? 'provisional';
  };

  // Function to get the games played count based on tournament type
  const getPlayerGamesPlayed = (player: Player) => {
    if (tournamentType === 'rapid') {
      return player.rapidGamesPlayed ?? 0;
    } else if (tournamentType === 'blitz') {
      return player.blitzGamesPlayed ?? 0;
    }
    return player.gamesPlayed ?? 0;
  };

  return (
    <Card className="border-nigeria-green/30">
      <CardHeader className="bg-gradient-to-r from-nigeria-green/5 to-transparent">
        <CardTitle className="text-nigeria-green-dark text-2xl font-bold text-center">
          Round {roundNumber} Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4">
                {results.map((pairing, index) => {
                  const whitePlayer = getPlayerById(pairing.whiteId);
                  const blackPlayer = getPlayerById(pairing.blackId);

                  if (!whitePlayer || !blackPlayer) return null;

                  const whiteRating = getPlayerRating(whitePlayer);
                  const blackRating = getPlayerRating(blackPlayer);
                  const whiteRatingStatus = getPlayerRatingStatus(whitePlayer);
                  const blackRatingStatus = getPlayerRatingStatus(blackPlayer);

                  return (
                    <div
                      key={index}
                      className="border border-nigeria-green/20 rounded-md p-4 hover:bg-nigeria-green/5 transition-colors"
                    >
                      <div className="grid grid-cols-11 items-center">
                        {/* White Player - 5 cols */}
                        <div className="col-span-5">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center justify-end">
                              {whitePlayer.title && (
                                <span className="text-gold-dark dark:text-gold-light mr-1 font-semibold">
                                  {whitePlayer.title}
                                </span>
                              )}
                              <span className="font-bold text-right">
                                {whitePlayer.name}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <span className="font-medium">
                                White • {whiteRating}
                              </span>
                              {whiteRatingStatus === 'established' ? (
                                <BadgeCheck
                                  size={14}
                                  className="text-green-600"
                                />
                              ) : (
                                <span className="inline-flex items-center ml-1 text-amber-600 text-xs">
                                  <AlertCircle size={12} className="mr-0.5" />
                                  {getPlayerGamesPlayed(whitePlayer)}/30
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* VS - 1 col */}
                        <div className="col-span-1 flex justify-center">
                          <div className="bg-nigeria-green/10 rounded-full w-8 h-8 flex items-center justify-center text-nigeria-green-dark font-medium text-sm">
                            vs
                          </div>
                        </div>

                        {/* Black Player - 5 cols */}
                        <div className="col-span-5">
                          <div className="flex flex-col items-start">
                            <div className="flex items-center">
                              {blackPlayer.title && (
                                <span className="text-gold-dark dark:text-gold-light mr-1 font-semibold">
                                  {blackPlayer.title}
                                </span>
                              )}
                              <span className="font-bold">
                                {blackPlayer.name}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <span className="font-medium">
                                Black • {blackRating}
                              </span>
                              {blackRatingStatus === 'established' ? (
                                <BadgeCheck
                                  size={14}
                                  className="text-green-600"
                                />
                              ) : (
                                <span className="inline-flex items-center ml-1 text-amber-600 text-xs">
                                  <AlertCircle size={12} className="mr-0.5" />
                                  {getPlayerGamesPlayed(blackPlayer)}/30
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Result Selector - Full width below the players */}
                        <div className="col-span-11 mt-3">
                          <Select
                            value={pairing.result}
                            onValueChange={(value) =>
                              handleResultChange(
                                index,
                                value as
                                  | '1-0'
                                  | '0-1'
                                  | '1/2-1/2'
                                  | '*'
                                  | '1F-0'
                                  | '0-1F'
                                  | '0F-0F'
                              )
                            }
                          >
                            <SelectTrigger className="border-nigeria-green/30 focus:ring-nigeria-green/30 w-full md:w-52 mx-auto">
                              <SelectValue placeholder="Select result" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="*">Not played</SelectItem>
                              <SelectItem value="1-0">
                                1-0 (White wins)
                              </SelectItem>
                              <SelectItem value="0-1">
                                0-1 (Black wins)
                              </SelectItem>
                              <SelectItem value="1/2-1/2">
                                ½-½ (Draw)
                              </SelectItem>
                              <SelectItem value="1F-0">
                                1F-0 (White wins by forfeit)
                              </SelectItem>
                              <SelectItem value="0-1F">
                                0-1F (Black wins by forfeit)
                              </SelectItem>
                              <SelectItem value="0F-0F">
                                0F-0F (Double forfeit)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleSave}
                  className="bg-nigeria-green hover:bg-nigeria-green-dark px-8 py-2 text-lg"
                >
                  Save Results
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No pairings available for this round.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultRecorder;
