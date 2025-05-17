"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Loader2 } from "lucide-react"

interface RemoveFromCartButtonProps {
  itemId: string
}

export default function RemoveFromCartButton({ itemId }: RemoveFromCartButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleRemoveFromCart = async () => {
    setIsLoading(true)

    try {
      // In a real implementation, we would call an API to remove the item from the cart
      // await fetch(`/api/cart/${itemId}`, {
      //   method: "DELETE",
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast({
        title: "Item removed",
        description: "The item has been removed from your cart",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-destructive"
      onClick={handleRemoveFromCart}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span className="sr-only">Remove item</span>
    </Button>
  )
}
