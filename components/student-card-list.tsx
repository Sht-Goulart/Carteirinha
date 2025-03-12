"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Edit, Trash2, User } from "lucide-react"
import type { StudentCard } from "./student-card-generator"

interface StudentCardListProps {
  students: StudentCard[]
  onEdit: (student: StudentCard) => void
  onDelete: (id: string) => void
  onDownload: (student: StudentCard) => void
}

export default function StudentCardList({ students, onEdit, onDelete, onDownload }: StudentCardListProps) {
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "green":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Verde
          </span>
        )
      case "yellow":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Amarelo
          </span>
        )
      case "red":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Vermelho
          </span>
        )
      default:
        return null
    }
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhum aluno cadastrado. Adicione alunos na aba "Cadastro".
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  {student.photo ? (
                    <img
                      src={student.photo || "/placeholder.svg"}
                      alt={`Foto de ${student.name}`}
                      className="w-10 h-10 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-md">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.registrationNumber}</TableCell>
                <TableCell>{student.className}</TableCell>
                <TableCell>{getStatusBadge(student.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => onEdit(student)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => onDelete(student.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => onDownload(student)}>
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Baixar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

