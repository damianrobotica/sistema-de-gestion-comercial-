import type { Timestamp } from "firebase/firestore"

export interface FormDataType {
  id: string
  tipoPersona: string
  dni: string
  cuit: string
  apellido: string
  nombre: string
  domicilio: string
  email: string
  telefono: string
  seccion: string
  manzana: string
  parcela: string
  direccion: string
  localOficina: string
  barrio: string
  categoria: string
  subCategoria: string
  actividadPrincipal: string
  actividadSecundaria: string
  otraActividad: string
  timestamp: Timestamp | Date | string
  fileURLs: string[]
  status?: "pendiente" | "en_revision" | "finalizado"
  notes?: string
  [key: string]: string | number | boolean | object | undefined | null | ("pendiente" | "en_revision" | "finalizado")
}

