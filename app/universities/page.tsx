import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function UniversitiesPage() {
  const universities = await db.university.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Universities</h1>
          <p className="text-muted-foreground">Browse products by university</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {universities.map((university) => (
            <Link key={university.id} href={`/universities/${university.id}`}>
              <Card className="h-full overflow-hidden transition-all hover:shadow-md">
                <div className="aspect-video relative">
                  <Image
                    src={university.image || "/placeholder.svg?height=200&width=400"}
                    alt={university.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg">{university.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4" />
                    <span>{university.location}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
