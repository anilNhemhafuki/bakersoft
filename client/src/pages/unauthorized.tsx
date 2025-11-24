
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Unauthorized() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-10 w-10 text-red-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Access Denied
              </h1>
              <p className="text-gray-600">
                You don't have permission to access this page.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-amber-900">
                    Current Role: {user?.role || 'Unknown'}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Contact your administrator to request access to this module.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => setLocation("/")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
