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
  roundInfo: {
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
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    padding: 8,
  },
  tableColWide: {
    width: '30%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    padding: 8,
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
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
  },
  byeText: {
    fontStyle: 'italic',
    color: '#666666',
  },
});

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

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  state: string;
  format: string;
}

interface PairingsPDFProps {
  tournament: Tournament;
  round: Round;
}

export const PairingsPDF: React.FC<PairingsPDFProps> = ({
  tournament,
  round,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlayerDisplay = (player: Player | null) => {
    if (!player) return 'BYE';
    return player.state
      ? `${player.full_name} (${player.state})`
      : player.full_name;
  };

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

        {/* Round Info */}
        <View style={styles.roundInfo}>
          <Text>Round {round.number} Pairings</Text>
        </View>

        {/* Pairings Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Board</Text>
            </View>
            <View style={styles.tableColWide}>
              <Text style={styles.tableCellHeader}>White</Text>
            </View>
            <View style={styles.tableColWide}>
              <Text style={styles.tableCellHeader}>Black</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellHeader}>Result</Text>
            </View>
          </View>

          {/* Data Rows */}
          {round.pairings.map((pairing) => (
            <View style={styles.tableRow} key={pairing.id}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>{pairing.board_number}</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text style={styles.tableCellLeft}>
                  {getPlayerDisplay(pairing.white_player)}
                </Text>
              </View>
              <View style={styles.tableColWide}>
                <Text
                  style={[
                    styles.tableCellLeft,
                    !pairing.black_player && styles.byeText,
                  ]}
                >
                  {getPlayerDisplay(pairing.black_player)}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {pairing.result ? pairing.result : '___'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by Nigerian Chess Rating System •{' '}
          {new Date().toLocaleString()}
        </Text>
      </Page>
    </Document>
  );
};
