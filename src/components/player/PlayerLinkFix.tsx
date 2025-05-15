
import React from "react";
import { Link } from "react-router-dom";

interface PlayerLinkProps {
  playerId: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A simple wrapper component that ensures player links always point to the correct route
 */
const PlayerLink: React.FC<PlayerLinkProps> = ({ playerId, className, children }) => {
  // Ensure we are using the correct route format: /players/:id
  return (
    <Link to={`/players/${playerId}`} className={className}>
      {children}
    </Link>
  );
};

export default PlayerLink;
