import { Card, CardContent } from "@/components/ui/card"
import { User } from "lucide-react"
import type { StudentCard } from "./student-card-generator"

interface StudentCardPreviewProps {
  student: StudentCard
}

export default function StudentCardPreview({ student }: StudentCardPreviewProps) {
  // Get header/footer color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "yellow":
        return "bg-yellow-500"
      case "red":
        return "bg-red-500"
      default:
        return "bg-[#4CAF50]"
    }
  }

  const statusColor = getStatusColor(student.status)

  return (
    <Card className="overflow-hidden border-2 rounded-lg">
      <CardContent className="p-0">
        {/* Header with dynamic color */}
        <div className={`${statusColor} h-12 flex items-center px-4 relative`}>
          {/* Logo */}
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOS--azul-com-branco-S5FqX3tiL4YepaxhdvxI9HKZtBCbST.png"
            alt="Logo"
            className="h-10 w-auto absolute left-2"
          />
          {/* White circle */}
          <div className="h-6 w-6 bg-white rounded-full absolute right-4"></div>
        </div>

        <div className="p-4">
          <div className="flex gap-4">
            {/* Photo container with exact dimensions */}
            <div className="w-[100px] shrink-0">
              {student.photo ? (
                <img
                  src={student.photo || "/placeholder.svg"}
                  alt={`Foto de ${student.name}`}
                  className="w-full aspect-[3/4] object-cover rounded-sm"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center rounded-sm">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Student information with exact spacing and truncation */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <div className="font-semibold text-sm">Nome:</div>
                <div className="text-sm truncate">{student.name}</div>
              </div>

              <div>
                <div className="font-semibold text-sm">Matrícula:</div>
                <div className="text-sm truncate">{student.registrationNumber}</div>
              </div>

              <div>
                <div className="font-semibold text-sm">Responsável:</div>
                <div className="text-sm truncate">{student.guardianName}</div>
              </div>

              <div>
                <div className="font-semibold text-sm">Turma:</div>
                <div className="text-sm truncate">{student.className}</div>
              </div>

              {student.authorizedPeople?.length > 0 && (
                <div>
                  <div className="font-semibold text-sm">Autorizados:</div>
                  <div className="text-sm truncate">{student.authorizedPeople.join(", ")}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with dynamic color */}
        <div className={`${statusColor} p-3 text-center font-medium text-white text-lg`}>{student.schoolName}</div>
      </CardContent>
    </Card>
  )
}

