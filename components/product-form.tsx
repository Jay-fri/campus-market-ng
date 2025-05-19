"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, Camera } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface University {
  id: string
  name: string
}

interface ProductFormProps {
  categories: Category[]
  universities: University[]
  defaultUniversityId?: string
  product?: any // For editing existing product
}

const productSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  price: z.coerce.number().positive({ message: "Price must be a positive number" }),
  categoryId: z.string().min(1, { message: "Please select a category" }),
  universityId: z.string().min(1, { message: "Please select a university" }),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"]),
  images: z.array(z.string()).min(1, { message: "At least one image is required" }),
  customCategory: z.string().optional(),
  faceVerification: z.string().min(1, { message: "Facial verification is required" }),
})

type ProductValues = z.infer<typeof productSchema>

export default function ProductForm({ categories, universities, defaultUniversityId = "", product }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || [])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false)

  const defaultValues: Partial<ProductValues> = {
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price || undefined,
    categoryId: product?.categoryId || "",
    universityId: product?.universityId || defaultUniversityId,
    condition: product?.condition || "GOOD",
    images: product?.images || [],
    customCategory: "",
    faceVerification: "",
  }

  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  })

  // Watch for category selection to show/hide custom category input
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "categoryId" && value.categoryId === "other") {
        setShowCustomCategoryInput(true)
      } else if (name === "categoryId") {
        setShowCustomCategoryInput(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  async function onSubmit(data: ProductValues) {
    setIsLoading(true)

    try {
      // If custom category is selected, create it first
      if (data.categoryId === "other" && data.customCategory) {
        const categoryResponse = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.customCategory,
          }),
        })

        if (!categoryResponse.ok) {
          throw new Error("Failed to create new category")
        }

        const categoryResult = await categoryResponse.json()
        data.categoryId = categoryResult.category.id
      }

      const endpoint = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to save product")
      }

      toast({
        title: product ? "Product updated" : "Product created",
        description: product
          ? "Your product has been updated and is pending approval"
          : "Your product has been created and is pending approval",
      })

      router.push("/seller")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)

    try {
      // In a real implementation, we would upload the image to a storage service
      // For now, we'll use FileReader to display the selected image
      const file = files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const newImageUrl = event.target.result.toString()
          const newImageUrls = [...imageUrls, newImageUrl]
          setImageUrls(newImageUrls)
          form.setValue("images", newImageUrls)
          setUploadingImage(false)
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
      setUploadingImage(false)
    }
  }

  const removeImage = (index: number) => {
    const newImageUrls = [...imageUrls]
    newImageUrls.splice(index, 1)
    setImageUrls(newImageUrls)
    form.setValue("images", newImageUrls)
  }

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
            form.setValue("faceVerification", newFaceImage)

            // Stop the camera
            const tracks = stream.getTracks()
            tracks.forEach((track) => track.stop())
            setIsCameraActive(false)
          }
        }, 2000)
      })
      .catch((error) => {
        console.error("Error accessing camera:", error)
        toast({
          title: "Camera Error",
          description: "Could not access your camera. Please check permissions.",
          variant: "destructive",
        })
        setIsCameraActive(false)
      })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Facial Verification Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seller Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="faceVerification"
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
                      <FormDescription>
                        We need to verify your identity before you can list a product. This helps ensure the security of
                        our marketplace.
                      </FormDescription>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter product title" {...field} />
              </FormControl>
              <FormDescription>A clear, descriptive title will help buyers find your product.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your product in detail" className="min-h-[120px]" {...field} />
              </FormControl>
              <FormDescription>
                Include details about the condition, features, and any other relevant information.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₦)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>Set a competitive price for your product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="LIKE_NEW">Like New</SelectItem>
                    <SelectItem value="GOOD">Good</SelectItem>
                    <SelectItem value="FAIR">Fair</SelectItem>
                    <SelectItem value="POOR">Poor</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Select the condition that best describes your product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other (Add new category)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Choose the category that best fits your product.</FormDescription>
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
                  <FormLabel>New Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter new category name" {...field} />
                  </FormControl>
                  <FormDescription>This category will be added to our system.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="universityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>University</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {universities.map((university) => (
                      <SelectItem key={university.id} value={university.id}>
                        {university.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select the university where this product is available.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Images</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <div className="aspect-square rounded-md border border-dashed flex flex-col items-center justify-center p-4 hover:bg-muted/50 cursor-pointer">
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="image-upload"
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground text-center">Click to upload</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <FormDescription>
                    Upload clear images of your product. You can upload multiple images.
                  </FormDescription>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {product ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{product ? "Update Product" : "Create Product"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
