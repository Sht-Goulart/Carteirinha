"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileDown, X } from "lucide-react"
import JSZip from "jszip"
import FileSaver from "file-saver"
import StudentCardPreview from "./student-card-preview"
import StudentCardList from "./student-card-list"
import ImportSpreadsheet from "./import-spreadsheet"

export type StudentCard = {
  id: string
  name: string
  registrationNumber: string
  className: string
  guardianName: string
  schoolName: string
  photo: string | null
  status: "green" | "yellow" | "red"
  authorizedPeople: string[]
}

export default function StudentCardGenerator() {
  const [students, setStudents] = useState<StudentCard[]>([])
  const [currentStudent, setCurrentStudent] = useState<StudentCard>({
    id: "",
    name: "",
    registrationNumber: "",
    className: "",
    guardianName: "",
    schoolName: "Escola Adventista de Santa Cecília",
    photo: null,
    status: "green",
    authorizedPeople: [],
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [newAuthorizedPerson, setNewAuthorizedPerson] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentStudent((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: "green" | "yellow" | "red") => {
    setCurrentStudent((prev) => ({ ...prev, status: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCurrentStudent((prev) => ({ ...prev, photo: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddStudent = () => {
    if (isEditing) {
      setStudents((prev) => prev.map((student) => (student.id === currentStudent.id ? currentStudent : student)))
      setIsEditing(false)
    } else {
      const newStudent = {
        ...currentStudent,
        id: Date.now().toString(),
      }
      setStudents((prev) => [...prev, newStudent])
    }

    // Reset form
    setCurrentStudent({
      id: "",
      name: "",
      registrationNumber: "",
      className: "",
      guardianName: "",
      schoolName: "Escola Adventista de Santa Cecília",
      photo: null,
      status: "green",
      authorizedPeople: [],
    })
  }

  const handleEditStudent = (student: StudentCard) => {
    setCurrentStudent(student)
    setIsEditing(true)
  }

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((student) => student.id !== id))
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "yellow":
        return "#FFC107"
      case "red":
        return "#F44336"
      default:
        return "#4CAF50"
    }
  }

  const handleAddAuthorizedPerson = () => {
    if (newAuthorizedPerson.trim()) {
      setCurrentStudent((prev) => ({
        ...prev,
        authorizedPeople: [...prev.authorizedPeople, newAuthorizedPerson.trim()],
      }))
      setNewAuthorizedPerson("")
    }
  }

  const handleRemoveAuthorizedPerson = (index: number) => {
    setCurrentStudent((prev) => ({
      ...prev,
      authorizedPeople: prev.authorizedPeople.filter((_, i) => i !== index),
    }))
  }

  // Fixed renderCardToCanvas function to address scope issues
  const renderCardToCanvas = async (student: StudentCard, canvas: HTMLCanvasElement): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        // Card dimensions (standard ID card size in pixels at 300 DPI)
        const cardWidth = 1004 // ~85mm at 300 DPI
        const cardHeight = 638 // ~54mm at 300 DPI

        // Set canvas size
        canvas.width = cardWidth
        canvas.height = cardHeight

        // Fill background
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, cardWidth, cardHeight)

        // Draw header with status color
        ctx.fillStyle = getStatusColor(student.status)
        ctx.fillRect(0, 0, cardWidth, 118) // Header height

        // Define these variables at the top level so they're accessible to all functions
        const photoWidth = 295
        const photoHeight = 390
        const photoX = 59
        const photoY = 177
        const textX = photoX + photoWidth + 59
        const lineHeight = 70

        // Load and draw the logo
        const logo = new Image()
        logo.crossOrigin = "anonymous"
        logo.onload = () => {
          // Draw logo in the header (left side)
          const logoHeight = 100
          const logoWidth = (logo.width * logoHeight) / logo.height
          ctx.drawImage(logo, 10, 9, logoWidth, logoHeight)

          // Draw white circle (moved to the right to accommodate logo)
          ctx.fillStyle = "#FFFFFF"
          ctx.beginPath()
          ctx.arc(cardWidth - 59, 59, 35, 0, Math.PI * 2)
          ctx.fill()

          // Add photo if available
          if (student.photo) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
              ctx.drawImage(img, photoX, photoY, photoWidth, photoHeight)
              drawTextAndFooter()
            }
            img.onerror = () => {
              ctx.fillStyle = "#F0F0F0"
              ctx.fillRect(photoX, photoY, photoWidth, photoHeight)
              drawTextAndFooter()
            }
            img.src = student.photo
          } else {
            ctx.fillStyle = "#F0F0F0"
            ctx.fillRect(photoX, photoY, photoWidth, photoHeight)
            drawTextAndFooter()
          }
        }
        logo.onerror = () => {
          console.error("Error loading logo")

          // Draw white circle
          ctx.fillStyle = "#FFFFFF"
          ctx.beginPath()
          ctx.arc(cardWidth - 59, 59, 35, 0, Math.PI * 2)
          ctx.fill()

          // Add photo if available
          if (student.photo) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
              ctx.drawImage(img, photoX, photoY, photoWidth, photoHeight)
              drawTextAndFooter()
            }
            img.onerror = () => {
              ctx.fillStyle = "#F0F0F0"
              ctx.fillRect(photoX, photoY, photoWidth, photoHeight)
              drawTextAndFooter()
            }
            img.src = student.photo
          } else {
            ctx.fillStyle = "#F0F0F0"
            ctx.fillRect(photoX, photoY, photoWidth, photoHeight)
            drawTextAndFooter()
          }
        }
        logo.src =
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOS--azul-com-branco-S5FqX3tiL4YepaxhdvxI9HKZtBCbST.png"

        function drawTextAndFooter() {
          ctx.fillStyle = "#000000"

          // Function to add a field with label and value
          const addField = (label: string, value: string, yPosition: number) => {
            ctx.font = "bold 24px Helvetica"
            ctx.fillText(label, textX, yPosition)

            ctx.font = "24px Helvetica"

            // Handle text that's too long
            const maxWidth = cardWidth - textX - 59
            if (ctx.measureText(value).width > maxWidth) {
              let truncatedValue = value
              while (ctx.measureText(truncatedValue + "...").width > maxWidth && truncatedValue.length > 3) {
                truncatedValue = truncatedValue.slice(0, -1)
              }
              value = truncatedValue + (truncatedValue !== value ? "..." : "")
            }

            ctx.fillText(value, textX, yPosition + 35)
          }

          // Add fields with exact positioning
          let currentY = photoY
          addField("Nome:", student.name, currentY)
          currentY += lineHeight
          addField("Matrícula:", student.registrationNumber, currentY)
          currentY += lineHeight
          addField("Responsável:", student.guardianName, currentY)
          currentY += lineHeight
          addField("Turma:", student.className, currentY)

          // Add authorized people if any
          if (student.authorizedPeople.length > 0) {
            currentY += lineHeight
            addField("Autorizados:", student.authorizedPeople.join(", "), currentY)
          }

          // Draw footer with status color
          ctx.fillStyle = getStatusColor(student.status)
          ctx.fillRect(0, cardHeight - 118, cardWidth, 118)

          // Add school name to footer with larger font
          ctx.fillStyle = "#FFFFFF"
          ctx.font = "bold 32px Helvetica" // Increased font size

          // Center school name in footer
          let schoolName = student.schoolName
          const maxWidth = cardWidth - 118
          if (ctx.measureText(schoolName).width > maxWidth) {
            let truncatedName = schoolName
            while (ctx.measureText(truncatedName + "...").width > maxWidth && truncatedName.length > 3) {
              truncatedName = truncatedName.slice(0, -1)
            }
            schoolName = truncatedName + (truncatedName !== schoolName ? "..." : "")
          }

          const textWidth = ctx.measureText(schoolName).width
          ctx.fillText(schoolName, (cardWidth - textWidth) / 2, cardHeight - 48) // Adjusted Y position

          // Draw border
          ctx.strokeStyle = "#CCCCCC"
          ctx.lineWidth = 1
          ctx.strokeRect(0, 0, cardWidth, cardHeight)

          resolve()
        }
      } catch (error) {
        console.error("Error rendering card:", error)
        reject(error)
      }
    })
  }

  const downloadCardAsPNG = async (student: StudentCard) => {
    try {
      if (!canvasRef.current) return

      await renderCardToCanvas(student, canvasRef.current)

      // Convert canvas to data URL and download
      const dataUrl = canvasRef.current.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `carteirinha-${student.name.replace(/\s+/g, "-").toLowerCase()}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error downloading card:", error)
    }
  }

  const handleGeneratePNGs = async () => {
    if (students.length === 0) return

    setIsGenerating(true)

    try {
      if (!canvasRef.current) return

      const zip = new JSZip()
      const folder = zip.folder("carteirinhas")

      // Process each student card
      for (const student of students) {
        await renderCardToCanvas(student, canvasRef.current)

        // Get PNG data from canvas
        const dataUrl = canvasRef.current.toDataURL("image/png")
        const base64Data = dataUrl.split(",")[1]

        // Add to zip file
        folder?.file(`carteirinha-${student.name.replace(/\s+/g, "-").toLowerCase()}.png`, base64Data, { base64: true })
      }

      // Generate and download zip file
      const content = await zip.generateAsync({ type: "blob" })
      FileSaver.saveAs(content, "carteirinhas-estudantes.zip")
    } catch (error) {
      console.error("Error generating PNGs:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="form">Cadastro</TabsTrigger>
          <TabsTrigger value="import">Importar</TabsTrigger>
          <TabsTrigger value="list">Lista de Alunos ({students.length})</TabsTrigger>
          <TabsTrigger value="preview">Visualização</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Aluno</Label>
                    <Input
                      id="name"
                      name="name"
                      value={currentStudent.name}
                      onChange={handleInputChange}
                      placeholder="Nome completo do aluno"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Número de Matrícula</Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      value={currentStudent.registrationNumber}
                      onChange={handleInputChange}
                      placeholder="Número de matrícula"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Turma</Label>
                    <Input
                      id="className"
                      name="className"
                      value={currentStudent.className}
                      onChange={handleInputChange}
                      placeholder="Turma do aluno"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Nome do Responsável</Label>
                    <Input
                      id="guardianName"
                      name="guardianName"
                      value={currentStudent.guardianName}
                      onChange={handleInputChange}
                      placeholder="Nome do responsável"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolName">Nome da Escola</Label>
                  <Input
                    id="schoolName"
                    name="schoolName"
                    value={currentStudent.schoolName}
                    onChange={handleInputChange}
                    placeholder="Nome da escola"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Foto do Aluno</Label>
                  <Input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} />
                  {currentStudent.photo && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Prévia da foto:</p>
                      <img
                        src={currentStudent.photo || "/placeholder.svg"}
                        alt="Prévia"
                        className="w-24 h-32 object-cover border rounded-md"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Situação do Aluno</Label>
                  <RadioGroup
                    value={currentStudent.status}
                    onValueChange={(value) => handleStatusChange(value as "green" | "yellow" | "red")}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="green" id="green" />
                      <Label htmlFor="green" className="flex items-center">
                        <div className="w-4 h-4 bg-green-200 rounded-full mr-2"></div>
                        Verde - Pode sair sozinho
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yellow" id="yellow" />
                      <Label htmlFor="yellow" className="flex items-center">
                        <div className="w-4 h-4 bg-yellow-200 rounded-full mr-2"></div>
                        Amarelo - Sai com van escolar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="red" id="red" />
                      <Label htmlFor="red" className="flex items-center">
                        <div className="w-4 h-4 bg-red-200 rounded-full mr-2"></div>
                        Vermelho - Sai apenas com responsável
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Pessoas Autorizadas</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newAuthorizedPerson}
                      onChange={(e) => setNewAuthorizedPerson(e.target.value)}
                      placeholder="Nome da pessoa autorizada"
                    />
                    <Button type="button" onClick={handleAddAuthorizedPerson} variant="secondary">
                      Adicionar
                    </Button>
                  </div>
                  {currentStudent.authorizedPeople.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {currentStudent.authorizedPeople.map((person, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                          <span>{person}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveAuthorizedPerson(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleAddStudent}>{isEditing ? "Atualizar Aluno" : "Adicionar Aluno"}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <ImportSpreadsheet
            onImport={(importedStudents) => {
              // Ensure imported students have the authorizedPeople field
              const studentsWithAuthorizedPeople = importedStudents.map((student) => ({
                ...student,
                authorizedPeople: student.authorizedPeople || [],
              }))
              setStudents((prev) => [...prev, ...studentsWithAuthorizedPeople])
            }}
          />
        </TabsContent>

        <TabsContent value="list">
          <StudentCardList
            students={students}
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
            onDownload={downloadCardAsPNG}
          />

          {students.length > 0 && (
            <Button className="w-full mt-4" onClick={handleGeneratePNGs} disabled={isGenerating}>
              {isGenerating ? (
                "Gerando Imagens..."
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Baixar Todas as Carteirinhas (ZIP)
                </>
              )}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <div key={student.id} className="relative group">
                  <StudentCardPreview student={student} />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <Button variant="secondary" size="sm" onClick={() => downloadCardAsPNG(student)}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PNG
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {students.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum aluno cadastrado. Adicione alunos na aba "Cadastro".
              </p>
            )}

            {students.length > 0 && (
              <Button className="w-full mt-4" onClick={handleGeneratePNGs} disabled={isGenerating}>
                {isGenerating ? (
                  "Gerando Imagens..."
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Baixar Todas as Carteirinhas (ZIP)
                  </>
                )}
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden canvas for rendering cards */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </>
  )
}

