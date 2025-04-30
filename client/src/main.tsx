import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Create a user if none exists yet - temporary for demo
const initializeUser = async () => {
  // try {
    // const details = await window.catalyst.auth.getProjectUserDetails();
    // if (details) {
      // Create a test user
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'demo_user',
          password: 'password123',
          displayName: 'Sarah Johnson',
          goal: {
            calories: 2000,
            protein: 80,
            carbs: 250, 
            fat: 65
          }
        })
      });
      
      if (response.ok) {
        const user = await response.json();
        localStorage.setItem('userId', user.id.toString());
      }
    // }
  // } catch (error) {
  //   window.location.href = '/__catalyst/auth/login';
  //   console.error('Failed to initialize user:', error);
  // }
};

initializeUser().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});

declare global {
  interface Window {
    catalyst: any; // or give it a specific type if you know it
  }
}
