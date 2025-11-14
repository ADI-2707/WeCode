import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import ProblemsPage from "./pages/ProblemsPage.jsx";
import { Toaster } from 'react-hot-toast'
import DashboardPage from "./pages/DashboardPage.jsx";

function App() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  return (
    <>

      <Routes>
        <Route path="/" element={!isSignedIn ? <HomePage /> :  <Navigate to={"/dashboard"} />} />
        <Route path="/dashboard" element={isSignedIn ? <DashboardPage /> :  <Navigate to={"/"} />} />
        <Route
          path="/problems"
          element={isSignedIn ? <ProblemsPage /> : <Navigate to={"/"} />}
        />
      </Routes>

      <Toaster position='top-right'  toastOptions={{duration:3000}}/>
    </>
  );
}

export default App;

// tw, daisyui, react-router, react-hot-toast, react-query (tanstack query), axios