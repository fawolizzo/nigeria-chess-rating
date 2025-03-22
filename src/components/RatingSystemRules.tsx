
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RatingSystemRulesProps {
  variant?: 'detailed' | 'compact';
}

const RatingSystemRules: React.FC<RatingSystemRulesProps> = ({ variant = 'detailed' }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl font-bold">Nigerian Chess Rating System Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          <li className="flex items-start">
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-nigeria-green text-white text-sm mr-3 flex-shrink-0 mt-0">
              1
            </div>
            <div>
              <span className="font-bold">Floor rating of 800</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                New players in any format (Classical, Rapid, Blitz) start with a minimum rating of 800.
              </p>
            </div>
          </li>

          <li className="flex items-start">
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-nigeria-green text-white text-sm mr-3 flex-shrink-0 mt-0">
              2
            </div>
            <div>
              <span className="font-bold">Separate format tracking</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ratings are tracked separately for each format (Classical, Rapid, Blitz).
                Each format has its own independent rating calculation.
              </p>
            </div>
          </li>

          <li className="flex items-start">
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-nigeria-green text-white text-sm mr-3 flex-shrink-0 mt-0">
              3
            </div>
            <div>
              <span className="font-bold">+100 rating bonus</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Players with +100 rating suffix are treated as having 30+ games.
                When a Rating Officer gives a player a +100 bonus, they are immediately considered established.
              </p>
            </div>
          </li>

          <li className="flex items-start">
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-nigeria-green text-white text-sm mr-3 flex-shrink-0 mt-0">
              4
            </div>
            <div>
              <span className="font-bold">Variable K-factors</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                K-factors vary based on rating and experience:
              </p>
              <div className="pl-2 text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                <div className="flex items-start">
                  <div className="h-5 w-5 flex items-center justify-center rounded-full bg-nigeria-green/70 text-white text-xs mr-2 flex-shrink-0">
                    A
                  </div>
                  <p>K=40 for new players (less than 10 games) under 2000 rating</p>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 flex items-center justify-center rounded-full bg-nigeria-green/70 text-white text-xs mr-2 flex-shrink-0">
                    B
                  </div>
                  <p>K=32 for players rated below 2100</p>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 flex items-center justify-center rounded-full bg-nigeria-green/70 text-white text-xs mr-2 flex-shrink-0">
                    C
                  </div>
                  <p>K=24 for players rated 2100-2399</p>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 flex items-center justify-center rounded-full bg-nigeria-green/70 text-white text-xs mr-2 flex-shrink-0">
                    D
                  </div>
                  <p>K=16 for higher-rated players (2400+)</p>
                </div>
              </div>
            </div>
          </li>
          
          <li className="flex items-start">
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-nigeria-green text-white text-sm mr-3 flex-shrink-0 mt-0">
              5
            </div>
            <div>
              <span className="font-bold">Rating establishment</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Players need 30 games to establish their rating in each format.
                A player begins with 1 game and becomes established after their 30th game.
              </p>
            </div>
          </li>
        </ul>
        
        {variant === 'detailed' && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-bold mb-2">Rating Calculation Formula</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Nigerian Chess Rating uses the Elo rating system with the following formula:
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono">
              New Rating = Old Rating + K × (Score - Expected Score)
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Where Expected Score = 1 / (1 + 10^((Opponent Rating - Player Rating)/400))
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RatingSystemRules;
