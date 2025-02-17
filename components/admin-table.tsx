"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  updateDoc,
  doc,
  deleteDoc,
  type Timestamp,
  where,
} from "firebase/firestore"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, type User } from "firebase/auth"
import { db } from "@/firebaseConfig"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DetailModal } from "./detail-modal"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Paperclip, ChevronDown, ChevronUp, Trash2, Search, Filter, FileText, Users, LogOut } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { FcGoogle } from "react-icons/fc"

interface FormDataType {
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
  timestamp: Timestamp | string | Date
  fileURLs: string[]
  status?: "pendiente" | "en_revision" | "finalizado"
  notes?: string
  [key: string]: string | number | boolean | object | undefined | null | ("pendiente" | "en_revision" | "finalizado")
}

export function AdminTable() {
  const [formData, setFormData] = useState<FormDataType[]>([])
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState<FormDataType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof FormDataType>("timestamp")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filterStatus, setFilterStatus] = useState<FormDataType["status"] | "all">("all")
  const [totalEntries, setTotalEntries] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        fetchData()
      } else {
        setFormData([])
        setLastVisible(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchData = async (search = searchTerm, filter = filterStatus, sort = sortField, direction = sortDirection) => {
    setLoading(true)
    try {
      let q = query(collection(db, "formulariosComercialessinlocal"), orderBy(sort as string, direction), limit(10))

      if (lastVisible) {
        q = query(q, startAfter(lastVisible))
      }

      if (filter !== "all") {
        q = query(q, where("status", "==", filter))
      }

      const querySnapshot = await getDocs(q)
      const newData = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as FormDataType)
        .filter(
          (item) =>
            item.dni?.includes(search) ||
            item.apellido?.toLowerCase().includes(search.toLowerCase()) ||
            item.email?.toLowerCase().includes(search.toLowerCase()),
        )

      setFormData((prevData) => [...prevData, ...newData])
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1])

      const snapshot = await getDocs(collection(db, "formulariosComercialessinlocal"))
      setTotalEntries(snapshot.size)
    } catch (error) {
      console.error("Error fetching data: ", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    fetchData()
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormData([])
    setLastVisible(null)
    fetchData()
  }

  const handleViewDetails = (item: FormDataType) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleStatusUpdate = async (id: string, status: FormDataType["status"]) => {
    try {
      const docRef = doc(db, "formulariosComercialessinlocal", id)
      await updateDoc(docRef, { status })
      setFormData((prevData) => prevData.map((item) => (item.id === id ? { ...item, status } : item)))
      toast({
        title: "Estado actualizado",
        description: "El estado del trámite ha sido actualizado exitosamente.",
      })
    } catch (error) {
      console.error("Error updating status: ", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteResponse = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, "formulariosComercialessinlocal", id))
      setFormData((prevData) => prevData.filter((item) => item.id !== id))
      setTotalEntries((prev) => prev - 1)
      toast({
        title: "Respuesta eliminada",
        description: "La respuesta ha sido eliminada exitosamente.",
      })
    } catch (error) {
      console.error("Error deleting response: ", error)
      toast({
        title: "Error",
        description: "Hubo un problema al eliminar la respuesta.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status?: FormDataType["status"]) => {
    switch (status) {
      case "pendiente":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendiente
          </Badge>
        )
      case "en_revision":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            En Revisión
          </Badge>
        )
      case "finalizado":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Finalizado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Sin Estado
          </Badge>
        )
    }
  }

  const handleSort = (field: keyof FormDataType) => {
    if (typeof field === "string") {
      const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc"
      setSortField(field)
      setSortDirection(newDirection)
      setFormData([])
      setLastVisible(null)
      fetchData(searchTerm, filterStatus, field, newDirection)
    }
  }

  const SortIcon = ({ field }: { field: keyof FormDataType }) => {
    if (field !== sortField) return null
    return sortDirection === "asc" ? (
      <ChevronUp className="inline w-4 h-4" />
    ) : (
      <ChevronDown className="inline w-4 h-4" />
    )
  }

  const handleGoogleSignIn = async () => {
    const auth = getAuth()
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      toast({
        title: "Inicio de sesión exitoso",
        description: "Has iniciado sesión con Google correctamente.",
      })
    } catch (error) {
      console.error("Error signing in with Google: ", error)
      toast({
        title: "Error de inicio de sesión",
        description: "No se pudo iniciar sesión con Google. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    const auth = getAuth()
    try {
      await signOut(auth)
      setFormData([])
      setLastVisible(null)
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      })
    } catch (error) {
      console.error("Error signing out: ", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Panel de Administración</CardTitle>
            <CardDescription className="text-center">
              Inicia sesión para acceder al panel de administración
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoogleSignIn} className="w-full">
              <FcGoogle className="mr-2 h-4 w-4" />
              Iniciar sesión con Google
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-blue-500 text-white p-4 rounded-lg flex justify-between items-center">
          <h2 className="text-sm font-medium tracking-wide uppercase">Panel de Administración</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white hover:text-blue-100">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Respuestas del Formulario</CardTitle>
                <CardDescription className="text-gray-500">
                  Gestione y revise las solicitudes de pre-inscripción comercial
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{totalEntries} Solicitudes totales</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{formData.length} Resultados</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <form onSubmit={handleSearch} className="flex-grow">
                <div className="flex gap-4">
                  <div className="flex-grow">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Buscar por DNI, Apellido o Email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="bg-blue-500 text-white hover:bg-blue-600">
                    Buscar
                  </Button>
                </div>
              </form>
              <div className="w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <Select
                    value={filterStatus}
                    onValueChange={(value: string) => {
                      const newFilterStatus = value as FormDataType["status"] | "all"
                      setFilterStatus(newFilterStatus)
                      setFormData([])
                      setLastVisible(null)
                      fetchData(searchTerm, newFilterStatus, sortField, sortDirection)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_revision">En Revisión</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <TableRow>
                      <TableHead className="font-semibold text-gray-600">Estado</TableHead>
                      <TableHead
                        className="cursor-pointer font-semibold text-gray-600"
                        onClick={() => handleSort("tipoPersona")}
                      >
                        Tipo <SortIcon field="tipoPersona" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer font-semibold text-gray-600"
                        onClick={() => handleSort("dni")}
                      >
                        DNI <SortIcon field="dni" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer font-semibold text-gray-600"
                        onClick={() => handleSort("apellido")}
                      >
                        Apellido y Nombre <SortIcon field="apellido" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer font-semibold text-gray-600"
                        onClick={() => handleSort("email")}
                      >
                        Email <SortIcon field="email" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer font-semibold text-gray-600"
                        onClick={() => handleSort("categoria")}
                      >
                        Categoría <SortIcon field="categoria" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer font-semibold text-gray-600"
                        onClick={() => handleSort("subCategoria")}
                      >
                        Trámite <SortIcon field="subCategoria" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer font-semibold text-gray-600"
                        onClick={() => handleSort("timestamp")}
                      >
                        Fecha <SortIcon field="timestamp" />
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600">Archivos</TableHead>
                      <TableHead className="font-semibold text-gray-600">Acciones</TableHead>
                    </TableRow>
                  </thead>
                  <TableBody>
                    {formData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="capitalize">{item.tipoPersona}</TableCell>
                        <TableCell>{item.dni}</TableCell>
                        <TableCell>{`${item.apellido}`}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell className="capitalize">{item.categoria}</TableCell>
                        <TableCell className="capitalize">{item.subCategoria}</TableCell>
                        <TableCell>
                          {item.timestamp &&
                            (typeof item.timestamp === "object" && "toDate" in item.timestamp
                              ? item.timestamp.toDate().toLocaleString()
                              : new Date(item.timestamp).toLocaleString())}
                        </TableCell>
                        <TableCell>
                          {item.fileURLs && item.fileURLs.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(item)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Paperclip className="h-4 w-4 mr-1" />
                              {item.fileURLs.length}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(item)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Ver detalles
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la respuesta del
                                    formulario.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteResponse(item.id)}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                    disabled={deletingId === item.id}
                                  >
                                    {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {formData.length > 0 && (
              <div className="mt-4 text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  {loading ? "Cargando..." : "Cargar más"}
                </Button>
              </div>
            )}

            {formData.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">No se encontraron resultados.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <DetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedItem(null)
          }}
          data={selectedItem}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </div>
  )
}

