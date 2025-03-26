
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from "@/lib/mockData";
import OverviewTabContent from "./tabs/OverviewTabContent";
import { format } from "date-fns";
import RatingTabContent from "./tabs/RatingTabContent";

interface NewPlayerProfileContentProps {
  player: Player;
}

const NewPlayerProfileContent: React.FC<NewPlayerProfileContentProps> = ({ player }) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Prepare rating data directly in the component
  const prepareRatingData = (format: "classical" | "rapid" | "blitz") => {
    let history = [];
    let statusLabel = "Provisional";
    let gameCount = 0;
    let currentRating = 0;
    
    if (format === "classical") {
      history = player.ratingHistory?.map(entry => ({
        date: entry.date ? new Date(entry.date).toLocaleDateString() : "Unknown",
        rating: entry.rating
      })) || [];
      statusLabel = player.ratingStatus || "Provisional";
      gameCount = player.gamesPlayed || 0;
      currentRating = player.rating || 0;
    } else if (format === "rapid") {
      history = player.rapidRatingHistory?.map(entry => ({
        date: entry.date ? new Date(entry.date).toLocaleDateString() : "Unknown",
        rating: entry.rating
      })) || [];
      statusLabel = player.rapidRatingStatus || "Provisional";
      gameCount = player.rapidGamesPlayed || 0;
      currentRating = player.rapidRating || 0;
    } else if (format === "blitz") {
      history = player.blitzRatingHistory?.map(entry => ({
        date: entry.date ? new Date(entry.date).toLocaleDateString() : "Unknown",
        rating: entry.rating
      })) || [];
      statusLabel = player.blitzRatingStatus || "Provisional";
      gameCount = player.blitzGamesPlayed || 0;
      currentRating = player.blitzRating || 0;
    }
    
    // Calculate rating changes
    const ratingChanges = [];
    if (history.length > 0) {
      for (let i = 0; i < history.length; i++) {
        let change = 0;
        if (i > 0) {
          change = history[i].rating - history[i-1].rating;
        }
        
        ratingChanges.push({
          date: history[i].date,
          rating: history[i].rating,
          change,
          reason: (player.ratingHistory && player.ratingHistory[i]?.reason) || "-"
        });
      }
    }
    
    // Filter tournament results for this format
    const tournamentResults = player.tournamentResults?.filter(result => {
      if (format === "rapid") return result.format === "rapid";
      if (format === "blitz") return result.format === "blitz";
      return result.format === "classical" || !result.format;
    }) || [];
    
    return {
      history,
      statusLabel,
      gameCount,
      ratingChanges,
      currentRating,
      tournamentResults
    };
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="w-full">
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
        {activeTab === "classical" && (
          <RatingTabContent
            format="classical"
            {...prepareRatingData("classical")}
          />
        )}
      </TabsContent>
      
      <TabsContent value="rapid" className="space-y-6">
        {activeTab === "rapid" && (
          <RatingTabContent
            format="rapid"
            {...prepareRatingData("rapid")}
          />
        )}
      </TabsContent>
      
      <TabsContent value="blitz" className="space-y-6">
        {activeTab === "blitz" && (
          <RatingTabContent
            format="blitz"
            {...prepareRatingData("blitz")}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default NewPlayerProfileContent;
