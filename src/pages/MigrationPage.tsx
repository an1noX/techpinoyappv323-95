
import React from 'react'
import { MigrationControl } from '@/components/MigrationControl'

const MigrationPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Server Migration Dashboard</h1>
        <p className="text-muted-foreground">
          Manage the transition between old and new Supabase servers
        </p>
      </div>
      
      <MigrationControl />
    </div>
  )
}

export default MigrationPage
