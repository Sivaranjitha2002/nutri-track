import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus } from "lucide-react";

const foodFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  calories: z.coerce.number().min(0, "Must be a positive number"),
  protein: z.coerce.number().min(0, "Must be a positive number"),
  carbs: z.coerce.number().min(0, "Must be a positive number"),
  fat: z.coerce.number().min(0, "Must be a positive number"),
  servingSize: z.coerce.number().min(0.1, "Must be a positive number"),
  servingUnit: z.string().min(1, "Serving unit is required"),
});

const FoodDatabase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');
  
  // Setup form
  const form = useForm<z.infer<typeof foodFormSchema>>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingSize: 1,
      servingUnit: "serving",
    },
  });
  
  // Fetch foods
  const { data: foods, isLoading } = useQuery({
    queryKey: ['/api/foods', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/foods${searchQuery ? `?search=${searchQuery}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch foods');
      return response.json();
    }
  });
  
  // Add food mutation
  const addFoodMutation = useMutation({
    mutationFn: async (values: z.infer<typeof foodFormSchema>) => {
      const response = await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          userId: Number(userId),
          isCustom: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add food');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/foods'] });
      setIsAddFoodOpen(false);
      form.reset();
      toast({
        title: "Food added",
        description: "The food has been added to the database.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add food",
        variant: "destructive"
      });
    }
  });
  
  const onSubmit = (values: z.infer<typeof foodFormSchema>) => {
    addFoodMutation.mutate(values);
  };

  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Food Database</h1>
          <p className="text-gray-500 mt-1">Search and manage food items with nutritional information</p>
        </div>
        <Button onClick={() => setIsAddFoodOpen(true)} className="mt-4 md:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Food
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Search Foods</CardTitle>
          <CardDescription>Find foods by name or nutritional content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search foods..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" className="shrink-0">Search</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Food Items</CardTitle>
          <CardDescription>View detailed nutritional information for each food</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : foods && foods.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Calories</TableHead>
                    <TableHead className="text-right">Protein (g)</TableHead>
                    <TableHead className="text-right">Carbs (g)</TableHead>
                    <TableHead className="text-right">Fat (g)</TableHead>
                    <TableHead>Serving</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {foods.map((food: any) => (
                    <TableRow key={food.id}>
                      <TableCell className="font-medium">{food.name}</TableCell>
                      <TableCell className="text-right">{food.calories}</TableCell>
                      <TableCell className="text-right">{food.protein}</TableCell>
                      <TableCell className="text-right">{food.carbs}</TableCell>
                      <TableCell className="text-right">{food.fat}</TableCell>
                      <TableCell>{food.servingSize} {food.servingUnit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No foods found. Try a different search or add a custom food.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddFoodOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Food
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Food Dialog */}
      <Dialog open={isAddFoodOpen} onOpenChange={setIsAddFoodOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Food</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" step="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="protein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" step="0.1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="carbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbs (g)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" step="0.1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fat (g)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" step="0.1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="servingSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serving Size</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0.1" step="0.1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="servingUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serving Unit</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., cup, oz, g" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddFoodOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addFoodMutation.isPending}>
                  {addFoodMutation.isPending ? "Adding..." : "Add Food"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodDatabase;
