import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { createTournament } from '../api/createTournament';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Calendar, MapPin, Trophy } from 'lucide-react';
import { getAllStates } from '@/data/nigeriaStates';

const tournamentSchema = z
  .object({
    name: z.string().min(3, 'Tournament name must be at least 3 characters'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    state: z.string().min(1, 'State is required'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    format: z.enum(['classical', 'rapid', 'blitz'], {
      required_error: 'Tournament format is required',
    }),
    roundsTotal: z
      .number()
      .min(3, 'Minimum 3 rounds')
      .max(11, 'Maximum 11 rounds'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

type TournamentFormData = z.infer<typeof tournamentSchema>;

interface TournamentFormProps {
  onSuccess?: (tournamentId: string) => void;
  onCancel?: () => void;
}

export function TournamentForm({ onSuccess, onCancel }: TournamentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      roundsTotal: 5,
      format: 'classical',
    },
  });

  const selectedFormat = watch('format');

  const onSubmit = async (data: TournamentFormData) => {
    if (!user?.id) {
      setError('You must be logged in to create a tournament');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createTournament({
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        state: data.state,
        city: data.city,
        format: data.format,
        roundsTotal: data.roundsTotal,
        organizerId: user.id,
      });

      if (result.success && result.tournament) {
        onSuccess?.(result.tournament.id);
      } else {
        setError(result.error || 'Failed to create tournament');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatOptions = [
    {
      value: 'classical',
      label: 'Classical',
      description: 'Long time control (90+ minutes)',
    },
    {
      value: 'rapid',
      label: 'Rapid',
      description: 'Medium time control (15-60 minutes)',
    },
    {
      value: 'blitz',
      label: 'Blitz',
      description: 'Fast time control (3-15 minutes)',
    },
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Create New Tournament
        </CardTitle>
        <CardDescription>
          Set up a new chess tournament. You can add players and manage rounds
          after creation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tournament Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              placeholder="e.g., Lagos State Chess Championship 2025"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                onValueChange={(value) => setValue('state', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {getAllStates().map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g., Lagos"
                {...register('city')}
                disabled={isLoading}
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                disabled={isLoading}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                disabled={isLoading}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Format and Rounds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tournament Format</Label>
              <Select
                onValueChange={(value: 'classical' | 'rapid' | 'blitz') =>
                  setValue('format', value)
                }
                disabled={isLoading}
                defaultValue="classical"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.format && (
                <p className="text-sm text-red-600">{errors.format.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="roundsTotal">Number of Rounds</Label>
              <Input
                id="roundsTotal"
                type="number"
                min="3"
                max="11"
                {...register('roundsTotal', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.roundsTotal && (
                <p className="text-sm text-red-600">
                  {errors.roundsTotal.message}
                </p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The tournament will be created in draft
              status. You can add players and then activate it to begin Round 1
              pairings.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Tournament...
                </>
              ) : (
                'Create Tournament'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
