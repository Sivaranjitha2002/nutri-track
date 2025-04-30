import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { Food } from "@/lib/types";

interface AddMealDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddMealDialog = ({ isOpen, onClose }: AddMealDialogProps) => {
  const [mealType, setMealType] = useState("Breakfast");
  const [mealTime, setMealTime] = useState(new Date().toTimeString().slice(0, 5));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<Array<{ food: Food, quantity: number }>>([]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = localStorage.getItem('userId');
  const today = new Date().toISOString().split('T')[0];

  // Reset state when dialog is opened
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Only reset selected foods, keep the meal type and time as convenience
      setSelectedFoods([]);
      setSearchQuery("");
    }
  };

  // Fetch foods for search
  const { data: foods, isLoading: isLoadingFoods } = useQuery({
    queryKey: ['/api/foods', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await fetch(`/api/foods?search=${searchQuery}`);
      if (!response.ok) throw new Error('Failed to fetch foods');
      return response.json();
    }
  });

  // Add meal mutation
  const addMealMutation = useMutation({
    mutationFn: async () => {
      if (selectedFoods.length === 0) {
        throw new Error('Please select at least one food item');
      }
      
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(userId),
          name: mealType,
          date: today,
          time: mealTime,
          foods: selectedFoods.map(item => ({
            foodId: item.food.id,
            quantity: item.quantity
          }))
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add meal');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-summary'] });
      toast({
        title: "Meal added",
        description: "Your meal has been successfully logged.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add meal",
        variant: "destructive"
      });
    }
  });

  const handleSelectFood = (food: Food) => {
    // Check if the food is already selected
    if (selectedFoods.some(item => item.food.id === food.id)) {
      return;
    }
    
    setSelectedFoods([...selectedFoods, { food, quantity: 1 }]);
    setSearchQuery(""); // Clear search after selection
  };

  const handleRemoveFood = (foodId: number) => {
    setSelectedFoods(selectedFoods.filter(item => item.food.id !== foodId));
  };

  const handleUpdateQuantity = (foodId: number, quantity: number) => {
    setSelectedFoods(selectedFoods.map(item => 
      item.food.id === foodId ? { ...item, quantity } : item
    ));
  };

  const handleSaveMeal = () => {
    addMealMutation.mutate();
  };

  // Calculate total nutrition for the meal
  const totalNutrition = selectedFoods.reduce(
    (acc, { food, quantity }) => {
      acc.calories += Math.round(food.calories * quantity);
      acc.protein += parseFloat((food.protein * quantity).toFixed(1));
      acc.carbs += parseFloat((food.carbs * quantity).toFixed(1));
      acc.fat += parseFloat((food.fat * quantity).toFixed(1));
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Meal</DialogTitle>
          <DialogDescription>
            Create a new meal entry for your food log.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meal-type">Meal Type</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger id="meal-type">
                  <SelectValue placeholder="Select a meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                  <SelectItem value="Dinner">Dinner</SelectItem>
                  <SelectItem value="Snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meal-time">Time</Label>
              <Input 
                type="time" 
                id="meal-time" 
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="food-search">Search Foods</Label>
            <div className="relative">
              <Input 
                id="food-search"
                type="text"
                placeholder="Start typing to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {searchQuery.length >= 2 && foods && foods.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
                  {isLoadingFoods ? (
                    <div className="p-2">
                      <Skeleton className="h-8" />
                      <Skeleton className="h-8 mt-1" />
                    </div>
                  ) : (
                    <div className="py-1">
                      {foods.map((food: Food) => (
                        <div 
                          key={food.id}
                          className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                          onClick={() => handleSelectFood(food)}
                        >
                          <span>{food.name}</span>
                          <span className="text-xs text-gray-500">{food.calories} cal</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="border rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">Selected Foods</h4>
              <Badge variant="outline">{selectedFoods.length} items</Badge>
            </div>
            
            {selectedFoods.length > 0 ? (
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {selectedFoods.map(({ food, quantity }) => (
                    <div key={food.id} className="flex items-center justify-between space-x-2 p-2 bg-gray-50 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{food.name}</p>
                        <p className="text-xs text-gray-500">{Math.round(food.calories * quantity)} cal</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center border rounded">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2"
                            onClick={() => handleUpdateQuantity(food.id, Math.max(0.5, quantity - 0.5))}
                          >
                            -
                          </Button>
                          <span className="text-xs w-8 text-center">{quantity}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2"
                            onClick={() => handleUpdateQuantity(food.id, quantity + 0.5)}
                          >
                            +
                          </Button>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                          onClick={() => handleRemoveFood(food.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-center text-sm text-gray-500">No items selected</p>
              </div>
            )}
            
            {selectedFoods.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-xs">
                  <span>Total:</span>
                  <span>{totalNutrition.calories} cal, {totalNutrition.protein}g protein, {totalNutrition.carbs}g carbs, {totalNutrition.fat}g fat</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSaveMeal}
            disabled={selectedFoods.length === 0 || addMealMutation.isPending}
          >
            {addMealMutation.isPending ? "Saving..." : "Save Meal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMealDialog;
