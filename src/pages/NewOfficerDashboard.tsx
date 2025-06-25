import React from "react";
import Navbar from "@/components/Navbar";
import NewOfficerDashboard from "@/components/officer/NewOfficerDashboard";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";
import { useNavigate } from "react-router-dom";
import { useSession, useUser } from "@supabase/auth-helpers-react";

export default function NewOfficerDashboardPage() {
  const navigate = useNavigate();
  // Use Supabase Auth session
  // If you use a custom SupabaseAuthProvider, replace with your context
  let session = null;
  let user = null;
  try {
    // Try to use the Supabase Auth helpers if available
    // (If not, you may need to use your own context or supabase.auth.getSession())
    // @ts-ignore
    session = useSession ? useSession() : null;
    // @ts-ignore
    user = useUser ? useUser() : null;
  } catch (e) {
    // Fallback: no session/user
    session = null;
    user = null;
    // eslint-disable-next-line no-console
    console.error("Error checking Supabase session/user:", e);
  }

  if (!session && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full text-center mt-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Not Authenticated</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You must be logged in as a Rating Officer to access this dashboard.<br />
            Please log in again.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-nigeria-green hover:bg-nigeria-green-dark text-white font-bold py-2 px-4 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-20">
          <NewOfficerDashboard />
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
