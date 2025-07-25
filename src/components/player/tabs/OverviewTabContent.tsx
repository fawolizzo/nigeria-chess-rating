import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarIcon, Clock, MapPin, Trophy } from 'lucide-react';
import { Player, TournamentResult } from '@/lib/mockData';
import { format } from 'date-fns';
import {
  getRatingStatus,
  formatRatingDisplay,
  FLOOR_RATING,
} from '@/utils/nigerianChessRating';

interface OverviewTabContentProps {
  player: Player;
}

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    return dateString;
  }
};

const OverviewTabContent: React.FC<OverviewTabContentProps> = ({ player }) => {
  // Apply Nigerian Chess Rating logic for display
  const classicalRating = player.rating || FLOOR_RATING;
  const rapidRating = player.rapidRating || FLOOR_RATING;
  const blitzRating = player.blitzRating || FLOOR_RATING;

  const classicalGames = player.gamesPlayed || 0;
  const rapidGames = player.rapidGamesPlayed || 0;
  const blitzGames = player.blitzGamesPlayed || 0;

  const classicalStatus = getRatingStatus(classicalRating, classicalGames);
  const rapidStatus = getRatingStatus(rapidRating, rapidGames);
  const blitzStatus = getRatingStatus(blitzRating, blitzGames);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Classical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{classicalRating}</div>
            <div className="flex items-center mt-1">
              <Badge
                variant={
                  classicalStatus === 'established'
                    ? 'default'
                    : classicalStatus === 'unrated'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {classicalStatus === 'unrated'
                  ? 'Floor Rating'
                  : classicalStatus === 'established'
                    ? 'Established'
                    : 'Provisional'}
              </Badge>
              <span className="text-sm text-muted-foreground ml-2">
                {classicalGames} games
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rapid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rapidRating}</div>
            <div className="flex items-center mt-1">
              <Badge
                variant={
                  rapidStatus === 'established'
                    ? 'default'
                    : rapidStatus === 'unrated'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {rapidStatus === 'unrated'
                  ? 'Floor Rating'
                  : rapidStatus === 'established'
                    ? 'Established'
                    : 'Provisional'}
              </Badge>
              <span className="text-sm text-muted-foreground ml-2">
                {rapidGames} games
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Blitz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{blitzRating}</div>
            <div className="flex items-center mt-1">
              <Badge
                variant={
                  blitzStatus === 'established'
                    ? 'default'
                    : blitzStatus === 'unrated'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {blitzStatus === 'unrated'
                  ? 'Floor Rating'
                  : blitzStatus === 'established'
                    ? 'Established'
                    : 'Provisional'}
              </Badge>
              <span className="text-sm text-muted-foreground ml-2">
                {blitzGames} games
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Full Name
              </dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">
                {player.name}
              </dd>
            </div>

            {player.birthYear && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Birth Year
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {player.birthYear}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Gender
              </dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">
                {player.gender === 'M' ? 'Male' : 'Female'}
              </dd>
            </div>

            {player.state && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  State
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {player.state}
                </dd>
              </div>
            )}

            {player.club && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Club
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {player.club}
                </dd>
              </div>
            )}

            {player.title && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Title
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {player.title}
                  {player.titleVerified && (
                    <span className="ml-2 text-blue-500">✓ Verified</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tournaments</CardTitle>
        </CardHeader>
        <CardContent>
          {player.tournamentResults && player.tournamentResults.length > 0 ? (
            <div className="space-y-4">
              {player.tournamentResults.slice(0, 3).map((result, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 border rounded-lg"
                >
                  <div className="mr-4 mt-1">
                    <Trophy className="h-5 w-5 text-nigeria-green" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {result.tournamentName || 'Tournament'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>
                          {result.date ? formatDate(result.date) : 'No date'}
                        </span>
                      </div>
                      {result.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{result.location}</span>
                        </div>
                      )}
                      {result.format && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="capitalize">{result.format}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className="mr-2">
                        Score: {result.score || 'N/A'}/
                        {result.gamesPlayed || 'N/A'}
                      </Badge>
                      <Badge variant="outline">
                        Rating change: {result.ratingChange > 0 ? '+' : ''}
                        {result.ratingChange}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {player.tournamentResults.length > 3 && (
                <div className="text-center mt-4">
                  <span className="text-sm text-nigeria-green">
                    + {player.tournamentResults.length - 3} more tournaments
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No tournament history found for this player.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTabContent;
