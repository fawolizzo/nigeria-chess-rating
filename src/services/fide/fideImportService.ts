import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import FideService from './fideService';

export class FideImportService {
  /**
   * Import Nigerian players from FIDE into our Supabase database
   */
  static async importNigerianPlayersFromFide(): Promise<{
    imported: number;
    updated: number;
    errors: string[];
  }> {
    try {
      console.log('🚀 Starting FIDE import process...');

      // Fetch Nigerian players from FIDE
      const fideNigerianPlayers =
        await FideService.fetchNigerianPlayersFromFide();

      if (fideNigerianPlayers.length === 0) {
        throw new Error('No Nigerian players found in FIDE database');
      }

      console.log(
        `📊 Processing ${fideNigerianPlayers.length} Nigerian players from FIDE...`
      );

      let imported = 0;
      let updated = 0;
      const errors: string[] = [];

      // Process players in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < fideNigerianPlayers.length; i += batchSize) {
        const batch = fideNigerianPlayers.slice(i, i + batchSize);

        for (const fidePlayer of batch) {
          try {
            // Check if player already exists by FIDE ID
            const { data: existingPlayer, error: checkError } =
              await supabaseAdmin
                .from('players')
                .select('id, fide_id, rating')
                .eq('fide_id', fidePlayer.fide_id)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
              // PGRST116 is "not found" error, which is expected for new players
              throw checkError;
            }

            if (existingPlayer) {
              // Update existing player with latest FIDE data
              const { error: updateError } = await supabaseAdmin
                .from('players')
                .update({
                  name: fidePlayer.name,
                  title: fidePlayer.title,
                  rating: fidePlayer.rating,
                  rapid_rating: fidePlayer.rapid_rating,
                  blitz_rating: fidePlayer.blitz_rating,
                  birth_year: fidePlayer.birth_year,
                  gender: fidePlayer.gender,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingPlayer.id);

              if (updateError) throw updateError;

              updated++;
              console.log(
                `✅ Updated: ${fidePlayer.name} (${fidePlayer.fide_id})`
              );
            } else {
              // Insert new player
              const playerData = {
                name: fidePlayer.name,
                email: `${fidePlayer.fide_id}@fide.generated`, // Temporary email
                phone: null,
                fide_id: fidePlayer.fide_id,
                title: fidePlayer.title,
                title_verified: true, // FIDE titles are verified
                rating: fidePlayer.rating,
                rapid_rating: fidePlayer.rapid_rating,
                blitz_rating: fidePlayer.blitz_rating,
                state: null, // Will need to be filled manually or via additional data
                gender: fidePlayer.gender,
                status: fidePlayer.status,
                birth_year: fidePlayer.birth_year,
                games_played: 0, // Will be updated as tournaments are played
                rapid_games_played: 0,
                blitz_games_played: 0,
                created_at: fidePlayer.created_at,
                updated_at: fidePlayer.created_at,
              };

              const { error: insertError } = await supabaseAdmin
                .from('players')
                .insert([playerData]);

              if (insertError) throw insertError;

              imported++;
              console.log(
                `✅ Imported: ${fidePlayer.name} (${fidePlayer.fide_id})`
              );
            }
          } catch (playerError) {
            const errorMsg = `Failed to process ${fidePlayer.name} (${fidePlayer.fide_id}): ${playerError}`;
            console.error('❌', errorMsg);
            errors.push(errorMsg);
          }
        }

        // Small delay between batches to be nice to the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log('🎉 FIDE import completed!');
      console.log(
        `📊 Results: ${imported} imported, ${updated} updated, ${errors.length} errors`
      );

      return { imported, updated, errors };
    } catch (error) {
      console.error('❌ FIDE import failed:', error);
      throw error;
    }
  }

  /**
   * Sync ratings for existing players with FIDE
   */
  static async syncRatingsWithFide(): Promise<void> {
    try {
      console.log('🔄 Syncing ratings with FIDE...');

      // Get all players with FIDE IDs
      const { data: playersWithFideIds, error } = await supabaseAdmin
        .from('players')
        .select('id, fide_id, rating, rapid_rating, blitz_rating')
        .not('fide_id', 'is', null);

      if (error) throw error;

      console.log(
        `📊 Found ${playersWithFideIds?.length || 0} players with FIDE IDs to sync`
      );

      // This would fetch current ratings from FIDE and update our database
      // Implementation depends on FIDE API availability
    } catch (error) {
      console.error('❌ Rating sync failed:', error);
      throw error;
    }
  }
}

export default FideImportService;
