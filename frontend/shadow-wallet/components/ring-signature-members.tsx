"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWallet } from "../contexts/WalletContext";
// 修正导入，确保路径和文件名一致
import { Label } from "@/components/ui/label"; // 确保文件名为 label.tsx 或调整为正确路径

interface RingSignatureMembersProps {
  isShadowMode: boolean;
  walletService: any;
}

export function RingSignatureMembers({ isShadowMode, walletService }: RingSignatureMembersProps) {
  const [ringMembers, setRingMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { shadowWalletAddress } = useWallet();

  useEffect(() => {
    const fetchRingMembers = async () => {
      if (!isShadowMode || !shadowWalletAddress) {
        console.log("Shadow mode disabled or shadowWalletAddress not available:", {
          isShadowMode,
          shadowWalletAddress,
        });
        return;
      }

      try {
        setIsLoading(true);
        console.log("Fetching ring members for shadowWalletAddress:", shadowWalletAddress);
        const members = await walletService.getRingMembers(shadowWalletAddress);
        console.log("Fetched ring members:", members);
        setRingMembers(members || []);
      } catch (error) {
        console.error("Error fetching ring members:", error);
        alert(`Failed to load ring members: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (walletService) {
      fetchRingMembers();
    }
  }, [walletService, isShadowMode, shadowWalletAddress]);

  if (!isShadowMode) {
    return (
      <Alert className="bg-gray-800 border-cyan-700 text-cyan-300">
        <AlertTriangle className="h-4 w-4 text-cyan-400" />
        <AlertTitle className="text-cyan-300">SHADOW MODE IS DISABLED</AlertTitle>
        <AlertDescription className="text-cyan-400">
          ENABLE SHADOW MODE TO MANAGE RING SIGNATURE MEMBERS
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-slate-800 border-purple-600">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-300">
          <Users className="h-5 w-5 mr-2" />
          Ring Signature Members
        </CardTitle>
        <CardDescription className="text-purple-400">VIEW PUBLIC KEYS IN YOUR RING FOR ENHANCED PRIVACY</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-purple-300">Current Ring Members ({ringMembers.length})</Label>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {ringMembers.length === 0 ? (
                <p className="text-sm text-purple-400 py-2 border border-dashed border-purple-700 rounded p-3 text-center">
                  NO RING MEMBERS ADDED YET
                </p>
              ) : (
                ringMembers.map((member, index) => (
                  <div
                    key={index}
                    className="p-2 border rounded-md border-purple-700 bg-slate-900"
                  >
                    <span className="font-mono text-sm truncate text-purple-300">
                      {member.substring(0, 6)}...{member.substring(member.length - 4)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-purple-400 border-t border-purple-800/50 pt-4 w-full text-center">
          RECOMMENDED: AT LEAST 5 MEMBERS IN YOUR RING FOR BETTER PRIVACY
        </div>
      </CardFooter>
    </Card>
  );
}