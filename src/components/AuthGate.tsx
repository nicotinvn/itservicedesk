"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import LoginScreen from "@/components/LoginScreen";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full pt-16 pb-20 lg:pb-8">{children}</main>
      <Navigation />
    </>
  );
}
