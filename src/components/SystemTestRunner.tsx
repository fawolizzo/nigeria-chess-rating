import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';
import { runAllSystemTests } from '@/tests/system/runSystemTests';

const SystemTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    hasRun: boolean;
    success: boolean;
    logMessages: {
      message: string;
      type: 'info' | 'error' | 'success' | 'warning';
    }[];
  }>({
    hasRun: false,
    success: false,
    logMessages: [],
  });

  // Custom log observer to capture test output
  const runTests = async () => {
    setIsRunning(true);
    setResults({
      hasRun: false,
      success: false,
      logMessages: [],
    });

    // Create a log observer to capture output
    const logMessages: {
      message: string;
      type: 'info' | 'error' | 'success' | 'warning';
    }[] = [];

    // Override console.log/error temporarily
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      logMessages.push({ message: args.join(' '), type: 'info' });
    };

    console.error = (...args) => {
      originalError(...args);
      logMessages.push({ message: args.join(' '), type: 'error' });
    };

    console.warn = (...args) => {
      originalWarn(...args);
      logMessages.push({ message: args.join(' '), type: 'warning' });
    };

    try {
      // Run all tests
      await runAllSystemTests();

      // Determine success based on log content
      const hasErrors = logMessages.some(
        (log) =>
          log.type === 'error' ||
          log.message.includes('FAILED') ||
          log.message.includes('failed')
      );

      // Update results state
      setResults({
        hasRun: true,
        success: !hasErrors,
        logMessages,
      });
    } catch (error) {
      console.error('Error running tests:', error);
      setResults({
        hasRun: true,
        success: false,
        logMessages: [
          ...logMessages,
          { message: `Unexpected error: ${error}`, type: 'error' },
        ],
      });
    } finally {
      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="size-8 bg-nigeria-green rounded-full flex items-center justify-center">
            <Play className="size-4 text-white" />
          </div>
          System Test Runner
        </CardTitle>
        <CardDescription>
          Run comprehensive system tests to verify all components are working
          together correctly
        </CardDescription>
      </CardHeader>

      <CardContent>
        {results.hasRun && (
          <Alert
            variant={results.success ? 'default' : 'destructive'}
            className="mb-4"
          >
            {results.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {results.success ? 'All tests passed!' : 'Some tests failed'}
            </AlertTitle>
            <AlertDescription>
              {results.success
                ? 'The system is functioning as expected.'
                : 'Please check the logs below for details on failed tests.'}
            </AlertDescription>
          </Alert>
        )}

        {results.logMessages.length > 0 && (
          <div className="mt-4 border rounded-md overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium">
              Test Logs
            </div>
            <div className="max-h-96 overflow-y-auto p-4 text-xs font-mono">
              {results.logMessages.map((log, index) => (
                <div
                  key={index}
                  className={`py-1 ${
                    log.type === 'error'
                      ? 'text-red-600 dark:text-red-400'
                      : log.type === 'warning'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : log.message.includes('PASSED')
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-800 dark:text-gray-300'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 inline-block mr-1 text-amber-500" />
          Running tests will temporarily clear local data
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="bg-nigeria-green hover:bg-nigeria-green-dark"
        >
          {isRunning ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
              Running Tests...
            </>
          ) : (
            'Run System Tests'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SystemTestRunner;
