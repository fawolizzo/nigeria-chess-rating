
import React from "react";
import { Loader2 } from "lucide-react";

const PlayerProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-nigeria-green animate-spin mb-4" />
        <div className="text-lg font-medium">Loading Player Profile...</div>
      </div>
    </div>
  );
};

export default PlayerProfileSkeleton;
