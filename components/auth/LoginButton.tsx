"use client"

import { signIn } from "next-auth/react"
import { useWallet } from "@solana/wallet-adapter-react"
import bs58 from "bs58"
import { Button } from "@/components/ui/Button"
import { SigninMessage } from "@/lib/auth/SigninMessage"

export default function LoginButton() {
  const { signMessage, publicKey, connect, disconnect } = useWallet()

  const handleSignIn = async () => {
    try {
      if (!publicKey) {
        await connect()
        return
      }

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: publicKey.toBase58(),
        statement: `Sign this message to sign in to the app.`,
        nonce: `${publicKey.toBase58()}-${Date.now()}`,
      })

      const encodedMessage = new TextEncoder().encode(message.prepare())
      const signedMessage = await signMessage!(encodedMessage)
      const signature = bs58.encode(signedMessage)

      await signIn("credentials", {
        message: JSON.stringify(message),
        signature,
        publicKey: publicKey.toBase58(),
        redirect: true,
        callbackUrl: "/dashboard",
      })
    } catch (error) {
      console.error("Login error:", error)
      disconnect()
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white"
    >
      <img src="/phantom.svg" alt="Phantom" className="w-5 h-5" />
      <span>Connect Phantom Wallet</span>
    </Button>
  )
} 