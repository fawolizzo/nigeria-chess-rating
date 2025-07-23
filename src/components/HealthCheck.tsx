import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/config/environment';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
} from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'checking';
  timestamp: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    auth: 'available' | 'unavailable' | 'error';
    environment: 'valid' | 'invalid' | 'error';
  };
  responseTime: number;
  errors: string[];
}

export function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const healthStatus: HealthStatus = {
        status: 'checking',
        timestamp: new Date().toISOString(),
        version: config.app.version,
        services: {
          database: 'disconnected',
          auth: 'unavailable',
          environment: 'invalid',
        },
        responseTime: 0,
        errors: [],
      };

      // Check environment configuration
      try {
        if (config.supabase.url && config.supabase.anonKey) {
          healthStatus.services.environment = 'valid';
        } else {
          healthStatus.services.environment = 'invalid';
          errors.push('Missing Supabase configuration');
        }
      } catch (error) {
        healthStatus.services.environment = 'error';
        errors.push('Environment configuration error');
      }

      // Check database connection
      try {
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);

        if (error) {
          healthStatus.services.database = 'error';
          errors.push(`Database error: ${error.message}`);
        } else {
          healthStatus.services.database = 'connected';
        }
      } catch (error) {
        healthStatus.services.database = 'error';
        errors.push('Database connection failed');
      }

      // Check auth service
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          healthStatus.services.auth = 'error';
          errors.push(`Auth error: ${error.message}`);
        } else {
          healthStatus.services.auth = 'available';
        }
      } catch (error) {
        healthStatus.services.auth = 'error';
        errors.push('Auth service check failed');
      }

      // Calculate response time
      healthStatus.responseTime = Date.now() - startTime;
      healthStatus.errors = errors;

      // Determine overall status
      const allServicesHealthy = Object.values(healthStatus.services).every(
        (status) =>
          status === 'connected' || status === 'available' || status === 'valid'
      );

      healthStatus.status =
        allServicesHealthy && errors.length === 0 ? 'healthy' : 'unhealthy';

      setHealth(healthStatus);
    } catch (error) {
      setHealth({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: config.app.version,
        services: {
          database: 'error',
          auth: 'error',
          environment: 'error',
        },
        responseTime: Date.now() - startTime,
        errors: ['Health check failed completely'],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'available':
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'available':
      case 'valid':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Healthy
          </Badge>
        );
      case 'checking':
        return <Badge variant="outline">Checking...</Badge>;
      default:
        return <Badge variant="destructive">Unhealthy</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Check
          </div>
          <div className="flex items-center gap-2">
            {health && getStatusBadge(health.status)}
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Monitor the health and status of system components
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!health ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(health.status)}
                <span className="font-medium">Overall Status</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{health.status.toUpperCase()}</div>
                <div className="text-sm text-gray-500">
                  Response: {health.responseTime}ms
                </div>
              </div>
            </div>

            {/* Service Status */}
            <div className="space-y-2">
              <h4 className="font-medium">Service Status</h4>

              <div className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.services.database)}
                  <span>Database Connection</span>
                </div>
                <span className="text-sm capitalize">
                  {health.services.database}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.services.auth)}
                  <span>Authentication Service</span>
                </div>
                <span className="text-sm capitalize">
                  {health.services.auth}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.services.environment)}
                  <span>Environment Configuration</span>
                </div>
                <span className="text-sm capitalize">
                  {health.services.environment}
                </span>
              </div>
            </div>

            {/* System Information */}
            <div className="space-y-2">
              <h4 className="font-medium">System Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Version:</span>
                  <span className="ml-2 font-mono">{health.version}</span>
                </div>
                <div>
                  <span className="text-gray-500">Environment:</span>
                  <span className="ml-2 font-mono">
                    {config.app.environment}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Last Check:</span>
                  <span className="ml-2 font-mono">
                    {new Date(health.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Response Time:</span>
                  <span className="ml-2 font-mono">
                    {health.responseTime}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Errors */}
            {health.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Issues detected:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {health.errors.map((error, index) => (
                        <li key={index} className="text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
