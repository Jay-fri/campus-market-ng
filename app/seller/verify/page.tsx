"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Upload, Loader2, CheckCircle2 } from "lucide-react"

const phoneSchema = z.object({
  phone: z.string().min(11, { message: "Phone number must be at least 11 digits" }),
  otp: z.string().length(6, { message: "OTP must be 6 digits" }).optional(),
})

export default function SellerVerificationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("phone")
  const [otpSent, setOtpSent] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [selfieVerified, setSelfieVerified] = useState(false)
  const [idVerified, setIdVerified] = useState(false)
  const [selfieImage, setSelfieImage] = useState<string | null>(null)
  const [idImage, setIdImage] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
      otp: "",
    },
  })

  async function onSendOTP(data: z.infer<typeof phoneSchema>) {
    setIsVerifying(true)

    try {
      // In a real implementation, we would send an OTP to the user's phone
      // For now, we'll just simulate this with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setOtpSent(true)
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your phone number.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  async function onVerifyOTP(data: z.infer<typeof phoneSchema>) {
    setIsVerifying(true)

    try {
      // In a real implementation, we would verify the OTP
      // For now, we'll just simulate this with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check if OTP is "123456" (for demo purposes)
      if (data.otp === "123456") {
        setPhoneVerified(true)
        toast({
          title: "Phone Verified",
          description: "Your phone number has been successfully verified.",
        })
        setActiveTab("selfie")
      } else {
        toast({
          title: "Invalid OTP",
          description: "The verification code you entered is incorrect. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const takeSelfie = () => {
    setIsCameraActive(true)

    // In a real implementation, we would access the user's camera and take a photo
    // For now, we'll just simulate this with a timeout and a placeholder image
    setTimeout(() => {
      setSelfieImage("https://source.unsplash.com/random/300x300/?portrait")
      setIsCameraActive(false)
      setSelfieVerified(true)
      toast({
        title: "Selfie Captured",
        description: "Your selfie has been successfully captured.",
      })
    }, 2000)
  }

  const uploadID = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // In a real implementation, we would upload the ID to a storage service
    // For now, we'll just simulate this with a timeout and a placeholder image
    setTimeout(() => {
      setIdImage("https://source.unsplash.com/random/300x300/?id")
      setIdVerified(true)
      toast({
        title: "ID Uploaded",
        description: "Your ID has been successfully uploaded.",
      })
    }, 1000)
  }

  const completeVerification = async () => {
    if (!phoneVerified || !selfieVerified || !idVerified) {
      toast({
        title: "Incomplete Verification",
        description: "Please complete all verification steps before proceeding.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real implementation, we would submit the verification data to the server
      // For now, we'll just simulate this with a timeout
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Verification Complete",
        description: "Your seller account has been verified. You can now start selling products.",
      })

      router.push("/seller")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete verification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle>Seller Verification</CardTitle>
          <CardDescription>Complete these steps to verify your seller account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="phone" disabled={activeTab !== "phone" && !phoneVerified}>
                Phone
              </TabsTrigger>
              <TabsTrigger value="selfie" disabled={!phoneVerified || (activeTab !== "selfie" && !selfieVerified)}>
                Selfie
              </TabsTrigger>
              <TabsTrigger value="id" disabled={!selfieVerified || (activeTab !== "id" && !idVerified)}>
                ID
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phone" className="mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(otpSent ? onVerifyOTP : onSendOTP)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} disabled={otpSent} />
                        </FormControl>
                        <FormDescription>We'll send a verification code to this number.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {otpSent && (
                    <FormField
                      control={form.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter the 6-digit code" {...field} />
                          </FormControl>
                          <FormDescription>Enter the code sent to your phone.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit" className="w-full" disabled={isVerifying}>
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {otpSent ? "Verifying..." : "Sending..."}
                      </>
                    ) : (
                      <>{otpSent ? "Verify Code" : "Send Verification Code"}</>
                    )}
                  </Button>

                  {phoneVerified && (
                    <div className="flex items-center justify-center text-green-600 gap-1 mt-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Phone verified successfully</span>
                    </div>
                  )}
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="selfie" className="mt-4">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-medium">Take a Selfie</h3>
                  <p className="text-sm text-muted-foreground">
                    We need a clear photo of your face for verification purposes.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative w-48 h-48 border-2 border-dashed rounded-full flex items-center justify-center overflow-hidden">
                    {selfieImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selfieImage || "/placeholder.svg"}
                        alt="Selfie"
                        className="w-full h-full object-cover"
                      />
                    ) : isCameraActive ? (
                      <div className="animate-pulse flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm mt-2">Capturing...</span>
                      </div>
                    ) : (
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  {selfieVerified ? (
                    <div className="flex items-center text-green-600 gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Selfie verified successfully</span>
                    </div>
                  ) : (
                    <Button onClick={takeSelfie} disabled={isCameraActive}>
                      {isCameraActive ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Capturing...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Take Selfie
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="id" className="mt-4">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-medium">Upload ID</h3>
                  <p className="text-sm text-muted-foreground">
                    Please upload a valid government-issued ID for verification.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative w-full h-48 border-2 border-dashed rounded-md flex items-center justify-center overflow-hidden">
                    {idImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={idImage || "/placeholder.svg"} alt="ID" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <span className="text-sm mt-2 text-muted-foreground">Click to upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      id="id-upload"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={uploadID}
                      accept="image/*"
                    />
                  </div>

                  {idVerified && (
                    <div className="flex items-center text-green-600 gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>ID verified successfully</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={completeVerification}
            disabled={!phoneVerified || !selfieVerified || !idVerified || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing Verification...
              </>
            ) : (
              "Complete Verification"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
