import React from 'react';
import { HealthCheck as HealthCheckComponent } from '@/components/HealthCheck';

export default function HealthCheckPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Health</h1>
        <p className="text-gray-600 mt-2">
          Monitor the health and status of the Nigerian Chess Rating System
        </p>
      </div>

      <HealthCheckComponent />
    </div>
  );
}
