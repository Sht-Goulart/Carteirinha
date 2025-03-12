"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react"
import * as XLSX from "xlsx"
import type { StudentCard } from "./student-card-generator"

interface ImportSpreadsheetProps {
  onImport: (students: StudentCard[]) => void
}

export default function ImportSpreadsheet({ onImport }: ImportSpreadsheetProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [columnMapping, setColumnMapping] = useState({
    name: "",
    registrationNumber: "",
    className: "",
    guardianName: "",
    schoolName: "",
    status: "",
    authorizedPeople: "", // Added mapping for authorized people
  })
  const [availableColumns, setAvailableColumns] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      parseFile(selectedFile)
    }
  }

  const parseFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length < 2) {
        setError("A planilha deve conter pelo menos um cabeçalho e uma linha de dados.")
        return
      }

      // Get headers (first row)
      const headers = jsonData[0] as string[]
      setAvailableColumns(headers)

      // Show preview (first 5 rows)
      setPreview(jsonData.slice(1, 6))

      // Try to auto-map columns based on common header names
      const newMapping = { ...columnMapping }
      headers.forEach((header, index) => {
        const headerLower = header.toLowerCase()
        if ((headerLower.includes("nome") && headerLower.includes("aluno")) || headerLower === "nome") {
          newMapping.name = header
        } else if (
          headerLower.includes("matrícula") ||
          headerLower.includes("matricula") ||
          headerLower.includes("registro")
        ) {
          newMapping.registrationNumber = header
        } else if (headerLower.includes("turma") || headerLower.includes("classe") || headerLower.includes("sala")) {
          newMapping.className = header
        } else if (
          headerLower.includes("responsável") ||
          headerLower.includes("responsavel") ||
          headerLower.includes("guardião")
        ) {
          newMapping.guardianName = header
        } else if (
          headerLower.includes("escola") ||
          headerLower.includes("instituição") ||
          headerLower.includes("colégio")
        ) {
          newMapping.schoolName = header
        } else if (headerLower.includes("status") || headerLower.includes("situação") || headerLower.includes("cor")) {
          newMapping.status = header
        } else if (
          headerLower.includes("autorizado") ||
          headerLower.includes("pessoas") ||
          headerLower.includes("autorizados")
        ) {
          newMapping.authorizedPeople = header
        }
      })
      setColumnMapping(newMapping)
    } catch (err) {
      console.error(err)
      setError("Erro ao processar o arquivo. Verifique se é um arquivo Excel ou CSV válido.")
    }
  }

  const handleMappingChange = (field: string, value: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImport = async () => {
    if (!file) {
      setError("Nenhum arquivo selecionado.")
      return
    }

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Map spreadsheet data to student cards
      const importedStudents: StudentCard[] = jsonData.map((row: any, index) => {
        // Determine status based on the mapped column
        let status: "green" | "yellow" | "red" = "green"
        if (columnMapping.status) {
          const statusValue = row[columnMapping.status]?.toString().toLowerCase() || ""

          if (statusValue.includes("verde") || statusValue.includes("green") || statusValue === "1") {
            status = "green"
          } else if (statusValue.includes("amarelo") || statusValue.includes("yellow") || statusValue === "2") {
            status = "yellow"
          } else if (statusValue.includes("vermelho") || statusValue.includes("red") || statusValue === "3") {
            status = "red"
          }
        }

        // Process authorized people
        let authorizedPeople: string[] = []
        if (columnMapping.authorizedPeople && row[columnMapping.authorizedPeople]) {
          const peopleStr = row[columnMapping.authorizedPeople].toString()
          // Split by commas, semicolons, or pipes
          authorizedPeople = peopleStr
            .split(/[,;|]/)
            .map((p) => p.trim())
            .filter((p) => p)
        }

        return {
          id: `imported-${Date.now()}-${index}`,
          name: row[columnMapping.name] || "",
          registrationNumber: row[columnMapping.registrationNumber]?.toString() || "",
          className: row[columnMapping.className] || "",
          guardianName: row[columnMapping.guardianName] || "",
          schoolName: row[columnMapping.schoolName] || "",
          photo: null, // Photos need to be handled separately
          status: status,
          authorizedPeople: authorizedPeople,
        }
      })

      onImport(importedStudents)
      setFile(null)
      setPreview([])
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Erro ao importar os dados. Verifique o mapeamento das colunas.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar Alunos da Planilha
        </CardTitle>
        <CardDescription>Importe dados de alunos de uma planilha Excel ou CSV</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spreadsheet">Selecione uma planilha (Excel ou CSV)</Label>
            <Input id="spreadsheet" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
            <p className="text-sm text-muted-foreground">
              A planilha deve conter colunas para as informações dos alunos.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {preview.length > 0 && (
            <>
              <div className="space-y-4 mt-4">
                <h3 className="text-sm font-medium">Mapeamento de Colunas</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione quais colunas da planilha correspondem a cada campo:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-column">Nome do Aluno</Label>
                    <select
                      id="name-column"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={columnMapping.name}
                      onChange={(e) => handleMappingChange("name", e.target.value)}
                    >
                      <option value="">Selecione uma coluna</option>
                      {availableColumns.map((column, index) => (
                        <option key={index} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration-column">Número de Matrícula</Label>
                    <select
                      id="registration-column"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={columnMapping.registrationNumber}
                      onChange={(e) => handleMappingChange("registrationNumber", e.target.value)}
                    >
                      <option value="">Selecione uma coluna</option>
                      {availableColumns.map((column, index) => (
                        <option key={index} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="class-column">Turma</Label>
                    <select
                      id="class-column"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={columnMapping.className}
                      onChange={(e) => handleMappingChange("className", e.target.value)}
                    >
                      <option value="">Selecione uma coluna</option>
                      {availableColumns.map((column, index) => (
                        <option key={index} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardian-column">Nome do Responsável</Label>
                    <select
                      id="guardian-column"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={columnMapping.guardianName}
                      onChange={(e) => handleMappingChange("guardianName", e.target.value)}
                    >
                      <option value="">Selecione uma coluna</option>
                      {availableColumns.map((column, index) => (
                        <option key={index} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school-column">Nome da Escola</Label>
                    <select
                      id="school-column"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={columnMapping.schoolName}
                      onChange={(e) => handleMappingChange("schoolName", e.target.value)}
                    >
                      <option value="">Selecione uma coluna</option>
                      {availableColumns.map((column, index) => (
                        <option key={index} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status-column">Status/Cor (Verde, Amarelo, Vermelho)</Label>
                    <select
                      id="status-column"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={columnMapping.status}
                      onChange={(e) => handleMappingChange("status", e.target.value)}
                    >
                      <option value="">Selecione uma coluna</option>
                      {availableColumns.map((column, index) => (
                        <option key={index} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Verde = "verde", "green", "1" | Amarelo = "amarelo", "yellow", "2" | Vermelho = "vermelho", "red",
                      "3"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authorized-column">Pessoas Autorizadas</Label>
                    <select
                      id="authorized-column"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={columnMapping.authorizedPeople}
                      onChange={(e) => handleMappingChange("authorizedPeople", e.target.value)}
                    >
                      <option value="">Selecione uma coluna</option>
                      {availableColumns.map((column, index) => (
                        <option key={index} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Separe os nomes por vírgulas, ponto-e-vírgulas ou barras verticais
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Prévia dos Dados</h3>
                <div className="border rounded-md overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        {availableColumns.map((column, index) => (
                          <th
                            key={index}
                            className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.map((row: any, rowIndex) => (
                        <tr key={rowIndex}>
                          {availableColumns.map((column, colIndex) => (
                            <td key={colIndex} className="px-3 py-2 text-sm">
                              {row[colIndex] !== undefined ? String(row[colIndex]) : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mostrando as primeiras {preview.length} linhas de dados.
                </p>
              </div>

              <Button onClick={handleImport} className="w-full mt-4" disabled={!columnMapping.name}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Alunos
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

