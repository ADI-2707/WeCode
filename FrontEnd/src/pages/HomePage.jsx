import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
} from "@clerk/clerk-react";
import React from "react";
import toast from "react-hot-toast";

function HomePage() {
  
  return (
    <div>
      <button className="btn btn-primary" onClick={() => toast.error("This is a error toast")}>Click me</button>

      <SignedOut>
        <SignInButton mode="model">
          <button>Login</button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <SignOutButton />
      </SignedIn>

      <UserButton />
    </div>
  );
}

export default HomePage;
