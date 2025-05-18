"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PasswordProtection({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    const adminAuth = sessionStorage.getItem("adminAuth")
    if (adminAuth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === "#Jayfri123#") {
      sessionStorage.setItem("adminAuth", "true")
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("Incorrect password. Please try again.")
    }
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Access Required</CardTitle>
          <CardDescription>Please enter the admin password to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Access Admin Panel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
