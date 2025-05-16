"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, Users, AlertTriangle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface RingSignatureMembersProps {
  isShadowMode: boolean
  walletService: any
}

export function RingSignatureMembers({ isShadowMode, walletService }: RingSignatureMembersProps) {
  const [newMember, setNewMember] = useState("")
  const [ringMembers, setRingMembers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isRemovingMember, setIsRemovingMember] = useState(false)

  useEffect(() => {
    const fetchRingMembers = async () => {
      if (!isShadowMode) return

      try {
        setIsLoading(true)
        const members = await walletService.getRingMembers()
        setRingMembers(members || [])
      } catch (error) {
        console.error("Error fetching ring members:", error)
        // Show error message to user
        alert(`Failed to load ring members: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (walletService && isShadowMode) {
      fetchRingMembers()
    }
  }, [walletService, isShadowMode])

  const addMember = async () => {
    if (!newMember || ringMembers.includes(newMember)) return

    try {
      setIsAddingMember(true)
      await walletService.addRingMember(newMember)
      setRingMembers([...ringMembers, newMember])
      setNewMember("")
    } catch (error) {
      console.error("Error adding ring member:", error)
      // Show error message to user
      alert(`Failed to add ring member: ${error.message}`)
    } finally {
      setIsAddingMember(false)
    }
  }

  const removeMember = async (member) => {
    try {
      setIsRemovingMember(true)
      await walletService.removeRingMember(member)
      setRingMembers(ringMembers.filter((m) => m !== member))
    } catch (error) {
      console.error("Error removing ring member:", error)
      // Show error message to user
      alert(`Failed to remove ring member: ${error.message}`)
    } finally {
      setIsRemovingMember(false)
    }
  }

  if (!isShadowMode) {
    return (
      <Alert className="bg-gray-800 border-cyan-700 text-cyan-300">
        <AlertTriangle className="h-4 w-4 text-cyan-400" />
        <AlertTitle className="text-cyan-300">SHADOW MODE IS DISABLED</AlertTitle>
        <AlertDescription className="text-cyan-400">
          ENABLE SHADOW MODE TO MANAGE RING SIGNATURE MEMBERS
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="bg-slate-800 border-purple-600">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-300">
          <Users className="h-5 w-5 mr-2" />
          Ring Signature Members
        </CardTitle>
        <CardDescription className="text-purple-400">ADD PUBLIC KEYS TO YOUR RING FOR ENHANCED PRIVACY</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-member" className="text-purple-300">
            Add New Member
          </Label>
          <div className="flex space-x-2">
            <Input
              id="new-member"
              placeholder="0x..."
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              className="bg-slate-900 border-purple-700 text-purple-200"
              disabled={isAddingMember}
            />
            <Button
              onClick={addMember}
              disabled={!newMember || isAddingMember}
              className="bg-purple-700 hover:bg-purple-600 border border-purple-500"
            >
              {isAddingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-purple-300">Current Ring Members ({ringMembers.length})</Label>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {ringMembers.length === 0 ? (
                <p className="text-sm text-purple-400 py-2 border border-dashed border-purple-700 rounded p-3 text-center">
                  NO RING MEMBERS ADDED YET
                </p>
              ) : (
                ringMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-md border-purple-700 bg-slate-900"
                  >
                    <span className="font-mono text-sm truncate text-purple-300">
                      {member.substring(0, 6)}...{member.substring(member.length - 4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member)}
                      className="h-8 w-8 p-0 hover:bg-purple-900/50 text-purple-400"
                      disabled={isRemovingMember}
                    >
                      {isRemovingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-purple-400 border-t border-purple-800/50 pt-4 w-full text-center">
          RECOMMENDED: ADD AT LEAST 5 MEMBERS TO YOUR RING FOR BETTER PRIVACY
        </div>
      </CardFooter>
    </Card>
  )
}

