
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, AlertTriangle, Database, Users, Shield, Settings } from 'lucide-react'
import { SupabaseAdminUtils } from '@/utils/supabaseAdmin'
import { toast } from '@/hooks/use-toast'

interface ValidationResult {
  success: boolean
  issues: string[]
  repairs: string[]
}

interface TestResult {
  success: boolean
  details: any
}

export const SuperadminMigrationControl = () => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  // User creation form state
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as 'admin' | 'sales_admin' | 'user' | 'superadmin'
  })

  const handleValidateSchema = async () => {
    setIsValidating(true)
    try {
      const result = await SupabaseAdminUtils.validateAndRepairSchema()
      setValidationResult(result)
      
      if (result.success) {
        toast({
          title: "Schema Validation Complete",
          description: "No issues found with the database schema",
        })
      } else {
        toast({
          title: "Schema Issues Detected",
          description: `Found ${result.issues.length} issues`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const result = await SupabaseAdminUtils.testConnection()
      setTestResult(result)
      
      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: "All systems are operational",
        })
      } else {
        toast({
          title: "Connection Test Failed",
          description: "Issues detected with the connection",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.password) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and password",
        variant: "destructive"
      })
      return
    }

    setIsCreatingUser(true)
    try {
      const result = await SupabaseAdminUtils.createUser({
        email: userForm.email,
        password: userForm.password,
        full_name: userForm.full_name,
        role: userForm.role
      })

      if (result.success) {
        toast({
          title: "User Created Successfully",
          description: `User ${userForm.email} has been created with ${userForm.role} role`,
        })
        
        // Reset form
        setUserForm({
          email: '',
          password: '',
          full_name: '',
          role: 'user'
        })
      } else {
        toast({
          title: "User Creation Failed",
          description: result.error || 'Unknown error occurred',
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Creation Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Superadmin Migration Control
          </CardTitle>
          <CardDescription>
            Manage superadmin role migration and troubleshoot user creation issues
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="validation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="validation">Schema Validation</TabsTrigger>
          <TabsTrigger value="testing">Connection Testing</TabsTrigger>
          <TabsTrigger value="user-creation">User Creation</TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schema Validation & Repair</CardTitle>
              <CardDescription>
                Check for and fix common schema issues that prevent user creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleValidateSchema}
                disabled={isValidating}
                className="w-full"
              >
                {isValidating ? 'Validating...' : 'Validate & Repair Schema'}
              </Button>

              {validationResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(validationResult.success)}
                    <span className="font-medium">
                      {validationResult.success ? 'Schema Valid' : 'Issues Found'}
                    </span>
                  </div>

                  {validationResult.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-destructive">Issues Detected:</h4>
                      {validationResult.issues.map((issue, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{issue}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {validationResult.repairs.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-600">Repairs Applied:</h4>
                      {validationResult.repairs.map((repair, index) => (
                        <Alert key={index} className="border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <AlertDescription>{repair}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection & Function Testing</CardTitle>
              <CardDescription>
                Test database connection and verify migration functions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full"
              >
                {isTesting ? 'Testing...' : 'Test Connection & Functions'}
              </Button>

              {testResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResult.success)}
                    <span className="font-medium">
                      {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Profile Count</Label>
                      <div className="text-2xl font-bold">
                        {testResult.details.profileCount || 0}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Superadmin Function</Label>
                      <Badge variant={testResult.details.superadminFunctionExists ? "default" : "destructive"}>
                        {testResult.details.superadminFunctionExists ? "Available" : "Missing"}
                      </Badge>
                    </div>
                  </div>

                  {testResult.details.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{testResult.details.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-creation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual User Creation</CardTitle>
              <CardDescription>
                Create users manually with proper error handling for self-hosted Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Enter secure password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name (Optional)</Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="sales_admin">Sales Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
              </div>

              <Button 
                onClick={handleCreateUser}
                disabled={isCreatingUser}
                className="w-full"
              >
                {isCreatingUser ? 'Creating User...' : 'Create User'}
              </Button>

              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>Self-Hosted Supabase:</strong> This tool uses the proper authentication flow for self-hosted instances.
                  Users will be created in auth.users and profiles tables automatically.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
