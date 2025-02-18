"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, addDoc } from "firebase/firestore"
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
  type FirebaseError,
} from "firebase/storage"
import { db, storage } from "@/firebaseConfig"
import { CheckCircle2, FileText, LinkIcon, MessageSquare } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "./file-upload"

const tabOrder = ["personal", "general", "documentacion"]

function getNextTab(currentTab: string): string {
  const currentIndex = tabOrder.indexOf(currentTab)
  return tabOrder[currentIndex + 1] || tabOrder[0]
}

export function FormularioComercialV2() {
  const [formData, setFormData] = useState({
    tipoPersona: "",
    dni: "",
    cuit: "",
    apellido: "",
    nombre: "",
    domicilio: "",
    email: "",
    telefono: "",
    seccion: "",
    manzana: "",
    parcela: "",
    direccion: "",
    localOficina: "",
    barrio: "",
    superficieCubierta: "",
    superficieSemicubierta: "",
    superficieTotal: "",
    georeferenciacion: "",
    categoria: "",
    subCategoria: "",
    actividadPrincipal: "",
    actividadSecundaria: "",
    otraActividad: "",
  })
  const [files, setFiles] = useState<{ file: File; progress: number; url: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => {
        const fileType = e.target.id.includes("dni")
          ? "DNI"
          : e.target.id.includes("estatuto")
            ? "Estatuto"
            : e.target.id.includes("propiedad")
              ? "Propiedad"
              : e.target.id.includes("inscripcion")
                ? "Inscripcion"
                : "Otro"
        const newFileName = `${fileType}_${file.name}`
        const newFile = new File([file], newFileName, { type: file.type })
        return {
          file: newFile,
          progress: 0,
          url: "",
        }
      })
      setFiles((prev) => [...prev, ...newFiles])
      newFiles.forEach((file) => handleFileUpload(file.file))
    }
  }

  const handleFileUpload = (file: File) => {
    const fileRef = ref(storage, `files/${file.name}`)
    const uploadTask = uploadBytesResumable(fileRef, file)

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        setFiles((prev) => prev.map((f) => (f.file === file ? { ...f, progress } : f)))
      },
      (error) => {
        console.error("Error al subir el archivo: ", error)
      },
      async () => {
        const url = await getDownloadURL(fileRef)
        setFiles((prev) => prev.map((f) => (f.file === file ? { ...f, url } : f)))
      },
    )
  }

  const handleFileRemove = async (fileToRemove: File) => {
    const fileRef = ref(storage, `files/${fileToRemove.name}`)
    try {
      // Check if the file exists before attempting to delete
      const metadata = await getMetadata(fileRef)
      if (metadata) {
        await deleteObject(fileRef)
        console.log(`File ${fileToRemove.name} deleted successfully`)
      }
    } catch (error) {
      if ((error as FirebaseError).code === "storage/object-not-found") {
        console.log(`File ${fileToRemove.name} not found in storage, removing from local state`)
      } else {
        console.error("Error al eliminar el archivo: ", error)
      }
    } finally {
      // Remove the file from local state regardless of whether deletion was successful
      setFiles((prev) => prev.filter((f) => f.file !== fileToRemove))
    }
  }

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (formData.tipoPersona === "juridica" && !formData.dni) {
      setFormData((prev) => ({ ...prev, dni: "N/A" }))
    }

    try {
      // Wait for all file uploads to complete
      await Promise.all(
        files.map(async (file) => {
          if (!file.url) {
            await new Promise<void>((resolve) => {
              const uploadTask = uploadBytesResumable(ref(storage, `files/${file.file.name}`), file.file)
              uploadTask.on(
                "state_changed",
                (snapshot) => {
                  const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
                  setFiles((prev) => prev.map((f) => (f.file === file.file ? { ...f, progress } : f)))
                },
                (error) => {
                  console.error("Error al subir el archivo: ", error)
                  resolve()
                },
                async () => {
                  const url = await getDownloadURL(uploadTask.snapshot.ref)
                  setFiles((prev) => prev.map((f) => (f.file === file.file ? { ...f, url } : f)))
                  resolve()
                },
              )
            })
          }
        }),
      )

      const fileURLs = files.map((f) => f.url).filter((url) => url !== "")

      await addDoc(collection(db, "formulariosComercialessinlocal"), {
        ...formData,
        timestamp: new Date(),
        fileURLs,
      })

      setSubmitSuccess(true)
      console.log("Formulario guardado exitosamente")
    } catch (error) {
      console.error("Error al guardar el formulario: ", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-4xl mx-auto shadow-lg">
          <CardContent className="p-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Éxito</AlertTitle>
              <AlertDescription className="text-green-700">
                Se informa que su trámite de pre-inscripción comercial fue recepcionado correctamente. Nuestro equipo
                revisará su solicitud en 72hs hábiles y se contactará a la brevedad para indicarle los pasos a seguir.
                Atentamente, Ventanilla Única
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto mb-4">
        <Button
          variant="outline"
          className="ml-auto flex items-center gap-2"
          onClick={() =>
            window.open("https://drive.google.com/file/d/1l9GiCWOGOzestqscNseaD4n_Qi6vlFmP/view", "_blank")
          }
        >
          <FileText className="w-4 h-4" />
          Ver Video tutorial
        </Button>
      </div>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
          <h2 className="text-sm font-medium tracking-wide uppercase">Pre Inscripción Comercial</h2>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Formulario F1</CardTitle>
                <CardDescription className="text-gray-500">
                  Complete la información requerida en cada sección
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                En Progreso
              </Badge>
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>3 Secciones</span>
              </div>
              <div className="flex items-center gap-1">
                <LinkIcon className="w-4 h-4" />
                <span>4 Campos requeridos</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{files.length} Archivos</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  {tabOrder.map((tab, index) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className={`data-[state=active]:bg-blue-500 data-[state=active]:text-white`}
                    >
                      {index + 1}.{" "}
                      {tab === "personal" ? "Datos Personales" : tab === "general" ? "Ubicación" : "Actividad"}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                  <div className="grid gap-6 p-6 bg-white rounded-lg border border-gray-100">
                    <div className="space-y-2">
                      <Label htmlFor="tipoPersona" className="text-sm font-medium">
                        Tipo de Persona <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select
                        name="tipoPersona"
                        value={formData.tipoPersona}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, tipoPersona: value }))}
                        required
                      >
                        <SelectTrigger id="tipoPersona" className="w-full">
                          <SelectValue placeholder="Seleccione el tipo de persona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fisica">Persona Física</SelectItem>
                          <SelectItem value="juridica">Persona Jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="dni" className="text-sm font-medium">
                          DNI {formData.tipoPersona !== "juridica" && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          id="dni"
                          name="dni"
                          value={formData.dni}
                          onChange={handleInputChange}
                          placeholder="Ingrese su DNI"
                          required={formData.tipoPersona !== "juridica"}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cuit" className="text-sm font-medium">
                          CUIT / CUIL <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="cuit"
                          name="cuit"
                          value={formData.cuit}
                          onChange={handleInputChange}
                          placeholder="Ingrese su CUIT"
                          required
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido" className="text-sm font-medium">
                        Apellido y Nombre o Razón Social <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="apellido"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleInputChange}
                        placeholder="Ingrese su apellido y nombre o razón social"
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="domicilio" className="text-sm font-medium">
                        Domicilio Real <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="domicilio"
                        name="domicilio"
                        value={formData.domicilio}
                        onChange={handleInputChange}
                        placeholder="Ej: Calle 1300 depto piso 3380 eldorado"
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          type="email"
                          placeholder="Ingrese su email"
                          required
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono" className="text-sm font-medium">
                          Teléfono <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="telefono"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          placeholder="Ingrese su teléfono"
                          required
                          className="w-full"
                        />
                      </div>
                    </div>
                    {formData.tipoPersona === "fisica" && (
                      <FileUpload
                        id="dni-upload"
                        label="Adjuntar DNI (Titular / Apoderado)"
                        onChange={handleFileChange}
                        onUpload={handleFileUpload}
                        onRemove={handleFileRemove}
                        files={files.filter((f) => f.file.name.startsWith("DNI"))}
                        required
                      />
                    )}
                    {formData.tipoPersona === "juridica" && (
                      <>
                        <FileUpload
                          id="estatuto-upload"
                          label="Estatuto (Persona Jurídica)"
                          onChange={handleFileChange}
                          onUpload={handleFileUpload}
                          onRemove={handleFileRemove}
                          files={files.filter((f) => f.file.name.startsWith("Estatuto"))}
                          required
                        />
                        <FileUpload
                          id="acta-upload"
                          label="Acta de designación de autoridades"
                          onChange={handleFileChange}
                          onUpload={handleFileUpload}
                          onRemove={handleFileRemove}
                          files={files.filter((f) => f.file.name.startsWith("Acta"))}
                          required
                        />
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="general" className="space-y-6">
                  <div className="grid gap-6 p-6 bg-white rounded-lg border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="seccion" className="text-sm font-medium">
                          Sección
                        </Label>
                        <Input
                          id="seccion"
                          name="seccion"
                          value={formData.seccion}
                          onChange={handleInputChange}
                          placeholder="Número de sección"
                          required
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manzana" className="text-sm font-medium">
                          Manzana
                        </Label>
                        <Input
                          id="manzana"
                          name="manzana"
                          value={formData.manzana}
                          onChange={handleInputChange}
                          placeholder="Número de manzana"
                          required
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parcela" className="text-sm font-medium">
                          Parcela
                        </Label>
                        <Input
                          id="parcela"
                          name="parcela"
                          value={formData.parcela}
                          onChange={handleInputChange}
                          placeholder="Número de parcela"
                          required
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="direccion" className="text-sm font-medium">
                        Dirección Completa <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="direccion"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        placeholder="Dirección completa"
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="localOficina" className="text-sm font-medium">
                        Nombre del propietario del local
                      </Label>
                      <Input
                        id="localOficina"
                        name="localOficina"
                        value={formData.localOficina}
                        onChange={handleInputChange}
                        placeholder="Nombre del propietario del local"
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barrio" className="text-sm font-medium">
                        Barrio
                      </Label>
                      <Input
                        id="barrio"
                        name="barrio"
                        value={formData.barrio}
                        onChange={handleInputChange}
                        placeholder="Nombre del barrio"
                        required
                        className="w-full"
                      />
                    </div>
                    <FileUpload
                      id="documento-propiedad-upload"
                      label="Adjuntar documento de propiedad"
                      onChange={handleFileChange}
                      onUpload={handleFileUpload}
                      onRemove={handleFileRemove}
                      files={files.filter((f) => f.file.name.startsWith("Propiedad"))}
                      description="(Título de Propiedad - Boleto de compra venta - Contrato de Alquiler - Comodato - Adjudicación de IPRODHA)"
                      required
                    />
                  </div>
                </TabsContent>

                <TabsContent value="documentacion" className="space-y-6">
                  <div className="grid gap-6 p-6 bg-white rounded-lg border border-gray-100">
                    <div className="space-y-2">
                      <Label htmlFor="subCategoria" className="text-sm font-medium">
                        Tipo de trámite <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select
                        name="subCategoria"
                        value={formData.subCategoria}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, subCategoria: value }))}
                        required
                      >
                        <SelectTrigger id="subCategoria" className="w-full">
                          <SelectValue placeholder="Seleccione el trámite a realizar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="habilitacion">Habilitación</SelectItem>
                          <SelectItem value="anexo">Anexo</SelectItem>
                          <SelectItem value="traslado">Traslado</SelectItem>
                          <SelectItem value="cambioTitular">Cambio de titular</SelectItem>
                          <SelectItem value="cambioRubro">Cambio de rubro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria" className="text-sm font-medium">
                        Categoría <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select
                        name="categoria"
                        value={formData.categoria}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, categoria: value }))}
                        required
                      >
                        <SelectTrigger id="categoria" className="w-full">
                          <SelectValue placeholder="Seleccione una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="servicio">Servicio</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actividadPrincipal" className="text-sm font-medium">
                        Actividad Principal <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="actividadPrincipal"
                        name="actividadPrincipal"
                        value={formData.actividadPrincipal}
                        onChange={handleInputChange}
                        placeholder="Actividad principal"
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actividadSecundaria" className="text-sm font-medium">
                        Actividad Secundaria
                      </Label>
                      <Input
                        id="actividadSecundaria"
                        name="actividadSecundaria"
                        value={formData.actividadSecundaria}
                        onChange={handleInputChange}
                        placeholder="Actividad secundaria"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otraActividad" className="text-sm font-medium">
                        Otra Actividad
                      </Label>
                      <Input
                        id="otraActividad"
                        name="otraActividad"
                        value={formData.otraActividad}
                        onChange={handleInputChange}
                        placeholder="Otra actividad"
                        className="w-full"
                      />
                    </div>
                    <FileUpload
                      id="documentos-inscripcion-upload"
                      label="Adjuntar Documentos (Constancia de Inscripción en ARCA y ATM)"
                      onChange={handleFileChange}
                      onUpload={handleFileUpload}
                      onRemove={handleFileRemove}
                      files={files.filter((f) => f.file.name.startsWith("Inscripcion"))}
                      multiple
                    />
                  </div>
                </TabsContent>

                <div className="flex justify-between mt-6">
                  {activeTab !== "personal" && (
                    <Button
                      type="button"
                      onClick={() => handleTabChange(tabOrder[tabOrder.indexOf(activeTab) - 1])}
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      Anterior
                    </Button>
                  )}
                  <div className="ml-auto flex gap-2">
                    {activeTab !== "documentacion" ? (
                      <Button
                        type="button"
                        onClick={() => handleTabChange(getNextTab(activeTab))}
                        className="bg-blue-500 text-white hover:bg-blue-600"
                      >
                        Siguiente
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-500 text-white hover:bg-blue-600"
                      >
                        {isSubmitting ? "Enviando..." : "Enviar Formulario"}
                      </Button>
                    )}
                  </div>
                </div>
              </Tabs>
            </form>
          </CardContent>
        </Card>

        {submitSuccess && (
          <Alert className="bg-green-50 border-green-200 mt-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Éxito</AlertTitle>
            <AlertDescription className="text-green-700">
              Se informa que su trámite de pre-inscripción comercial fue recepcionado correctamente. Nuestro equipo
              revisará su solicitud en 72hs hábiles y se contactará a la brevedad para indicarle los pasos a seguir.
              Atentamente, Ventanilla Única
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

