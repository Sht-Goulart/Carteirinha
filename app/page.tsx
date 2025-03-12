import type { Metadata } from "next"
import StudentCardGenerator from "@/components/student-card-generator"

export const metadata: Metadata = {
  title: "Gerador de Carteirinhas de Estudante",
  description: "Sistema para geração de carteirinhas de estudante com 6 unidades por folha A4",
}

export default function Home() {
  return (
    <main className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Gerador de Carteirinhas de Estudante</h1>
      <StudentCardGenerator />
    </main>
  )
}

