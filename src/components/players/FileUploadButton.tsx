import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import { Player } from '@/lib/mockData';
import {
  FLOOR_RATING,
  RATING_BONUS,
  PROVISIONAL_GAMES_REQUIRED,
} from '@/utils/nigerianChessRating';

export interface FileUploadButtonProps {
  onFileUpload?: (players: any[]) => void;
  onPlayersImported?: (players: Partial<Player>[]) => void;
  buttonText?: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileUpload,
  onPlayersImported,
  buttonText = 'Select Excel File',
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateNcrId = () => {
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `NCR${randomPart}`;
  };

  const processExcelFile = (file: File) => {
    setIsLoading(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;

        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = data as string;
          const rows = text.split('\n').map((line) => line.split(','));

          if (rows.length <= 1) {
            setError('The uploaded CSV file does not contain any data');
            setIsLoading(false);
            return;
          }

          processFileData(rows);
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        });

        if (jsonData.length <= 1) {
          setError('The uploaded file does not contain any data');
          setIsLoading(false);
          return;
        }

        processFileData(jsonData as string[][]);
      } catch (error) {
        console.error('Error processing file:', error);
        setError(
          'Failed to process the uploaded file. Please check the format.'
        );
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read the uploaded file');
      setIsLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  const processFileData = (rows: string[][]) => {
    try {
      const headers = rows[0].map((h) => String(h).trim().toLowerCase());

      const findHeaderIndex = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          const index = headers.findIndex((header) =>
            header.includes(name.toLowerCase())
          );
          if (index !== -1) return index;
        }
        return -1;
      };

      const nameIndex = findHeaderIndex([
        'player',
        'players',
        'name',
        'fullname',
        'full name',
      ]);
      const titleIndex = findHeaderIndex(['title', 'titles']);
      const classicalRatingIndex = findHeaderIndex([
        'std',
        'standard',
        'classical',
        'fide',
        'rating',
      ]);
      const rapidRatingIndex = findHeaderIndex(['rpd', 'rapid']);
      const blitzRatingIndex = findHeaderIndex(['blz', 'blitz']);
      const birthYearIndex = findHeaderIndex([
        'b-year',
        'byear',
        'birth year',
        'birthyear',
        'year',
      ]);
      const fideIdIndex = findHeaderIndex([
        'fide id',
        'fideid',
        'fide_id',
        'id',
      ]);

      if (nameIndex === -1) {
        setError(
          "Could not find a column for player names. Please include a column with 'Name', 'Player', or 'Full Name' in the header."
        );
        setIsLoading(false);
        return;
      }

      const processedPlayers: Partial<Player>[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        if (!row.length || (nameIndex !== -1 && !row[nameIndex])) {
          continue;
        }

        let playerName = nameIndex !== -1 ? row[nameIndex] : '';

        if (!playerName || playerName.toString().trim() === '') {
          continue;
        }

        const ncrId = generateNcrId();

        // Generate a default email if none is provided (required by createPlayer)
        const defaultEmail = `${playerName.toString().trim().toLowerCase().replace(/\s+/g, '.')}@ncr.temp`;

        const player: Partial<Player> = {
          name: playerName.toString().trim(),
          email: defaultEmail, // Use default email instead of empty string
          state: '', // Will be updated manually
          gender: 'M', // Default, will be updated manually
          phone: '',
          gamesPlayed: 30, // Players with all 3 ratings have played 30 games (met provisional requirements)
          status: 'approved',
          fideId: ncrId, // Store NCR ID in fide_id field instead of id
        };

        // Handle title
        if (titleIndex !== -1 && row[titleIndex]) {
          const titleValue = row[titleIndex].toString().trim();
          const validTitles = [
            'GM',
            'IM',
            'FM',
            'CM',
            'WGM',
            'WIM',
            'WFM',
            'WCM',
          ];
          if (validTitles.includes(titleValue)) {
            player.title = titleValue as
              | 'GM'
              | 'IM'
              | 'FM'
              | 'CM'
              | 'WGM'
              | 'WIM'
              | 'WFM'
              | 'WCM';
            player.titleVerified = true;
          }
        }

        // Handle FIDE ID - if there's a FIDE ID in the file, use it; otherwise use the generated NCR ID
        if (fideIdIndex !== -1 && row[fideIdIndex]) {
          const fideIdValue = row[fideIdIndex].toString().trim();
          if (fideIdValue && fideIdValue !== '') {
            player.fideId = fideIdValue; // Use actual FIDE ID from file
          } else {
            player.fideId = ncrId; // Use generated NCR ID as fallback
          }
        } else {
          player.fideId = ncrId; // Use generated NCR ID when no FIDE ID in file
        }

        // Apply Nigerian Chess Rating logic for rating processing
        const processRatingFromExcel = (
          rawRating: string | undefined,
          ratingType: string
        ): { rating: number; games: number } => {
          if (!rawRating) {
            console.log(
              `🔧 No ${ratingType} rating in Excel, using floor rating`
            );
            return { rating: FLOOR_RATING, games: 0 };
          }

          const parsedRating = parseInt(rawRating.toString(), 10);
          if (isNaN(parsedRating)) {
            console.log(
              `🔧 Invalid ${ratingType} rating in Excel, using floor rating`
            );
            return { rating: FLOOR_RATING, games: 0 };
          }

          // Apply Nigerian Chess Rating upload logic
          if (parsedRating >= 900) {
            // Truly established rating (900+) gets +100 bonus
            const finalRating = parsedRating + RATING_BONUS;
            console.log(
              `🔧 ${ratingType}: ${parsedRating} + ${RATING_BONUS} = ${finalRating} (established)`
            );
            return { rating: finalRating, games: PROVISIONAL_GAMES_REQUIRED };
          } else if (parsedRating >= 801) {
            // Ratings 801-899 are problematic, convert to floor rating
            console.log(
              `🔧 ${ratingType}: ${parsedRating} → ${FLOOR_RATING} (problematic rating converted to floor)`
            );
            return { rating: FLOOR_RATING, games: 0 };
          } else {
            // Ratings 800 or below are floor ratings
            console.log(
              `🔧 ${ratingType}: ${parsedRating} → ${FLOOR_RATING} (floor rating)`
            );
            return { rating: FLOOR_RATING, games: 0 };
          }
        };

        // Handle classical rating
        const classicalResult = processRatingFromExcel(
          classicalRatingIndex !== -1 ? row[classicalRatingIndex] : undefined,
          'Classical'
        );
        player.rating = classicalResult.rating;
        player.gamesPlayed = classicalResult.games;

        // Handle rapid rating
        const rapidResult = processRatingFromExcel(
          rapidRatingIndex !== -1 ? row[rapidRatingIndex] : undefined,
          'Rapid'
        );
        player.rapidRating = rapidResult.rating;
        player.rapidGamesPlayed = rapidResult.games;

        // Handle blitz rating
        const blitzResult = processRatingFromExcel(
          blitzRatingIndex !== -1 ? row[blitzRatingIndex] : undefined,
          'Blitz'
        );
        player.blitzRating = blitzResult.rating;
        player.blitzGamesPlayed = blitzResult.games;

        // Handle birth year
        if (birthYearIndex !== -1 && row[birthYearIndex]) {
          const birthYear = parseInt(row[birthYearIndex].toString(), 10);
          if (!isNaN(birthYear)) {
            player.birthYear = birthYear;
          }
        }

        // Add created_at timestamp
        player.created_at = new Date().toISOString();

        processedPlayers.push(player);
      }

      if (processedPlayers.length === 0) {
        setError('No valid players found in the uploaded file');
        setIsLoading(false);
        return;
      }

      // Sort players by classical rating (highest first) for stable ranking
      const sortedPlayers = processedPlayers.sort((a, b) => {
        const ratingA = a.rating || 900;
        const ratingB = b.rating || 900;
        return ratingB - ratingA; // Descending order
      });

      console.log(
        '📤 FileUpload: Processed players sorted by rating:',
        sortedPlayers.map((p) => `${p.name}: ${p.rating}`)
      );

      console.log(
        '📋 FileUpload: Full player data being passed to import:',
        sortedPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          status: p.status,
          rating: p.rating,
        }))
      );

      const formattedPlayers = sortedPlayers.map((player) => ({
        id: player.id,
        name: player.name,
        rating: player.rating || 900,
        state: '',
        gender: 'M',
        title: player.title || '',
        rapid_rating: player.rapidRating,
        blitz_rating: player.blitzRating,
        fide_id: player.fideId,
      }));

      if (onFileUpload) {
        onFileUpload(formattedPlayers);
      }

      if (onPlayersImported) {
        console.log(
          '🚀 FileUpload: Calling onPlayersImported with',
          sortedPlayers.length,
          'players'
        );
        console.log(
          '📋 FileUpload: First few players being sent:',
          sortedPlayers.slice(0, 3).map((p) => ({
            name: p.name,
            email: p.email,
            rating: p.rating,
            fideId: p.fideId,
          }))
        );
        onPlayersImported(sortedPlayers);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Failed to process the uploaded file. Please check the format.');
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setError(
        'Please upload an Excel file (.xlsx or .xls) or CSV file (.csv)'
      );
      e.target.value = ''; // Reset file input
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      e.target.value = ''; // Reset file input
      return;
    }

    processExcelFile(file);
    e.target.value = ''; // Reset file input after processing
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
        <Upload className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-4">
          Upload FIDE player list Excel or CSV file. Required: Player Name.
          Optional: Title, Classical/Rapid/Blitz ratings, Birth Year, FIDE ID.
          <br />
          <strong>Note:</strong> Players will be ranked by Classical rating
          (highest first). State and Gender will be updated manually by the
          rating officer.
        </p>

        <input
          type="file"
          id="player-upload"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        <label htmlFor="player-upload">
          <Button
            type="button"
            disabled={isLoading}
            className="cursor-pointer"
            asChild
          >
            <span>
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                buttonText
              )}
            </span>
          </Button>
        </label>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FileUploadButton;
