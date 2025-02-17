import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface NotesAndStatusProps {
  initialNotes?: string
  initialStatus?: "pendiente" | "en_revision" | "finalizado"
  onSave: (notes: string, status: "pendiente" | "en_revision" | "finalizado") => void
}

export function NotesAndStatus({ initialNotes = "", initialStatus, onSave }: NotesAndStatusProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [status, setStatus] = useState(initialStatus)

  const handleSave = () => {
    onSave(notes, status as "pendiente" | "en_revision" | "finalizado")
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">
          Estado
        </Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_revision">En Revisión</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Notas
        </Label>
        <Textarea
          id="notes"
          placeholder="Agregar notas sobre el trámite..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[100px] resize-none"
        />
      </div>

      <Button onClick={handleSave} className="w-full bg-blue-500 text-white hover:bg-blue-600">
        Guardar cambios
      </Button>
    </div>
  )
}

