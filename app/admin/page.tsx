import { AdminTable } from '@/components/admin-table'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
        <AdminTable />
      </main>
    </div>
  )
}

