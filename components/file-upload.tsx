"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Upload, FileText, ImageIcon } from "lucide-react"

interface FileUploadProps {
  id: string
  label: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUpload: (file: File) => void
  onRemove: (file: File) => void
  files: { file: File; progress: number; url: string }[]
  description?: string
  multiple?: boolean
  required?: boolean
}

export function FileUpload({
  id,
  label,
  onChange,
  onUpload,
  onRemove,
  files,
  description,
  multiple,
  required,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previews, setPreviews] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    // Generate previews for new files
    files.forEach((fileObj) => {
      if (!previews[fileObj.file.name]) {
        generatePreview(fileObj.file)
      }
    })

    // Clean up old previews
    Object.keys(previews).forEach((fileName) => {
      if (!files.some((fileObj) => fileObj.file.name === fileName)) {
        setPreviews((prev) => {
          const newPreviews = { ...prev }
          delete newPreviews[fileName]
          return newPreviews
        })
      }
    })
  }, [files, previews]) // Added previews to dependencies

  const generatePreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviews((prev) => ({ ...prev, [file.name]: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    } else {
      // For non-image files, we'll use a generic icon
      setPreviews((prev) => ({ ...prev, [file.name]: "file" }))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      const fileList = e.dataTransfer.files
      onChange({ target: { files: fileList } } as React.ChangeEvent<HTMLInputElement>)
      Array.from(fileList).forEach((file) => onUpload(file))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e)
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => onUpload(file))
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label
              htmlFor={id}
              className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <span>Subir un archivo</span>
              <input
                id={id}
                name={id}
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                multiple={multiple}
              />
            </label>
            <p className="pl-1 text-gray-500">o arrastrar y soltar</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF, PDF hasta 10MB</p>
        </div>
      </div>
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center space-x-3">
                {previews[file.file.name] && previews[file.file.name] !== "file" ? (
                  <img
                    src={previews[file.file.name] || "/placeholder.svg"}
                    alt={file.file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : file.file.type.startsWith("image/") ? (
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                ) : (
                  <FileText className="w-10 h-10 text-gray-400" />
                )}
                <span className="text-sm text-gray-700 truncate">{file.file.name}</span>
              </div>
              <div className="flex items-center space-x-4">
                {file.progress < 100 ? (
                  <div className="w-24">
                    <Progress value={file.progress} className="h-2" />
                    <span className="text-xs text-gray-500 mt-1">{file.progress}%</span>
                  </div>
                ) : (
                  <span className="text-xs text-green-600 font-medium">Completado</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(file.file)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

