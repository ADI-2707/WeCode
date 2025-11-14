import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/HomePage.jsx";
import ProblemsPage from "./pages/ProblemsPage.jsx";
import { Toaster } from 'react-hot-toast'

function App() {
  const { isSignedIn } = useUser();

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
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