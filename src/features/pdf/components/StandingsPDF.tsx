import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts for better rendering
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 3,
  },
  standingsInfo: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#f0f0f0',
    padding: 6,
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    padding: 6,
  },
  rankCol: {
    width: '8%',
  },
  nameCol: {
    width: '35%',
  },
  scoreCol: {
    width: '10%',
  },
  gamesCol: {
    width: '10%',
  },
  performanceCol: {
    width: '20%',
  },
  ratingCol: {
    width: '12%',
  },
  tiebreakCol: {
    width: '15%',
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 9,
    textAlign: 'center',
  },
  tableCellLeft: {
    fontSize: 9,
    textAlign: 'left',
  },
  rankCell: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreCell: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
  },
  podium: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff9c4',
    borderRadius: 5,
  },
  podiumTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  podiumItem: {
    textAlign: 'center',
    width: '30%',
  },
  podiumRank: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  podiumName: {
    fontSize: 9,
  },
  podiumScore: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});

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

interface StandingsPDFProps {
  tournament: Tournament;
  standings: Standing[];
  currentRound?: number;
}

export const StandingsPDF: React.FC<StandingsPDFProps> = ({
  tournament,
  standings,
  currentRound,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getScoreDisplay = (score: number) => {
    return score % 1 === 0 ? score.toString() : score.toFixed(1);
  };

  const getPerformanceStats = (standing: Standing) => {
    if (standing.games_played === 0) {
      return 'No games';
    }

    const percentage = ((standing.score / standing.games_played) * 100).toFixed(
      0
    );
    return `${percentage}% (${standing.wins}W-${standing.draws}D-${standing.losses}L)`;
  };

  const getTiebreakPlaceholder = () => {
    return 'TB1/TB2'; // Placeholder for future tiebreak implementation
  };

  const topThree = standings.slice(0, 3);
  const isCompleted =
    tournament.status === 'completed' ||
    tournament.status === 'ratings_processed';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{tournament.name}</Text>
          <Text style={styles.subtitle}>
            {tournament.city}, {tournament.state} •{' '}
            {formatDate(tournament.start_date)} -{' '}
            {formatDate(tournament.end_date)}
          </Text>
          <Text style={styles.subtitle}>Format: {tournament.format}</Text>
        </View>

        {/* Standings Info */}
        <View style={styles.standingsInfo}>
          <Text>
            Tournament Standings
            {currentRound && ` - After Round ${currentRound}`}
            {isCompleted && ' - Final'}
          </Text>
        </View>

        {/* Top 3 Podium (if tournament is completed) */}
        {isCompleted && topThree.length >= 3 && (
          <View style={styles.podium}>
            <Text style={styles.podiumTitle}>🏆 Final Podium 🏆</Text>
            <View style={styles.podiumRow}>
              {topThree.map((standing, index) => (
                <View key={standing.player_id} style={styles.podiumItem}>
                  <Text style={styles.podiumRank}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} #
                    {standing.rank}
                  </Text>
                  <Text style={styles.podiumName}>{standing.player_name}</Text>
                  <Text style={styles.podiumScore}>
                    {getScoreDisplay(standing.score)} pts
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Standings Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, styles.rankCol]}>
              <Text style={styles.tableCellHeader}>Rank</Text>
            </View>
            <View style={[styles.tableColHeader, styles.nameCol]}>
              <Text style={styles.tableCellHeader}>Player</Text>
            </View>
            <View style={[styles.tableColHeader, styles.scoreCol]}>
              <Text style={styles.tableCellHeader}>Score</Text>
            </View>
            <View style={[styles.tableColHeader, styles.gamesCol]}>
              <Text style={styles.tableCellHeader}>Games</Text>
            </View>
            <View style={[styles.tableColHeader, styles.performanceCol]}>
              <Text style={styles.tableCellHeader}>Performance</Text>
            </View>
            <View style={[styles.tableColHeader, styles.ratingCol]}>
              <Text style={styles.tableCellHeader}>Rating</Text>
            </View>
            <View style={[styles.tableColHeader, styles.tiebreakCol]}>
              <Text style={styles.tableCellHeader}>Tiebreak</Text>
            </View>
          </View>

          {/* Data Rows */}
          {standings.map((standing) => (
            <View style={styles.tableRow} key={standing.player_id}>
              <View style={[styles.tableCol, styles.rankCol]}>
                <Text style={styles.rankCell}>#{standing.rank}</Text>
              </View>
              <View style={[styles.tableCol, styles.nameCol]}>
                <Text style={styles.tableCellLeft}>{standing.player_name}</Text>
              </View>
              <View style={[styles.tableCol, styles.scoreCol]}>
                <Text style={styles.scoreCell}>
                  {getScoreDisplay(standing.score)}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.gamesCol]}>
                <Text style={styles.tableCell}>{standing.games_played}</Text>
              </View>
              <View style={[styles.tableCol, styles.performanceCol]}>
                <Text style={styles.tableCell}>
                  {getPerformanceStats(standing)}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.ratingCol]}>
                <Text style={styles.tableCell}>{standing.seed_rating}</Text>
              </View>
              <View style={[styles.tableCol, styles.tiebreakCol]}>
                <Text style={styles.tableCell}>{getTiebreakPlaceholder()}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by Nigerian Chess Rating System •{' '}
          {new Date().toLocaleString()} • Total Players: {standings.length}
        </Text>
      </Page>
    </Document>
  );
};
