import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { PairingsPDF } from '../components/PairingsPDF';
import { StandingsPDF } from '../components/StandingsPDF';

interface Player {
  id: string;
  full_name: string;
  state: string | null;
}

interface Pairing {
  id: string;
  board_number: number;
  white_player: Player;
  black_player: Player | null;
  result: string | null;
}

interface Round {
  id: string;
  number: number;
  status: string;
  pairings: Pairing[];
}

interface Standing {
  rank: number;
  player_id: string;
  player_name: string;
  score: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  seed_rating: number;
}

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  state: string;
  format: string;
  status: string;
}

export class PDFExportService {
  /**
   * Export pairings for a specific round as PDF
   */
  static async exportPairings(
    tournament: Tournament,
    round: Round,
    options?: {
      filename?: string;
    }
  ): Promise<void> {
    try {
      const doc = PairingsPDF({ tournament, round });
      const blob = await pdf(doc).toBlob();

      const filename =
        options?.filename ||
        `${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_Round_${round.number}_Pairings.pdf`;

      saveAs(blob, filename);
    } catch (error) {
      console.error('Error generating pairings PDF:', error);
      throw new Error('Failed to generate pairings PDF');
    }
  }

  /**
   * Export tournament standings as PDF
   */
  static async exportStandings(
    tournament: Tournament,
    standings: Standing[],
    options?: {
      filename?: string;
      currentRound?: number;
    }
  ): Promise<void> {
    try {
      const doc = StandingsPDF({
        tournament,
        standings,
        currentRound: options?.currentRound,
      });
      const blob = await pdf(doc).toBlob();

      const filename =
        options?.filename ||
        `${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_Standings.pdf`;

      saveAs(blob, filename);
    } catch (error) {
      console.error('Error generating standings PDF:', error);
      throw new Error('Failed to generate standings PDF');
    }
  }

  /**
   * Generate PDF blob without downloading (for preview or server upload)
   */
  static async generatePairingsBlob(
    tournament: Tournament,
    round: Round
  ): Promise<Blob> {
    try {
      const doc = PairingsPDF({ tournament, round });
      return await pdf(doc).toBlob();
    } catch (error) {
      console.error('Error generating pairings blob:', error);
      throw new Error('Failed to generate pairings PDF blob');
    }
  }

  /**
   * Generate PDF blob without downloading (for preview or server upload)
   */
  static async generateStandingsBlob(
    tournament: Tournament,
    standings: Standing[],
    currentRound?: number
  ): Promise<Blob> {
    try {
      const doc = StandingsPDF({ tournament, standings, currentRound });
      return await pdf(doc).toBlob();
    } catch (error) {
      console.error('Error generating standings blob:', error);
      throw new Error('Failed to generate standings PDF blob');
    }
  }

  /**
   * Validate tournament data before PDF generation
   */
  static validateTournamentData(tournament: Tournament): boolean {
    return !!(
      tournament.id &&
      tournament.name &&
      tournament.start_date &&
      tournament.end_date &&
      tournament.city &&
      tournament.state
    );
  }

  /**
   * Validate round data before PDF generation
   */
  static validateRoundData(round: Round): boolean {
    return !!(
      round.id &&
      round.number &&
      round.pairings &&
      Array.isArray(round.pairings)
    );
  }

  /**
   * Validate standings data before PDF generation
   */
  static validateStandingsData(standings: Standing[]): boolean {
    return Array.isArray(standings) && standings.length > 0;
  }
}
