import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Player } from '@/lib/mockData';
import OverviewTabContent from './tabs/OverviewTabContent';
import { format } from 'date-fns';
import RatingTabContent from './tabs/RatingTabContent';
import {
  getRatingStatus,
  FLOOR_RATING,
  PROVISIONAL_GAMES_REQUIRED,
} from '@/utils/nigerianChessRating';

interface NewPlayerProfileContentProps {
  player: Player;
}

const NewPlayerProfileContent: React.FC<NewPlayerProfileContentProps> = ({
  player,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Prepare rating data using Nigerian Chess Rating logic
  const prepareRatingData = (timeFormat: 'classical' | 'rapid' | 'blitz') => {
    let history: { date: string; rating: number }[] = [];
    let statusLabel = '';
    let gameCount = 0;
    let currentRating = 0;

    if (timeFormat === 'classical') {
      history =
        player.ratingHistory?.map((entry) => ({
          date: entry.date
            ? format(new Date(entry.date), 'MMM yyyy')
            : 'Unknown',
          rating: entry.rating,
        })) || [];
      gameCount = player.gamesPlayed || 0;
      currentRating = player.rating || FLOOR_RATING;
      statusLabel = getRatingStatus(currentRating, gameCount);
    } else if (timeFormat === 'rapid') {
      history =
        player.rapidRatingHistory?.map((entry) => ({
          date: entry.date
            ? format(new Date(entry.date), 'MMM yyyy')
            : 'Unknown',
          rating: entry.rating,
        })) || [];
      gameCount = player.rapidGamesPlayed || 0;
      currentRating = player.rapidRating || FLOOR_RATING;
      statusLabel = getRatingStatus(currentRating, gameCount);
    } else if (timeFormat === 'blitz') {
      history =
        player.blitzRatingHistory?.map((entry) => ({
          date: entry.date
            ? format(new Date(entry.date), 'MMM yyyy')
            : 'Unknown',
          rating: entry.rating,
        })) || [];
      gameCount = player.blitzGamesPlayed || 0;
      currentRating = player.blitzRating || FLOOR_RATING;
      statusLabel = getRatingStatus(currentRating, gameCount);
    }

    // Calculate rating changes
    const ratingChanges = [];
    if (history.length > 0) {
      for (let i = 0; i < history.length; i++) {
        let change = 0;
        if (i > 0) {
          change = history[i].rating - history[i - 1].rating;
        }

        let reasonText = '-';
        if (
          timeFormat === 'classical' &&
          player.ratingHistory &&
          player.ratingHistory[i]?.reason
        ) {
          reasonText = player.ratingHistory[i].reason || '-';
        } else if (
          timeFormat === 'rapid' &&
          player.rapidRatingHistory &&
          player.rapidRatingHistory[i]?.reason
        ) {
          reasonText = player.rapidRatingHistory[i].reason || '-';
        } else if (
          timeFormat === 'blitz' &&
          player.blitzRatingHistory &&
          player.blitzRatingHistory[i]?.reason
        ) {
          reasonText = player.blitzRatingHistory[i].reason || '-';
        }

        ratingChanges.push({
          date: history[i].date,
          rating: history[i].rating,
          change,
          reason: reasonText,
        });
      }
    }

    // Filter tournament results for this format
    const tournamentResults = Array.isArray(player.tournamentResults)
      ? player.tournamentResults.filter((result) => {
          if (timeFormat === 'rapid') return result.format === 'rapid';
          if (timeFormat === 'blitz') return result.format === 'blitz';
          return result.format === 'classical' || !result.format;
        })
      : [];

    return {
      history,
      statusLabel,
      gameCount,
      ratingChanges,
      currentRating,
      tournamentResults,
    };
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Tabs
      defaultValue="overview"
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="classical">Classical</TabsTrigger>
        <TabsTrigger value="rapid">Rapid</TabsTrigger>
        <TabsTrigger value="blitz">Blitz</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTabContent player={player} />
      </TabsContent>

      <TabsContent value="classical" className="space-y-6">
        {activeTab === 'classical' && (
          <RatingTabContent
            format="classical"
            {...prepareRatingData('classical')}
          />
        )}
      </TabsContent>

      <TabsContent value="rapid" className="space-y-6">
        {activeTab === 'rapid' && (
          <RatingTabContent format="rapid" {...prepareRatingData('rapid')} />
        )}
      </TabsContent>

      <TabsContent value="blitz" className="space-y-6">
        {activeTab === 'blitz' && (
          <RatingTabContent format="blitz" {...prepareRatingData('blitz')} />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default NewPlayerProfileContent;
