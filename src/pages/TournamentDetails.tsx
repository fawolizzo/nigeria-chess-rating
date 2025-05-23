import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import { useUser } from "@/contexts/UserContext";
import { getAllUsers } from "@/services/playerService";
import { getAllPlayers } from "@/services/mockServices";
import { Tournament } from "@/lib/mockData";
import { getTournamentByIdFromSupabase } from "@/services/tournamentService";

const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [organizer, setOrganizer] = useState<any | null>(null);
  const [host, setHost] = useState<any | null>(null);
  const [tournamentPlayers, setTournamentPlayers] = useState<any[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTournamentDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!id) {
          setError("Tournament ID is missing.");
          return;
        }

        const tournamentData = await getTournamentByIdFromSupabase(id);
        if (!tournamentData) {
          setError("Tournament not found.");
          return;
        }

        setTournament(tournamentData);

        const users = getAllUsers();
        const usersData = await users;
        const organizer = usersData.find(user => user.id === tournamentData.organizerId);
        setOrganizer(organizer || {});

        const host = usersData.find(user => user.id === tournamentData.hostId);
        setHost(host || {});

        const players = getAllPlayers();
        const playersData = await players;
        const tournamentPlayers = playersData.filter(
          player => tournamentData.players?.includes(player.id)
        );
        setTournamentPlayers(tournamentPlayers);

        const approvedPlayers = playersData.filter(
          player => tournamentData.players?.includes(player.id) && player.status === 'approved'
        );
        setApprovedPlayers(approvedPlayers);

      } catch (err: any) {
        console.error("Error loading tournament details:", err);
        setError(err.message || "Failed to load tournament details.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTournamentDetails();
  }, [id]);

  const handleRegister = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!tournament) return;

    if (tournament.players?.includes(currentUser.id)) {
      alert("You are already registered for this tournament.");
      return;
    }

    // Optimistically update the UI
    const updatedTournament = {
      ...tournament,
      players: [...(tournament.players || []), currentUser.id],
    };
    setTournament(updatedTournament);

    // Optimistically update the players list
    const players = getAllPlayers();
    players.then((playersData) => {
      const tournamentPlayers = playersData.filter(
        player => updatedTournament.players?.includes(player.id)
      );
      setTournamentPlayers(tournamentPlayers);
    });

    alert("Registration successful!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-nigeria-green mb-4" />
          <p className="text-muted-foreground">Loading Tournament Details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Error</h2>
          <p className="text-red-500">{error}</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Tournament Not Found</h2>
          <p className="text-gray-500">
            The requested tournament could not be found.
          </p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="container pt-24 pb-20 px-4 max-w-3xl mx-auto">
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md rounded-lg overflow-hidden">
          <CardHeader className="px-4 py-5">
            <CardTitle className="text-2xl font-semibold">{tournament.name}</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4 mr-2 inline-block" />
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 py-3">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Tournament Details</h3>
              <p className="text-gray-700 dark:text-gray-300">
                <MapPin className="h-4 w-4 mr-2 inline-block" />
                Location: {tournament.location}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Rounds: {tournament.rounds}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Time Control: {tournament.timeControl}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Organizer Information
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Organizer: {organizer?.name || "N/A"}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Host: {host?.name || "N/A"}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                Registered Players ({approvedPlayers.length}/{tournamentPlayers.length})
              </h3>
              {tournamentPlayers.length > 0 ? (
                <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                  {tournamentPlayers.map((player) => (
                    <li key={player.id}>{player.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No players registered yet.</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="px-4 py-4">
            {currentUser ? (
              tournament.players?.includes(currentUser.id) ? (
                <Button variant="secondary" disabled>
                  Registered
                </Button>
              ) : (
                <Button onClick={handleRegister}>Register</Button>
              )
            ) : (
              <Button onClick={() => navigate("/login")}>
                Login to Register
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default TournamentDetails;
