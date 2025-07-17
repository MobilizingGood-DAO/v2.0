"use client"

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { User, Sparkles } from "lucide-react"
import { supabase } from '@/lib/supabase'

export function UsernamePrompt() {
  const { user } = useAuth();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('users').update({ name }).eq('id', user.id);
    setLoading(false);
    setSuccess(!error);
    setShowInput(false);
  };

  if (!user) return null;

  return (
    <Card className="max-w-md mx-auto mt-24">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          {user.name ? (
            <>Welcome, <span className="font-bold">{user.name}</span>!</>
          ) : (
            <>You are connected with your wallet. Set a nickname if you want!</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showInput ? (
          <>
            <Input
              placeholder="Enter a nickname (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleSave} disabled={loading || !name}>
              {loading ? "Saving..." : "Save Name"}
            </Button>
            {success && <div className="text-green-600 mt-2">Name updated!</div>}
          </>
        ) : (
          <Button onClick={() => setShowInput(true)}>
            {user.name ? "Change Nickname" : "Set Nickname (optional)"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
