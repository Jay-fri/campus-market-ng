"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Camera, Upload } from "lucide-react"

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone: z.string().min(11, { message: "Phone number must be at least 11 characters" }),
    university: z.string().min(1, { message: "Please select your university" }),
    customUniversity: z.string().optional(),
    category: z.string().optional(),
    customCategory: z.string().optional(),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
    role: z.enum(["BUYER", "SELLER"]),
    profileImage: z.string().optional(),
    faceImage: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.university === "other" && (!data.customUniversity || data.customUniversity.length < 2)) {
        return false
      }
      return true
    },
    {
      message: "Please enter your university name",
      path: ["customUniversity"],
    },
  )
  .refine(
    (data) => {
      if (data.role === "SELLER" && !data.faceImage) {
        return false
      }
      return true
    },
    {
      message: "Facial verification is required for sellers",
      path: ["faceImage"],
    },
  )

type RegisterValues = z.infer<typeof registerSchema>

interface University {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("BUYER")
  const [universities, setUniversities] = useState<University[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      university: "",
      customUniversity: "",
      category: "",
      customCategory: "",
      password: "",
      confirmPassword: "",
      role: "BUYER",
      profileImage: "",
      faceImage: "",
    },
  })

  // Fetch universities and categories on component mount
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch("/api/universities")
        if (response.ok) {
          const data = await response.json()
          setUniversities(data.universities)
        }
      } catch (error) {
        console.error("Error fetching universities:", error)
      } finally {
        setIsLoadingUniversities(false)
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchUniversities()
    fetchCategories()
  }, [])

  // Watch for university selection to show/hide custom university input
  const selectedUniversity = form.watch("university")
  const showCustomUniversityInput = selectedUniversity === "other"

  // Watch for category selection to show/hide custom category input
  const selectedCategory = form.watch("category")
  const showCustomCategoryInput = selectedCategory === "other"

  const takeFacialVerification = () => {
    setIsCameraActive(true)

    // Create a video element to capture the camera feed
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream
        video.play()

        // After 2 seconds, take a snapshot
        setTimeout(() => {
          if (context) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Convert canvas to data URL
            const newFaceImage = canvas.toDataURL("image/jpeg")
            setFaceImage(newFaceImage)
            form.setValue("faceImage", newFaceImage)

            // Stop the camera
            const tracks = stream.getTracks()
            tracks.forEach((track) => track.stop())
            setIsCameraActive(false)
          }
        }, 2000)
      })
      .catch((error) => {
        console.error("Error accessing camera:", error)
        setError("Could not access your camera. Please check permissions.")
        setIsCameraActive(false)
      })
  }

  const uploadProfileImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Use FileReader to display the selected image
    const file = files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      if (event.target && event.target.result) {
        const newProfileImage = event.target.result.toString()
        setProfileImage(newProfileImage)
        form.setValue("profileImage", newProfileImage)
      }
    }

    reader.readAsDataURL(file)
  }

  async function onSubmit(data: RegisterValues) {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Submitting registration data:", { ...data, role: activeTab })

      // Prepare the data for submission
      const submissionData = {
        ...data,
        role: activeTab,
      }

      // If custom university is provided, add it to the submission
      if (data.university === "other" && data.customUniversity) {
        submissionData.newUniversity = data.customUniversity
      }

      // If custom category is provided, add it to the submission
      if (data.category === "other" && data.customCategory) {
        submissionData.newCategory = data.customCategory
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()
      console.log("Registration response:", result)

      if (!response.ok) {
        setError(result.message || "Registration failed. Please try again.")
        setIsLoading(false)
        return
      }

      router.push("/login?registered=true")
    } catch (error) {
      console.error("Registration error:", error)
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-full py-10 w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Choose your account type and enter your details to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Tabs defaultValue="BUYER" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="BUYER">Buyer</TabsTrigger>
                <TabsTrigger value="SELLER">Seller</TabsTrigger>
              </TabsList>
              <TabsContent value="BUYER">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="08012345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="university"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>University</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your university" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingUniversities ? (
                                <SelectItem value="loading" disabled>
                                  Loading universities...
                                </SelectItem>
                              ) : (
                                <>
                                  {universities.map((university) => (
                                    <SelectItem key={university.id} value={university.id}>
                                      {university.name}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="other">Other (Add your university)</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {showCustomUniversityInput && (
                      <FormField
                        control={form.control}
                        name="customUniversity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your University Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your university name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="profileImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture</FormLabel>
                          <FormControl>
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative w-32 h-32 border-2 border-dashed rounded-full flex items-center justify-center overflow-hidden">
                                {profileImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={profileImage || "/placeholder.svg"}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                )}
                                <input
                                  type="file"
                                  id="profile-upload"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={uploadProfileImage}
                                  accept="image/*"
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Click to upload your profile picture
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="SELLER">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="08012345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="university"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>University</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your university" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingUniversities ? (
                                <SelectItem value="loading" disabled>
                                  Loading universities...
                                </SelectItem>
                              ) : (
                                <>
                                  {universities.map((university) => (
                                    <SelectItem key={university.id} value={university.id}>
                                      {university.name}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="other">Other (Add your university)</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {showCustomUniversityInput && (
                      <FormField
                        control={form.control}
                        name="customUniversity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your University Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your university name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Selling Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your main category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingCategories ? (
                                <SelectItem value="loading" disabled>
                                  Loading categories...
                                </SelectItem>
                              ) : (
                                <>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="other">Other (Add new category)</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {showCustomCategoryInput && (
                      <FormField
                        control={form.control}
                        name="customCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Category</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your category name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="profileImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture</FormLabel>
                          <FormControl>
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative w-32 h-32 border-2 border-dashed rounded-full flex items-center justify-center overflow-hidden">
                                {profileImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={profileImage || "/placeholder.svg"}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                )}
                                <input
                                  type="file"
                                  id="profile-upload"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={uploadProfileImage}
                                  accept="image/*"
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Click to upload your profile picture
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="faceImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facial Verification (Required)</FormLabel>
                          <FormControl>
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative w-48 h-48 border-2 border-dashed rounded-full flex items-center justify-center overflow-hidden">
                                {faceImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={faceImage || "/placeholder.svg"}
                                    alt="Facial Verification"
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
                              {faceImage ? (
                                <span className="text-sm text-green-600">Facial verification complete</span>
                              ) : (
                                <Button
                                  type="button"
                                  onClick={takeFacialVerification}
                                  disabled={isCameraActive}
                                  className="w-full"
                                >
                                  {isCameraActive ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Capturing...
                                    </>
                                  ) : (
                                    <>
                                      <Camera className="mr-2 h-4 w-4" />
                                      Take Facial Verification Photo
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="text-sm text-muted-foreground">
                      By registering as a seller, you will need to verify your identity and phone number before you can
                      start selling.
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create seller account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="hover:text-primary">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
