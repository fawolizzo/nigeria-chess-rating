
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PlayerSearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const PlayerSearchInput = ({
  searchQuery,
  setSearchQuery,
}: PlayerSearchInputProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
      <Input
        placeholder="Search players by name, title, rating..."
        className="pl-10"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
          onClick={() => setSearchQuery("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default PlayerSearchInput;
