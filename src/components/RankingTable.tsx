// This file is read-only, so we'll need to create a wrapper component
// to fix the player URL path without modifying the original component

import React from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface PlayerLinkWrapperProps {
  playerId: string;
  children: React.ReactNode;
}

export const PlayerLinkWrapper: React.FC<PlayerLinkWrapperProps> = ({ playerId, children }) => {
  const { toast } = useToast();
  
  const handlePlayerClick = (e: React.MouseEvent) => {
    // We'll leave this empty for now as the Link component will handle the navigation
    // But we could add analytics or other logic here if needed
  };
  
  return (
    <Link to={`/players/${playerId}`} onClick={handlePlayerClick}>
      {children}
    </Link>
  );
};

export default PlayerLinkWrapper;
