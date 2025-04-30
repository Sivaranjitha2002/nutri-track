import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/ui/theme-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { UserSettings } from "@/lib/types";
import { Check, Moon, Sun } from "lucide-react";

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(30, "Display name must be at most 30 characters"),
  height: z.coerce.number().min(50, "Height must be at least 50cm").max(250, "Height must be at most 250cm"),
  weight: z.coerce.number().min(30, "Weight must be at least 30kg").max(300, "Weight must be at most 300kg"),
  age: z.coerce.number().min(18, "Age must be at least 18").max(100, "Age must be at most 100"),
  gender: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "lightly active", "moderately active", "very active", "extra active"]),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, "Password must be at least 8 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');
  const { theme, setTheme } = useTheme();
  
  // Set up profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      height: 170,
      weight: 70,
      age: 30,
      gender: "male",
      activityLevel: "moderately active",
    },
  });
  
  // Set up password form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Fetch user data
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    onSuccess: (data) => {
      profileForm.reset({
        displayName: data.displayName || "",
        height: 170, // These would come from user settings in a real app
        weight: 70,
        age: 30,
        gender: "male",
        activityLevel: "moderately active",
      });
    },
    enabled: !!userId,
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileFormSchema>) => {
      // This would update the user profile in a real app
      return await apiRequest('PUT', `/api/users/${userId}`, {
        displayName: values.displayName,
        // Other fields would be saved to user settings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof passwordFormSchema>) => {
      // This would change the password in a real app
      return await apiRequest('PUT', `/api/users/${userId}/password`, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    }
  });
  
  // On submit profile
  const onSubmitProfile = (values: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(values);
  };
  
  // On submit password change
  const onSubmitPasswordChange = (values: z.infer<typeof passwordFormSchema>) => {
    changePasswordMutation.mutate(values);
  };
  
  // Toggle notifications
  const toggleNotifications = (enabled: boolean) => {
    toast({
      title: enabled ? "Notifications enabled" : "Notifications disabled",
      description: enabled 
        ? "You will now receive notifications" 
        : "You will no longer receive notifications",
    });
  };

  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences and profile</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUser ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            This is the name that will be displayed to other users.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                              <Input type="number" min="50" max="250" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input type="number" min="30" max="300" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                              <Input type="number" min="18" max="100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="activityLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity Level</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select activity level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                              <SelectItem value="lightly active">Lightly active (light exercise 1-3 days/week)</SelectItem>
                              <SelectItem value="moderately active">Moderately active (moderate exercise 3-5 days/week)</SelectItem>
                              <SelectItem value="very active">Very active (hard exercise 6-7 days/week)</SelectItem>
                              <SelectItem value="extra active">Extra active (very hard exercise & physical job)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This helps calculate your calorie and nutrient needs more accurately.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and account security</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onSubmitPasswordChange)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </form>
              </Form>
              
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-medium text-lg mb-4">Login Sessions</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-gray-500">Last active: Just now</p>
                    </div>
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  
                  <Button variant="destructive">Sign Out of All Sessions</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>Customize your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme-toggle" className="font-medium">Theme</Label>
                  <p className="text-sm text-gray-500">Choose between light and dark mode</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={theme === "light" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTheme("light")}
                    className="w-10 h-10 p-0"
                  >
                    <Sun className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant={theme === "dark" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className="w-10 h-10 p-0"
                  >
                    <Moon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications-toggle" className="font-medium">Notifications</Label>
                  <p className="text-sm text-gray-500">Receive reminders and updates</p>
                </div>
                <Switch 
                  id="notifications-toggle" 
                  onCheckedChange={toggleNotifications}
                  defaultChecked
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="units-select" className="font-medium">Units</Label>
                  <p className="text-sm text-gray-500">Choose your preferred measurement units</p>
                </div>
                <Select defaultValue="metric">
                  <SelectTrigger id="units-select" className="w-[180px]">
                    <SelectValue placeholder="Select units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                    <SelectItem value="imperial">Imperial (lb, in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="language-select" className="font-medium">Language</Label>
                  <p className="text-sm text-gray-500">Set your preferred language</p>
                </div>
                <Select defaultValue="en">
                  <SelectTrigger id="language-select" className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">Reset All Preferences</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your app data and privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export Your Data</p>
                  <p className="text-sm text-gray-500">Download all your nutrition and progress data</p>
                </div>
                <Button variant="outline">Export</Button>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium text-red-600">Delete Account</p>
                  <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
