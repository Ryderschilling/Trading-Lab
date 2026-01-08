"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface ProfileFormProps {
  user: {
    id: string;
    email: string;
  };
  clerkUser: {
    firstName: string | null;
    imageUrl: string;
  } | null;
}

export function ProfileForm({ user, clerkUser }: ProfileFormProps) {
  const { user: clerkUserClient, isLoaded } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(clerkUser?.firstName || "");
  const [bio, setBio] = useState(""); // You'd need to add this to your User model if you want to store it

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleUpdateProfile() {
    if (!isLoaded) {
      toast({
        title: "Loading",
        description: "Please wait while we load your profile...",
        variant: "default",
      });
      return;
    }

    if (!clerkUserClient) {
      toast({
        title: "Error",
        description: "Unable to load your profile. Please try logging out and back in.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update name via Clerk
      await clerkUserClient.update({
        firstName: name,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword() {
    if (!isLoaded) {
      toast({
        title: "Loading",
        description: "Please wait while we load your profile...",
        variant: "default",
      });
      return;
    }

    if (!clerkUserClient) {
      toast({
        title: "Error",
        description: "Unable to load your profile. Please try logging out and back in.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Clerk handles password updates through their UI
      // Redirect to Clerk's password change page
      window.location.href = "/user/change-password";
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to open password change page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clerkUserClient) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Unable to load your profile.</p>
            <Button onClick={() => window.location.href = "/"}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              readOnly
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email is managed by your authentication provider
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <Button onClick={handleUpdateProfile} disabled={loading}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            {clerkUserClient?.imageUrl && (
              <img
                src={clerkUserClient.imageUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full"
              />
            )}
            <div>
              <p className="text-sm text-muted-foreground">
                Profile photos are managed by your authentication provider
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.location.href = "/user"}
              >
                Update Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleUpdatePassword} disabled={loading}>
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

