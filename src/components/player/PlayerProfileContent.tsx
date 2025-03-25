
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from "@/lib/mockData";
import OverviewTabContent from "./tabs/OverviewTabContent";
import RatingTabContent from "./tabs/RatingTabContent";
import { 
  prepareRatingHistory, 
  calculateRatingChanges, 
  getCurrentRating, 
  getTournamentResults 
} from "./utils/ratingDataUtils";

interface PlayerProfileContentProps {
  player: Player;
}

const PlayerProfileContent: React.FC<PlayerProfileContentProps> = ({ player }) => {
  const [ratingFormat, setRatingFormat] = useState<"classical" | "rapid" | "blitz">("classical");
  
  const { history, statusLabel, gameCount } = prepareRatingHistory(player, ratingFormat);
  const ratingChanges = calculateRatingChanges(player, ratingFormat);
  const currentRating = getCurrentRating(player, ratingFormat);
  const tournamentResults = getTournamentResults(player, ratingFormat);
  
  return (
    <Tabs defaultValue="overview" className="w-full">
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
        {renderRatingTab("classical")}
      </TabsContent>
      
      <TabsContent value="rapid" className="space-y-6">
        {renderRatingTab("rapid")}
      </TabsContent>
      
      <TabsContent value="blitz" className="space-y-6">
        {renderRatingTab("blitz")}
      </TabsContent>
    </Tabs>
  );
  
  function renderRatingTab(format: "classical" | "rapid" | "blitz") {
    setRatingFormat(format);
    const currentRating = getCurrentRating(player, format);
    const { history, statusLabel, gameCount } = prepareRatingHistory(player, format);
    const ratingChanges = calculateRatingChanges(player, format);
    const tournamentResults = getTournamentResults(player, format);
    
    return (
      <RatingTabContent
        format={format}
        currentRating={currentRating}
        statusLabel={statusLabel}
        gameCount={gameCount}
        history={history}
        ratingChanges={ratingChanges}
        tournamentResults={tournamentResults}
      />
    );
  }
};

export default PlayerProfileContent;
