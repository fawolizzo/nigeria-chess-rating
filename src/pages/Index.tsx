import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Star,
  TrendingUp,
  Award,
  Home,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllPlayersFromSupabase } from '@/services/playerService';
import RankingTable from '@/components/RankingTable';
import { Player } from '@/lib/mockData';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        setIsLoadingPlayers(true);
        console.log('🏠 Home page: Fetching top players...');

        // Get approved players from service
        const allPlayers = await getAllPlayersFromSupabase({
          status: 'approved',
        });
        console.log('🏠 Fetched players:', allPlayers.length, 'players');
        console.log('📋 Players sample:', allPlayers.slice(0, 3));

        // Sort by classical rating and take top 10
        const sortedPlayers = Array.isArray(allPlayers)
          ? allPlayers
              .filter((player) => player && typeof player === 'object')
              .sort((a, b) => (b.rating || 800) - (a.rating || 800))
              .slice(0, 10)
          : [];

        console.log(
          '🏆 Top 10 players by rating:',
          sortedPlayers.map((p) => ({ name: p.name, rating: p.rating }))
        );
        setTopPlayers(sortedPlayers);
      } catch (error) {
        console.error('❌ Error fetching top players:', error);
        setTopPlayers([]);
      } finally {
        setIsLoadingPlayers(false);
      }
    };

    fetchTopPlayers();

    // Set up an interval to refresh data every 10 seconds
    const interval = setInterval(fetchTopPlayers, 10000);

    return () => clearInterval(interval);
  }, []);

  const TopPlayersSection = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <img
            src="/lovable-uploads/362142dd-98df-49bb-949e-58332bb00376.png"
            alt="Players"
            className="w-8 h-8"
          />
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              Top Rated Players
            </CardTitle>
            <CardDescription>
              Leading players by Classical rating
            </CardDescription>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to="/players">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingPlayers ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : topPlayers.length > 0 ? (
          <RankingTable
            players={topPlayers}
            itemsPerPage={10}
            showRankings={true}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No players found</p>
            <p className="text-sm">
              Players will appear here once they are uploaded by the Rating
              Officer
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-nigeria-green to-nigeria-green-dark rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Nigerian Chess Rating
            <span className="block text-2xl md:text-3xl text-nigeria-green mt-2">
              Official Rating System
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            The official platform for chess tournament management and player
            ratings across Nigeria. Track your progress, participate in
            tournaments, and climb the national rankings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-nigeria-green hover:bg-nigeria-green-dark"
            >
              <Link to="/players">
                <Users className="h-5 w-5 mr-2" />
                View Player Rankings
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/tournaments">
                <Calendar className="h-5 w-5 mr-2" />
                Browse Tournaments
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <Users className="h-8 w-8 text-nigeria-green" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoadingPlayers ? (
                  <Skeleton className="h-8 w-16 mx-auto" />
                ) : (
                  `${topPlayers.length}+`
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Registered Players
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <MapPin className="h-8 w-8 text-nigeria-green" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                37
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                States & FCT
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <Calendar className="h-8 w-8 text-nigeria-green" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                0
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Tournaments
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <Trophy className="h-8 w-8 text-nigeria-green" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                0
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completed Tournaments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Top Players */}
          <TopPlayersSection />

          {/* Recent Tournaments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-nigeria-green" />
                Recent Tournaments
              </CardTitle>
              <CardDescription>Latest tournament activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent tournaments</p>
                <p className="text-sm">Tournament activity will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <TrendingUp className="h-12 w-12 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Your Rating</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor your chess rating progress across Classical, Rapid, and
                Blitz formats
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <Calendar className="h-12 w-12 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Join Tournaments</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Participate in rated tournaments across all 36 states and FCT
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <Award className="h-12 w-12 text-nigeria-green" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Official Ratings</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get officially recognized ratings that count towards national
                rankings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Navigation */}
        <div className="bg-gradient-to-r from-nigeria-green to-nigeria-green-dark rounded-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Quick Access</h3>
              <p className="opacity-90">
                Navigate to key sections of the application
              </p>
            </div>
            <Button variant="secondary" asChild>
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-nigeria-green to-nigeria-green-dark rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Chess Journey?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Join the Nigerian Chess Rating system and compete with the best
            players across the nation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Link to="/register" className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Get Started
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-nigeria-green"
            >
              <Link to="/about" className="flex items-center gap-2">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
