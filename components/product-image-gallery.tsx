"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ProductImageGalleryProps {
  images: string[]
  title: string
}

export default function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [loadError, setLoadError] = useState<Record<number, boolean>>({})

  // If no images are provided, use a placeholder
  const displayImages = images && images.length > 0 ? images : ["/placeholder.svg?height=600&width=600"]

  // Handle image load errors
  const handleImageError = (index: number) => {
    setLoadError((prev) => ({ ...prev, [index]: true }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-background">
        <Image
          src={loadError[selectedImage] ? "/placeholder.svg?height=600&width=600" : displayImages[selectedImage]}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          onError={() => handleImageError(selectedImage)}
        />
      </div>
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              className={cn(
                "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border",
                selectedImage === index && "ring-2 ring-primary ring-offset-2",
              )}
              onClick={() => setSelectedImage(index)}
            >
              <Image
                src={loadError[index] ? "/placeholder.svg?height=200&width=200" : image}
                alt={`${title} - Image ${index + 1}`}
                fill
                className="object-cover"
                onError={() => handleImageError(index)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
