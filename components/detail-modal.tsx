import type { FormDataType } from "@/types/formDataTypes"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotesAndStatus } from "./notes-and-status"
import { updateDoc, doc } from "firebase/firestore"
import { db } from "@/firebaseConfig"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, LinkIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface DetailModalProps {
  isOpen: boolean
  onClose: () => void
  data: FormDataType | null
  onStatusUpdate: (id: string, status: "pendiente" | "en_revision" | "finalizado") => void
}

export function DetailModal({ isOpen, onClose, data, onStatusUpdate }: DetailModalProps) {
  const handleSaveNotesAndStatus = async (notes: string, status: "pendiente" | "en_revision" | "finalizado") => {
    if (data && data.id) {
      try {
        const docRef = doc(db, "formulariosComercialessinlocal", data.id)
        await updateDoc(docRef, { notes, status })
        onStatusUpdate(data.id, status)
      } catch (error) {
        console.error("Error updating notes and status: ", error)
      }
    }
  }

  const formatField = (key: string, value: unknown) => {
    if (key === "timestamp") {
      if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
        return value.toDate().toLocaleString()
      } else if (value instanceof Date) {
        return value.toLocaleString()
      } else if (typeof value === "string") {
        return new Date(value).toLocaleString()
      }
    }
    if (typeof value === "boolean") {
      return value ? "Sí" : "No"
    }
    return value?.toString() || "N/A"
  }

  const formatKey = (key: string) => {
    const keyMap: { [key: string]: string } = {
      tipoPersona: "Tipo de Persona",
      dni: "DNI",
      cuit: "CUIT/CUIL",
      apellido: "Apellido y Nombre",
      email: "Email",
      telefono: "Teléfono",
      domicilio: "Domicilio",
      direccion: "Dirección",
      localOficina: "Local/Oficina",
      categoria: "Categoría",
      subCategoria: "Tipo de Trámite",
      actividadPrincipal: "Actividad Principal",
      timestamp: "Fecha de envío",
    }
    return keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalles de la solicitud</DialogTitle>
          <DialogDescription>Información completa de la pre-inscripción comercial</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="grid grid-cols-2 gap-6">
            <Card className="col-span-2 md:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data &&
                    Object.entries(data).map(([key, value]) => {
                      if (key !== "fileURLs" && key !== "notes" && key !== "status" && key !== "id") {
                        return (
                          <div key={key}>
                            <div className="text-sm font-medium text-gray-500">{formatKey(key)}</div>
                            <div className="text-sm mt-1">{formatField(key, value)}</div>
                            <Separator className="mt-2" />
                          </div>
                        )
                      }
                      return null
                    })}
                </div>
              </CardContent>
            </Card>

            <div className="col-span-2 md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Documentos Adjuntos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data && data.fileURLs && data.fileURLs.length > 0 ? (
                    <ul className="space-y-2">
                      {data.fileURLs.map((url, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Documento {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No hay documentos adjuntos</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Estado y Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <NotesAndStatus
                    initialNotes={data?.notes}
                    initialStatus={data?.status}
                    onSave={handleSaveNotesAndStatus}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

