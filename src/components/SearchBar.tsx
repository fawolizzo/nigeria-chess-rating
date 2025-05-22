import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Player } from "@/lib/mockData"; // Import only the type
import { getAllPlayersFromSupabase } from "@/services/playerService";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string; 
}

const SearchBar = ({ onSearch, value, onChange, placeholder = "Search players" }: SearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || "");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Fetch all players when the search bar is opened
  useEffect(() => {
    if (isOpen) {
      const fetchPlayers = async () => {
        const players = await getAllPlayersFromSupabase({});
        setAllPlayers(players);
      };
      fetchPlayers();
    }
  }, [isOpen]);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSearchQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length >= 2 && allPlayers.length > 0) {
      const query = searchQuery.toLowerCase();
      const results = allPlayers.filter(
        player =>
          player.name.toLowerCase().includes(query) ||
          (player.title?.toLowerCase().includes(query) || false)
      ).slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }

    if (onSearch) {
      onSearch(searchQuery);
    }
    
    // Call onChange prop if provided
    if (onChange && value !== searchQuery) {
      onChange(searchQuery);
    }
  }, [searchQuery, onSearch, onChange, value, allPlayers]);

  const handleSearchClick = () => {
    setIsOpen(true);
  };

  const handleCloseClick = () => {
    setIsOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    
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
      navigate(`/player/${player.id}`);
      handleCloseClick();
    }
  };

  const handlePlayerClick = (playerId: string) => {
    navigate(`/player/${playerId}`);
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
        <div className="absolute right-0 top-0 w-80 z-10 animate-fade-in">
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
                <Search className="h-5 w-5 ml-3 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder={placeholder}
                  className="w-full p-3 bg-transparent focus:outline-none text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </form>
            
            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto py-1">
                <div className="py-1">
                  {searchResults.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerClick(player.id)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
                    >
                      <div className="flex items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
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
              </div>
            )}
            
            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No players found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
