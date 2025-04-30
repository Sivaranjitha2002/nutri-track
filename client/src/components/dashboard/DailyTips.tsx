import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const DailyTips = () => {
  // In a real app, these would come from the server
  const tip = "Try to include protein with each meal to help maintain muscle mass and keep you feeling full longer.";
  
  const insights = [
    { message: "You're on track with your fiber goals!", status: "success" },
    { message: "Your sodium intake is a bit high today.", status: "warning" },
    { message: "Try to increase your vegetable intake.", status: "error" },
  ];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Nutrition Tips</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="material-icons text-blue-400">lightbulb</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Today's Tip</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>{tip}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-2 h-2 ${getStatusColor(insight.status)} rounded-full mr-2`}></div>
              <span className="text-sm text-gray-600">{insight.message}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 border-t pt-4">
          <a href="#" className="text-sm font-medium text-primary hover:text-primary-dark">
            View meal planning suggestions →
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTips;
