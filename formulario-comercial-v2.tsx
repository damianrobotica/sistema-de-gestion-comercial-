"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebaseConfig';
import { CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StepIndicator } from './step-indicator';
import { FileUpload } from './file-upload';

const tabOrder = ['personal', 'general', 'documentacion'];

function getNextTab(currentTab: string): string {
  const currentIndex = tabOrder.indexOf(currentTab);
  return tabOrder[currentIndex + 1] || tabOrder[0];
}

export function FormularioComercialV2() {
  const [formData, setFormData] = useState({
    dni: '',
    cuit: '',
    apellido: '',
    nombre: '',
    domicilio: '',
    email: '',
    telefono: '',
    seccion: '',
    manzana: '',
    parcela: '',
    direccion: '',
    localOficina: '',
    barrio: '',
    superficieCubierta: '',
    superficieSemicubierta: '',
    superficieTotal: '',
    georeferenciacion: '',
    categoria: '',
    subCategoria: '',
    actividadPrincipal: '',
    actividadSecundaria: '',
    otraActividad: ''
  });
  const [files, setFiles] = useState<{ file: File; progress: number; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        progress: 0,
        url: ''
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileUpload = (file: File) => {
    const fileRef = ref(storage, `files/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, progress } : f
        ));
      },
      (error) => {
        console.error("Error al subir el archivo: ", error);
      },
      async () => {
        const url = await getDownloadURL(fileRef);
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, url } : f
        ));
      }
    );
  };

  const handleFileRemove = async (fileToRemove: File) => {
    const fileRef = ref(storage, `files/${fileToRemove.name}`);
    try {
      await deleteObject(fileRef);
      setFiles(prev => prev.filter(f => f.file !== fileToRemove));
    } catch (error) {
      console.error("Error al eliminar el archivo: ", error);
    }
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const fileURLs = files.map(f => f.url);

      await addDoc(collection(db, "formulariosComercialessinlocal"), {
        ...formData,
        timestamp: new Date(),
        fileURLs
      });

      setSubmitSuccess(true);
      setConfirmationMessage('Se informa que su trámite de pre-inscripcion comercial fue recepcionado correctamente. Nuestro equipo revisará su solicitud y se contactará a la brevedad para indicarle los pasos a seguir. Atentamente, Ventanilla Única');
      console.log("Formulario guardado exitosamente");
    } catch (error) {
      console.error("Error al guardar el formulario: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <CardTitle className="text-3xl font-bold text-center">F1 Formulario de Pre Inscripción Comercial</CardTitle>
          <CardDescription className="text-center text-primary-foreground/80 mt-2">Complete la información requerida en cada sección.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-gray-500 mb-4">Los campos marcados con <span className="text-red-500">*</span> son obligatorios.</p>
          <StepIndicator currentStep={tabOrder.indexOf(activeTab) + 1} totalSteps={tabOrder.length} />
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="personal" className="text-sm sm:text-base">Datos del solicitante</TabsTrigger>
              <TabsTrigger value="general" className="text-sm sm:text-base">Datos de ubicación</TabsTrigger>
              <TabsTrigger value="documentacion" className="text-sm sm:text-base">Información de la actividad</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dni" className="text-sm font-medium">DNI {/* Update 1 */} <span className="text-red-500 ml-1">*</span></Label>
                  <Input 
                    id="dni" 
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    placeholder="Ingrese su DNI" 
                    required 
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuit" className="text-sm font-medium">CUIT / CUIL</Label>
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
                <Label htmlFor="apellido" className="text-sm font-medium">Apellido y Nombre o Razón Social</Label>
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
                <Label htmlFor="domicilio" className="text-sm font-medium">Domicilio Real</Label>
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
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
                  <Label htmlFor="telefono" className="text-sm font-medium">Teléfono {/* Update 1 */} <span className="text-red-500 ml-1">*</span></Label>
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
              <FileUpload
                label="Adjuntar DNI (Titular / Apoderado) {/* Update 1 */} <span className='text-red-500 ml-1'>*</span>"
                onChange={handleFileChange}
                onUpload={handleFileUpload}
                onRemove={handleFileRemove}
                files={files}
                required
              />
              <FileUpload
                label="Estatuto (Persona Jurídica) {/* Update 1 */} <span className='text-red-500 ml-1'>*</span>"
                onChange={handleFileChange}
                onUpload={handleFileUpload}
                onRemove={handleFileRemove}
                files={files}
                required
              />
              <FileUpload
                label="Acta de designación de autoridades"
                onChange={handleFileChange}
                onUpload={handleFileUpload}
                onRemove={handleFileRemove}
                files={files}
              />
            </TabsContent>
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="seccion" className="text-sm font-medium">Sección</Label>
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
                  <Label htmlFor="manzana" className="text-sm font-medium">Manzana</Label>
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
                  <Label htmlFor="parcela" className="text-sm font-medium">Parcela</Label>
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
                <Label htmlFor="direccion" className="text-sm font-medium">Dirección Completa {/* Update 1 */} <span className="text-red-500 ml-1">*</span></Label>
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
                <Label htmlFor="localOficina" className="text-sm font-medium">Nombre del propietario del local</Label>
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
                <Label htmlFor="barrio" className="text-sm font-medium">Barrio</Label>
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
                label="Adjuntar documento de propiedad {/* Update 1 */} <span className='text-red-500 ml-1'>*</span>"
                onChange={handleFileChange}
                onUpload={handleFileUpload}
                onRemove={handleFileRemove}
                files={files}
                description="(Título de Propiedad - Boleto de compra venta - Contrato de Alquiler - Comodato - Adjudicación de IPRODHA)"
                required
              />
            </TabsContent>
            <TabsContent value="documentacion" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subCategoria" className="text-sm font-medium">Tipo de trámite {/* Update 1 */} <span className="text-red-500 ml-1">*</span></Label>
                <Select 
                  name="subCategoria" 
                  value={formData.subCategoria}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subCategoria: value }))}
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
                <Label htmlFor="categoria" className="text-sm font-medium">Categoría {/* Update 1 */} <span className="text-red-500 ml-1">*</span></Label>
                <Select 
                  name="categoria" 
                  value={formData.categoria}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
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
                <Label htmlFor="actividadPrincipal" className="text-sm font-medium">Actividad Principal {/* Update 1 */} <span className="text-red-500 ml-1">*</span></Label>
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
                <Label htmlFor="actividadSecundaria" className="text-sm font-medium">Actividad Secundaria</Label>
                <Input 
                  id="actividadSecundaria"  
                  name="actividadSecundaria"
                  value={formData.actividadSecundaria}
                  onChange={handleInputChange}
                  placeholder="Actividad secundaria" 
                  required 
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otraActividad" className="text-sm font-medium">Otra Actividad</Label>
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
                label="Adjuntar Documentos (Constancia de Inscripción en ARCA y ATM)"
                onChange={handleFileChange}
                onUpload={handleFileUpload}
                onRemove={handleFileRemove}
                files={files}
                multiple
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between items-center p-6 bg-gray-50">
          <div>
            {activeTab !== 'personal' && (
              <Button 
                type="button" 
                onClick={() => handleTabChange(tabOrder[tabOrder.indexOf(activeTab) - 1])}
                variant="outline"
              >
                Anterior
              </Button>
            )}
          </div>
          <div>
            {activeTab !== 'documentacion' && (
              <Button 
                type="button" 
                onClick={() => handleTabChange(getNextTab(activeTab))}
                variant="outline"
              >
                Siguiente
              </Button>
            )}
            {activeTab === 'documentacion' && (
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      {submitSuccess && (
        <Alert className="mt-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Éxito</AlertTitle>
          <AlertDescription className="text-green-700">
            {confirmationMessage}
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}

