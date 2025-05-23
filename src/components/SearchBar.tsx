
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react"; // Added Loader2
// import { players } from "@/lib/mockData"; // Removed mockData import
import { Player } from "@/lib/mockData"; // Kept Player type import
import { getAllPlayersFromSupabase } from "@/services/playerService"; // Added Supabase service import

interface SearchBarProps {
  onSearch?: (query: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string; // Add placeholder prop
}

const SearchBar = ({ onSearch, value, onChange, placeholder = "Search players" }: SearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || "");
  const [searchResults, setSearchResults] = useState<Player[]>([]); // Use Player[] type
  const [allPlayersCache, setAllPlayersCache] = useState<Player[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSearchQuery(value);
    }
  }, [value]);

  // Fetch players when search bar opens and cache is empty
  useEffect(() => {
    if (isOpen && !allPlayersCache) {
      const fetchPlayers = async () => {
        setIsLoading(true);
        try {
          const fetchedPlayers = await getAllPlayersFromSupabase({});
          setAllPlayersCache(fetchedPlayers);
        } catch (error) {
          console.error("Failed to fetch players for search bar:", error);
          // Optionally set an error state or toast
        } finally {
          setIsLoading(false);
        }
      };
      fetchPlayers();
    }
  }, [isOpen, allPlayersCache]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter players from cache based on search query
  useEffect(() => {
    if (searchQuery.length >= 2 && allPlayersCache) {
      const query = searchQuery.toLowerCase();
      const results = allPlayersCache.filter(
        player =>
          player.name.toLowerCase().includes(query) ||
          (player.title?.toLowerCase().includes(query) || false)
      ).slice(0, 5); // Limit results to 5
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }

    if (onSearch) {
      onSearch(searchQuery);
    }
    
    if (onChange && value !== searchQuery) {
      onChange(searchQuery);
    }
  }, [searchQuery, allPlayersCache, onSearch, onChange, value]);

  const handleSearchClick = () => {
    setIsOpen(true);
  };

  const handleCloseClick = () => {
    setIsOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    // Do not clear allPlayersCache here, keep it for subsequent opens
    if (onChange) {
      onChange("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      const player = searchResults[0];
      navigate(`/players/${player.id}`); // Corrected navigation path
      handleCloseClick();
    }
  };

  const handlePlayerClick = (playerId: string) => {
    navigate(`/players/${playerId}`); // Corrected navigation path
    handleCloseClick();
  };

  return (
    <div className="relative">
      {!isOpen ? (
        <button
          onClick={handleSearchClick}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white focus:outline-none"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      ) : (
        <div className="absolute right-0 top-0 w-80 z-10 animate-fade-in"> {/* Consider adjusting width or making it responsive */}
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
                <Search className="h-5 w-5 ml-3 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder={placeholder}
                  className="w-full p-3 bg-transparent focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-400"/>}
                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none shrink-0"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </form>
            
            {!isLoading && searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto py-1">
                {searchResults.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerClick(player.id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800"
                  >
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {player.title && (
                            <span className="text-gold-dark dark:text-gold-light mr-1">
                              {player.title}
                            </span>
                          )}
                          {player.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Rating: {player.rating}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {!isLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No players found matching "{searchQuery}".
              </div>
            )}
             {isLoading && !allPlayersCache && ( // Show initial loading for cache fill
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-5 w-5 mx-auto animate-spin mb-2"/>
                Loading players...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
