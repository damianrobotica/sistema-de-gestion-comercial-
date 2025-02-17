"use client"

import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit, startAfter, DocumentData } from 'firebase/firestore'
import { db } from '@/firebaseConfig'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormData {
  id: string
  dni: string
  cuit: string
  apellido: string
  nombre: string
  domicilio: string
  email: string
  telefono: string
  direccion: string
  categoria: string
  subCategoria: string
  actividadPrincipal: string
  timestamp: Date
}

export function AdminTable() {
  const [formData, setFormData] = useState<FormData[]>([])
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async (searchTerm: string = '') => {
    setLoading(true)
    try {
      let q = query(collection(db, 'formulariosComercialessinlocal'), orderBy('timestamp', 'desc'), limit(10))
      
      if (lastVisible) {
        q = query(q, startAfter(lastVisible))
      }

      const querySnapshot = await getDocs(q)
      const newData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FormData))
        .filter(item => 
          item.dni.includes(searchTerm) || 
          item.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email.toLowerCase().includes(searchTerm.toLowerCase())
        )

      setFormData(prevData => [...prevData, ...newData])
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1])
    } catch (error) {
      console.error("Error fetching data: ", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLoadMore = () => {
    fetchData(searchTerm)
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormData([])
    setLastVisible(null)
    fetchData(searchTerm)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Respuestas del Formulario Comercial</h1>
      
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex items-end gap-4">
          <div className="flex-grow">
            <Label htmlFor="search" className="text-sm font-medium">
              Buscar por DNI, Apellido o Email
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="Ingrese DNI, Apellido o Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </div>
      </form>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DNI</TableHead>
              <TableHead>Apellido y Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Tipo de Trámite</TableHead>
              <TableHead>Actividad Principal</TableHead>
              <TableHead>Fecha de Envío</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.dni}</TableCell>
                <TableCell>{`${item.apellido}, ${item.nombre}`}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.telefono}</TableCell>
                <TableCell>{item.direccion}</TableCell>
                <TableCell>{item.categoria}</TableCell>
                <TableCell>{item.subCategoria}</TableCell>
                <TableCell>{item.actividadPrincipal}</TableCell>
                <TableCell>{item.timestamp.toDate().toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {formData.length > 0 && (
        <div className="mt-4 text-center">
          <Button onClick={handleLoadMore} disabled={loading}>
            {loading ? 'Cargando...' : 'Cargar más'}
          </Button>
        </div>
      )}

      {formData.length === 0 && !loading && (
        <p className="text-center mt-4 text-gray-500">No se encontraron resultados.</p>
      )}
    </div>
  )
}

