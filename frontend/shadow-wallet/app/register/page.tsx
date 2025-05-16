"use client"

import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-center items-center min-h-[80vh]">
        <RegisterForm />
      </div>
    </div>
  )
}

