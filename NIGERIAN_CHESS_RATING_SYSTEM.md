# Nigerian Chess Rating System Documentation

## Overview

The Nigerian Chess Rating System is a sophisticated rating system that handles three different time controls (Classical, Rapid, and Blitz) with specific rules for rating updates, provisional ratings, and game count tracking.

## Core Concepts

### 1. Rating Categories

- **Classical**: Standard time control chess
- **Rapid**: Faster time control chess
- **Blitz**: Very fast time control chess

### 2. Floor Rating

- **Value**: 800 points
- **Purpose**: Default rating for unrated players in any category
- **Meaning**: Player has not yet established a rating in that format

### 3. Provisional Requirements

- **Games Required**: 30 games in a specific format
- **Purpose**: To establish a provisional rating in that format
- **Effect**: Once 30 games are completed, the player gets their first official rating

## Rating Upload Logic

When uploading new ratings (e.g., after a tournament), the system applies these rules:

### Rule 1: Established Rating Bonus

- **Condition**: Player has rating > 800 in a format
- **Action**: Add +100 points to that rating
- **Game Count**: Ensure player has 30+ games in that format

### Rule 2: Unrated Format Handling

- **Condition**: Player has rating = 800 in a format (floor rating)
- **Action**: No bonus applied, rating stays at 800
- **Game Count**: Player has 0 games in that format

### Rule 3: Independent Format Processing

- Each format (Classical, Rapid, Blitz) is processed independently
- A player can have established ratings in some formats and be unrated in others

## Examples

### Example 1: New Player

```
Before Upload:
- Classical: 800 (0 games)
- Rapid: 800 (0 games)
- Blitz: 800 (0 games)

After Upload:
- Classical: 800 (0 games) - No bonus
- Rapid: 800 (0 games) - No bonus
- Blitz: 800 (0 games) - No bonus
```

### Example 2: Classical Only Player

```
Before Upload:
- Classical: 2100 (30 games)
- Rapid: 800 (0 games)
- Blitz: 800 (0 games)

After Upload:
- Classical: 2200 (30 games) - +100 bonus applied
- Rapid: 800 (0 games) - No bonus
- Blitz: 800 (0 games) - No bonus
```

### Example 3: Multi-Format Player

```
Before Upload:
- Classical: 2200 (30 games)
- Rapid: 1900 (30 games)
- Blitz: 900 (30 games)

After Upload:
- Classical: 2300 (30 games) - +100 bonus applied
- Rapid: 2000 (30 games) - +100 bonus applied
- Blitz: 1000 (30 games) - +100 bonus applied
```

## Game Count Logic

The game count system reflects the rating status:

### Established Rating (> 800)

- **Game Count**: 30 games
- **Meaning**: Player has completed provisional requirements
- **Status**: Eligible for rating bonuses

### Floor Rating (= 800)

- **Game Count**: 0 games
- **Meaning**: Player is unrated in this format
- **Status**: Not eligible for rating bonuses

## System Implementation

### Database Schema

```sql
-- Players table structure
players (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  rating INTEGER DEFAULT 800,           -- Classical rating
  rapid_rating INTEGER DEFAULT 800,     -- Rapid rating
  blitz_rating INTEGER DEFAULT 800,     -- Blitz rating
  games_played INTEGER DEFAULT 0,       -- Classical games
  rapid_games_played INTEGER DEFAULT 0, -- Rapid games
  blitz_games_played INTEGER DEFAULT 0, -- Blitz games
  -- other fields...
)
```

### Key Functions

#### `applyRatingUpload(currentRatings)`

Applies the Nigerian Chess Rating upload logic to update player ratings.

#### `fixGameCounts(currentRatings)`

Ensures game counts properly reflect established vs unrated status.

#### `isEstablishedRating(rating)`

Checks if a rating is established (> 800) or at floor level (= 800).

#### `getRatingStatus(rating, gamesPlayed)`

Returns rating status: 'unrated', 'provisional', or 'established'.

## Administrative Tools

### Fix Game Counts Function

- **Location**: Rating Officer Dashboard → Debug Tab
- **Purpose**: Corrects game counts based on current ratings
- **Logic**:
  - Ratings > 800 → 30 games
  - Ratings = 800 → 0 games

### Clear All Players Function

- **Location**: Rating Officer Dashboard → Debug Tab
- **Purpose**: Removes all players for fresh start
- **Use Case**: When migrating to new NCR ID system

## Rating Display

### Status Indicators

- **Unrated**: "Unrated" (rating = 800, games = 0)
- **Provisional**: "1200 (Provisional)" (rating > 800, games < 30)
- **Established**: "1200" (rating > 800, games >= 30)

### NCR ID System

- **Format**: NCR + 5-digit timestamp + 2-digit random
- **Example**: NCR12345678
- **Purpose**: Unique identifier for Nigerian chess players

## Best Practices

### For Rating Officers

1. Always use "Fix Game Counts" after bulk uploads
2. Verify rating logic before applying bonuses
3. Check that unrated players remain at floor ratings
4. Ensure established players have appropriate game counts

### For Tournament Organizers

1. Submit complete tournament results
2. Specify time control format clearly
3. Include all player information accurately
4. Verify player NCR IDs before submission

### For System Administrators

1. Regular database backups before rating updates
2. Monitor rating upload logs for errors
3. Validate rating changes against business rules
4. Test rating logic in development environment first

## Troubleshooting

### Common Issues

#### "Invalid UUID" Error

- **Cause**: Database query using empty string as UUID
- **Solution**: Use proper UUID filtering or numeric comparisons

#### Incorrect Game Counts

- **Cause**: Manual rating updates without game count fixes
- **Solution**: Run "Fix Game Counts" function

#### Rating Bonuses Not Applied

- **Cause**: Player ratings at floor level (800)
- **Solution**: Verify player has established rating before expecting bonus

#### Players Not Showing After Upload

- **Cause**: Database connection or RLS (Row Level Security) issues
- **Solution**: Use admin client and test connection

## Future Enhancements

### Planned Features

1. Automated tournament result processing
2. Rating history tracking and visualization
3. Performance statistics and analytics
4. Integration with international rating systems
5. Mobile app for tournament organizers

### Technical Improvements

1. Real-time rating calculations
2. Batch processing optimization
3. Enhanced error handling and logging
4. Automated testing suite
5. API documentation and versioning

---

_This documentation reflects the current implementation of the Nigerian Chess Rating System as of January 2025._
