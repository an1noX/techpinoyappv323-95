export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          assigned_to: string | null
          client_id: string | null
          created_at: string
          id: string
          message: string
          printer_id: string | null
          product_id: string | null
          resolved_at: string | null
          severity: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          message: string
          printer_id?: string | null
          product_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string
          printer_id?: string | null
          product_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_barcodes: {
        Row: {
          asset_id: string
          asset_type: string
          barcode_value: string
          generated_at: string
          id: string
          last_scanned_at: string | null
          scan_count: number | null
        }
        Insert: {
          asset_id: string
          asset_type: string
          barcode_value: string
          generated_at?: string
          id?: string
          last_scanned_at?: string | null
          scan_count?: number | null
        }
        Update: {
          asset_id?: string
          asset_type?: string
          barcode_value?: string
          generated_at?: string
          id?: string
          last_scanned_at?: string | null
          scan_count?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      client_access: {
        Row: {
          client_id: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_activity_log: {
        Row: {
          activity_type: string
          client_id: string | null
          description: string
          id: string
          metadata: Json | null
          performed_at: string
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          client_id?: string | null
          description: string
          id?: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          client_id?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_audit_timeline: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          client_id: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          client_id: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          client_id?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_audit_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_category_assignments: {
        Row: {
          assigned_at: string
          category_id: string
          client_id: string
          id: string
        }
        Insert: {
          assigned_at?: string
          category_id: string
          client_id: string
          id?: string
        }
        Update: {
          assigned_at?: string
          category_id?: string
          client_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "client_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_category_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_comments: {
        Row: {
          client_id: string
          comment: string
          created_at: string
          created_by: string | null
          id: string
          is_internal: boolean | null
          priority: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          comment: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          priority?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          comment?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          priority?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_comments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_dashboard_stats: {
        Row: {
          active_assignments: number | null
          calculated_at: string | null
          client_id: string
          cost_savings: number | null
          id: string
          last_service_date: string | null
          monthly_usage: number | null
          next_maintenance_due: string | null
          pending_tickets: number | null
          printer_uptime: number | null
          supplies_level: number | null
          total_printers: number | null
        }
        Insert: {
          active_assignments?: number | null
          calculated_at?: string | null
          client_id: string
          cost_savings?: number | null
          id?: string
          last_service_date?: string | null
          monthly_usage?: number | null
          next_maintenance_due?: string | null
          pending_tickets?: number | null
          printer_uptime?: number | null
          supplies_level?: number | null
          total_printers?: number | null
        }
        Update: {
          active_assignments?: number | null
          calculated_at?: string | null
          client_id?: string
          cost_savings?: number | null
          id?: string
          last_service_date?: string | null
          monthly_usage?: number | null
          next_maintenance_due?: string | null
          pending_tickets?: number | null
          printer_uptime?: number | null
          supplies_level?: number | null
          total_printers?: number | null
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          document_number: string
          document_type: string
          extracted_data: Json | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          document_number: string
          document_type: string
          extracted_data?: Json | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          document_number?: string
          document_type?: string
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_price_history: {
        Row: {
          id: string
          margin_percentage: number | null
          note: string | null
          price: number
          product_client_id: string
          timestamp: string
        }
        Insert: {
          id?: string
          margin_percentage?: number | null
          note?: string | null
          price: number
          product_client_id: string
          timestamp?: string
        }
        Update: {
          id?: string
          margin_percentage?: number | null
          note?: string | null
          price?: number
          product_client_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_price_history_product_client_id_fkey"
            columns: ["product_client_id"]
            isOneToOne: false
            referencedRelation: "product_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_relationships: {
        Row: {
          child_client_id: string
          created_at: string
          established_date: string | null
          id: string
          notes: string | null
          parent_client_id: string
          relationship_type: string | null
        }
        Insert: {
          child_client_id: string
          created_at?: string
          established_date?: string | null
          id?: string
          notes?: string | null
          parent_client_id: string
          relationship_type?: string | null
        }
        Update: {
          child_client_id?: string
          created_at?: string
          established_date?: string | null
          id?: string
          notes?: string | null
          parent_client_id?: string
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_relationships_child_client_id_fkey"
            columns: ["child_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_relationships_parent_client_id_fkey"
            columns: ["parent_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          client_id: string
          id: string
          new_status: string
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          client_id: string
          id?: string
          new_status: string
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          client_id?: string
          id?: string
          new_status?: string
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_status_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          archived_at: string | null
          client_code: string | null
          contact_email: string | null
          contact_person: string | null
          created_at: string
          department_count: number | null
          id: string
          location_count: number | null
          name: string
          notes: string | null
          phone: string | null
          printer_count: number | null
          status: string | null
          tags: string[] | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          client_code?: string | null
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          department_count?: number | null
          id?: string
          location_count?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          printer_count?: number | null
          status?: string | null
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          client_code?: string | null
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          department_count?: number | null
          id?: string
          location_count?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          printer_count?: number | null
          status?: string | null
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cloud_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          request_type: string
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          request_type: string
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          request_type?: string
          status?: string | null
        }
        Relationships: []
      }
      deleted_printer: {
        Row: {
          deleted_at: string
          deleted_by: string | null
          id: string
          printer_id: string
          reason: string | null
        }
        Insert: {
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          printer_id: string
          reason?: string | null
        }
        Update: {
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          printer_id?: string
          reason?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          client_id: string | null
          created_at: string | null
          delivery_date: string
          delivery_receipt_number: string | null
          id: string
          notes: string | null
          purchase_order_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          delivery_date: string
          delivery_receipt_number?: string | null
          id?: string
          notes?: string | null
          purchase_order_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          delivery_date?: string
          delivery_receipt_number?: string | null
          id?: string
          notes?: string | null
          purchase_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_delivery_purchase_order"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_item_links: {
        Row: {
          created_at: string | null
          delivery_item_id: string | null
          id: string
          linked_quantity: number
          purchase_order_item_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_item_id?: string | null
          id?: string
          linked_quantity: number
          purchase_order_item_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_item_id?: string | null
          id?: string
          linked_quantity?: number
          purchase_order_item_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_item_links_delivery_item_id_fkey"
            columns: ["delivery_item_id"]
            isOneToOne: false
            referencedRelation: "delivery_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_item_links_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_item_units: {
        Row: {
          batch_number: string | null
          condition_notes: string | null
          created_at: string | null
          delivery_item_id: string
          id: string
          serial_number: string | null
          unit_number: number
          unit_status: string
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          condition_notes?: string | null
          created_at?: string | null
          delivery_item_id: string
          id?: string
          serial_number?: string | null
          unit_number: number
          unit_status?: string
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          condition_notes?: string | null
          created_at?: string | null
          delivery_item_id?: string
          id?: string
          serial_number?: string | null
          unit_number?: number
          unit_status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_item_units_delivery_item_id_fkey"
            columns: ["delivery_item_id"]
            isOneToOne: false
            referencedRelation: "delivery_items"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_items: {
        Row: {
          created_at: string | null
          delivery_id: string
          id: string
          product_id: string | null
          quantity_delivered: number
        }
        Insert: {
          created_at?: string | null
          delivery_id: string
          id?: string
          product_id?: string | null
          quantity_delivered: number
        }
        Update: {
          created_at?: string | null
          delivery_id?: string
          id?: string
          product_id?: string | null
          quantity_delivered?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_items_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_receipt_items: {
        Row: {
          created_at: string
          delivery_receipt_id: string | null
          id: string
          price: number | null
          product_id: string | null
          quantity: number
          total: number | null
        }
        Insert: {
          created_at?: string
          delivery_receipt_id?: string | null
          id?: string
          price?: number | null
          product_id?: string | null
          quantity: number
          total?: number | null
        }
        Update: {
          created_at?: string
          delivery_receipt_id?: string | null
          id?: string
          price?: number | null
          product_id?: string | null
          quantity?: number
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_receipt_items_delivery_receipt_id_fkey"
            columns: ["delivery_receipt_id"]
            isOneToOne: false
            referencedRelation: "delivery_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_receipts: {
        Row: {
          client_id: string | null
          created_at: string
          date: string
          dr_number: string
          id: string
          notes: string | null
          status: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date: string
          dr_number: string
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date?: string
          dr_number?: string
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_receipts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          abbreviation: string | null
          archived_at: string | null
          budget: number | null
          client_id: string
          contact_number: string | null
          contact_person: string | null
          created_at: string
          department_code: string | null
          department_head: string | null
          description: string | null
          floor: string | null
          id: string
          location: string | null
          location_count: number | null
          name: string
          office_name: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          abbreviation?: string | null
          archived_at?: string | null
          budget?: number | null
          client_id: string
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          department_code?: string | null
          department_head?: string | null
          description?: string | null
          floor?: string | null
          id?: string
          location?: string | null
          location_count?: number | null
          name: string
          office_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          abbreviation?: string | null
          archived_at?: string | null
          budget?: number | null
          client_id?: string
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          department_code?: string | null
          department_head?: string | null
          description?: string | null
          floor?: string | null
          id?: string
          location?: string | null
          location_count?: number | null
          name?: string
          office_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      departments_location: {
        Row: {
          abbreviation: string | null
          address: string | null
          archived_at: string | null
          city: string | null
          client_id: string | null
          contact_number: string | null
          contact_person: string | null
          created_at: string
          department_id: string
          description: string | null
          floor: string | null
          id: string
          is_primary: boolean
          location_code: string | null
          name: string
          office_name: string | null
          phone: string | null
          printer_count: number | null
          state: string | null
          status: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          abbreviation?: string | null
          address?: string | null
          archived_at?: string | null
          city?: string | null
          client_id?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          department_id: string
          description?: string | null
          floor?: string | null
          id?: string
          is_primary?: boolean
          location_code?: string | null
          name: string
          office_name?: string | null
          phone?: string | null
          printer_count?: number | null
          state?: string | null
          status?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          abbreviation?: string | null
          address?: string | null
          archived_at?: string | null
          city?: string | null
          client_id?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          department_id?: string
          description?: string | null
          floor?: string | null
          id?: string
          is_primary?: boolean
          location_code?: string | null
          name?: string
          office_name?: string | null
          phone?: string | null
          printer_count?: number | null
          state?: string | null
          status?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_location_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          date: string
          id: string
          items: Json
          notes: string | null
          total: number
          type: string
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          date: string
          id?: string
          items?: Json
          notes?: string | null
          total?: number
          type: string
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          date?: string
          id?: string
          items?: Json
          notes?: string | null
          total?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          mime_type: string | null
          original_name: string
          shared_folder_path: string | null
          sync_status: string | null
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          mime_type?: string | null
          original_name: string
          shared_folder_path?: string | null
          sync_status?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          mime_type?: string | null
          original_name?: string
          shared_folder_path?: string | null
          sync_status?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "cloud_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_file_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      footer_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          setting_name: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          setting_name: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          setting_name?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      fulfillments: {
        Row: {
          created_at: string | null
          date: string | null
          dr_id: string
          dr_item_id: string
          fulfilled_quantity: number
          id: string
          po_id: string
          po_item_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          dr_id: string
          dr_item_id: string
          fulfilled_quantity: number
          id?: string
          po_id: string
          po_item_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          dr_id?: string
          dr_item_id?: string
          fulfilled_quantity?: number
          id?: string
          po_id?: string
          po_item_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      header_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          setting_name: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          setting_name: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          setting_name?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      homepage_settings: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          section_config: Json | null
          section_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          section_config?: Json | null
          section_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          section_config?: Json | null
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          last_restocked_date: string | null
          location_id: string | null
          max_stock_level: number | null
          min_stock_level: number | null
          part_id: string | null
          product_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          last_restocked_date?: string | null
          location_id?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          part_id?: string | null
          product_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          last_restocked_date?: string | null
          location_id?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          part_id?: string | null
          product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "departments_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_purchase_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_purchase_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_purchase_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_purchase_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_purchase_items_inventory_purchase_id_fkey"
            columns: ["inventory_purchase_id"]
            isOneToOne: false
            referencedRelation: "inventory_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_purchase_items_inventory_purchase_id_fkey"
            columns: ["inventory_purchase_id"]
            isOneToOne: false
            referencedRelation: "inventory_purchases_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_purchases: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          purchase_date: string
          reference_number: string
          status: string | null
          supplier_id: string | null
          supplier_name: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          purchase_date: string
          reference_number: string
          status?: string | null
          supplier_id?: string | null
          supplier_name: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string
          reference_number?: string
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_history: {
        Row: {
          action_description: string
          assignment_id: string | null
          completed_date: string | null
          cost: number | null
          created_at: string
          id: string
          issue_reported_date: string | null
          maintenance_type: string
          notes: string | null
          parts_replaced: string[] | null
          performed_at: string
          performed_by: string | null
          printer_id: string
          status_after: string | null
          status_before: string | null
          updated_at: string
        }
        Insert: {
          action_description: string
          assignment_id?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          issue_reported_date?: string | null
          maintenance_type: string
          notes?: string | null
          parts_replaced?: string[] | null
          performed_at?: string
          performed_by?: string | null
          printer_id: string
          status_after?: string | null
          status_before?: string | null
          updated_at?: string
        }
        Update: {
          action_description?: string
          assignment_id?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          issue_reported_date?: string | null
          maintenance_type?: string
          notes?: string | null
          parts_replaced?: string[] | null
          performed_at?: string
          performed_by?: string | null
          printer_id?: string
          status_after?: string | null
          status_before?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_history_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "printer_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_history_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_history_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          completed_date: string | null
          created_at: string
          description: string | null
          id: string
          issue_reported_date: string | null
          maintenance_type: string
          notes: string | null
          performed_by: string | null
          printer_id: string
          scheduled_date: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issue_reported_date?: string | null
          maintenance_type: string
          notes?: string | null
          performed_by?: string | null
          printer_id: string
          scheduled_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issue_reported_date?: string | null
          maintenance_type?: string
          notes?: string | null
          performed_by?: string | null
          printer_id?: string
          scheduled_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          bot_views: number
          created_at: string
          id: string
          ip_address: string | null
          last_tracked_at: string | null
          organic_views: number
          page_path: string
          updated_at: string
          view_count: number
        }
        Insert: {
          bot_views?: number
          created_at?: string
          id?: string
          ip_address?: string | null
          last_tracked_at?: string | null
          organic_views?: number
          page_path: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          bot_views?: number
          created_at?: string
          id?: string
          ip_address?: string | null
          last_tracked_at?: string | null
          organic_views?: number
          page_path?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      parts: {
        Row: {
          category: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          min_stock_level: number | null
          name: string
          part_type: string
          sku: string
          stock_quantity: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          min_stock_level?: number | null
          name: string
          part_type: string
          sku: string
          stock_quantity?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          min_stock_level?: number | null
          name?: string
          part_type?: string
          sku?: string
          stock_quantity?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      parts_printers: {
        Row: {
          compatibility_notes: string | null
          created_at: string
          id: string
          is_recommended: boolean | null
          part_id: string
          printer_id: string
        }
        Insert: {
          compatibility_notes?: string | null
          created_at?: string
          id?: string
          is_recommended?: boolean | null
          part_id: string
          printer_id: string
        }
        Update: {
          compatibility_notes?: string | null
          created_at?: string
          id?: string
          is_recommended?: boolean | null
          part_id?: string
          printer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_printers_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_printers_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_printers_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_suppliers: {
        Row: {
          created_at: string
          current_price: number
          id: string
          lead_time_days: number | null
          minimum_order_quantity: number | null
          part_id: string
          supplier_id: string
          supplier_sku: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_price?: number
          id?: string
          lead_time_days?: number | null
          minimum_order_quantity?: number | null
          part_id: string
          supplier_id: string
          supplier_sku?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_price?: number
          id?: string
          lead_time_days?: number | null
          minimum_order_quantity?: number | null
          part_id?: string
          supplier_id?: string
          supplier_sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_suppliers_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          id: string
          note: string | null
          price: number
          product_supplier_id: string
          timestamp: string
        }
        Insert: {
          id?: string
          note?: string | null
          price: number
          product_supplier_id: string
          timestamp?: string
        }
        Update: {
          id?: string
          note?: string | null
          price?: number
          product_supplier_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_supplier_id_fkey"
            columns: ["product_supplier_id"]
            isOneToOne: false
            referencedRelation: "product_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_assignment_history: {
        Row: {
          action_type: string
          effective_date: string | null
          id: string
          new_client_id: string | null
          new_condition: string | null
          new_department_location_id: string | null
          new_status: string | null
          performed_at: string
          performed_by: string | null
          previous_client_id: string | null
          previous_condition: string | null
          previous_department_location_id: string | null
          previous_status: string | null
          printer_assignment_id: string | null
          reason: string | null
        }
        Insert: {
          action_type: string
          effective_date?: string | null
          id?: string
          new_client_id?: string | null
          new_condition?: string | null
          new_department_location_id?: string | null
          new_status?: string | null
          performed_at?: string
          performed_by?: string | null
          previous_client_id?: string | null
          previous_condition?: string | null
          previous_department_location_id?: string | null
          previous_status?: string | null
          printer_assignment_id?: string | null
          reason?: string | null
        }
        Update: {
          action_type?: string
          effective_date?: string | null
          id?: string
          new_client_id?: string | null
          new_condition?: string | null
          new_department_location_id?: string | null
          new_status?: string | null
          performed_at?: string
          performed_by?: string | null
          previous_client_id?: string | null
          previous_condition?: string | null
          previous_department_location_id?: string | null
          previous_status?: string | null
          printer_assignment_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printer_assignment_history_new_client_id_fkey"
            columns: ["new_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_assignment_history_previous_client_id_fkey"
            columns: ["previous_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_assignment_history_previous_department_location_id_fkey"
            columns: ["previous_department_location_id"]
            isOneToOne: false
            referencedRelation: "departments_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_assignment_history_printer_assignment_id_fkey"
            columns: ["printer_assignment_id"]
            isOneToOne: false
            referencedRelation: "printer_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_assignments: {
        Row: {
          assignment_effective_date: string | null
          client_id: string | null
          condition: string | null
          created_at: string
          department: string | null
          department_id: string | null
          department_location_id: string | null
          deployment_date: string | null
          has_security_deposit: boolean
          id: string
          is_client_owned: boolean | null
          is_rental: boolean
          is_service_unit: boolean | null
          is_unassigned: boolean
          last_maintenance_date: string | null
          last_service_date: string | null
          location: string | null
          maintenance_issue_reported_date: string | null
          maintenance_notes: string | null
          maintenance_status: string | null
          monthly_price: number | null
          notes: string | null
          printer_id: string | null
          reason_for_change: string | null
          security_deposit_amount: number | null
          serial_number: string | null
          status: string
          updated_at: string
          usage_type: string | null
        }
        Insert: {
          assignment_effective_date?: string | null
          client_id?: string | null
          condition?: string | null
          created_at?: string
          department?: string | null
          department_id?: string | null
          department_location_id?: string | null
          deployment_date?: string | null
          has_security_deposit?: boolean
          id?: string
          is_client_owned?: boolean | null
          is_rental?: boolean
          is_service_unit?: boolean | null
          is_unassigned?: boolean
          last_maintenance_date?: string | null
          last_service_date?: string | null
          location?: string | null
          maintenance_issue_reported_date?: string | null
          maintenance_notes?: string | null
          maintenance_status?: string | null
          monthly_price?: number | null
          notes?: string | null
          printer_id?: string | null
          reason_for_change?: string | null
          security_deposit_amount?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          usage_type?: string | null
        }
        Update: {
          assignment_effective_date?: string | null
          client_id?: string | null
          condition?: string | null
          created_at?: string
          department?: string | null
          department_id?: string | null
          department_location_id?: string | null
          deployment_date?: string | null
          has_security_deposit?: boolean
          id?: string
          is_client_owned?: boolean | null
          is_rental?: boolean
          is_service_unit?: boolean | null
          is_unassigned?: boolean
          last_maintenance_date?: string | null
          last_service_date?: string | null
          location?: string | null
          maintenance_issue_reported_date?: string | null
          maintenance_notes?: string | null
          maintenance_status?: string | null
          monthly_price?: number | null
          notes?: string | null
          printer_id?: string | null
          reason_for_change?: string | null
          security_deposit_amount?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printer_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_assignments_department_location_id_fkey"
            columns: ["department_location_id"]
            isOneToOne: false
            referencedRelation: "departments_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_assignments_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_assignments_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_documents: {
        Row: {
          document_type: string
          file_path: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          printer_id: string
          title: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          document_type: string
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          printer_id: string
          title: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          document_type?: string
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          printer_id?: string
          title?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printer_documents_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_documents_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_history: {
        Row: {
          action_type: string
          description: string
          id: string
          performed_by: string | null
          printer_id: string
          related_assignment_id: string | null
          timestamp: string
        }
        Insert: {
          action_type: string
          description: string
          id?: string
          performed_by?: string | null
          printer_id: string
          related_assignment_id?: string | null
          timestamp?: string
        }
        Update: {
          action_type?: string
          description?: string
          id?: string
          performed_by?: string | null
          printer_id?: string
          related_assignment_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "printer_history_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_history_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_status: {
        Row: {
          assignment_id: string | null
          created_at: string
          error_message: string | null
          id: string
          ink_level_black: number | null
          ink_level_cyan: number | null
          ink_level_magenta: number | null
          ink_level_yellow: number | null
          last_maintenance_date: string | null
          next_maintenance_due: string | null
          page_count: number | null
          paper_level: number | null
          printer_id: string
          reported_by: string | null
          status_type: string
          toner_level: number | null
          updated_at: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ink_level_black?: number | null
          ink_level_cyan?: number | null
          ink_level_magenta?: number | null
          ink_level_yellow?: number | null
          last_maintenance_date?: string | null
          next_maintenance_due?: string | null
          page_count?: number | null
          paper_level?: number | null
          printer_id: string
          reported_by?: string | null
          status_type?: string
          toner_level?: number | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ink_level_black?: number | null
          ink_level_cyan?: number | null
          ink_level_magenta?: number | null
          ink_level_yellow?: number | null
          last_maintenance_date?: string | null
          next_maintenance_due?: string | null
          page_count?: number | null
          paper_level?: number | null
          printer_id?: string
          reported_by?: string | null
          status_type?: string
          toner_level?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "printer_status_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "printer_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_status_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_status_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_units: {
        Row: {
          asset_tag: string | null
          condition: string
          created_at: string
          id: string
          last_maintenance_date: string | null
          location: string | null
          maintenance_notes: string | null
          next_maintenance_due: string | null
          notes: string | null
          printer_id: string
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string
          status: string
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_tag?: string | null
          condition?: string
          created_at?: string
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_notes?: string | null
          next_maintenance_due?: string | null
          notes?: string | null
          printer_id: string
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number: string
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_tag?: string | null
          condition?: string
          created_at?: string
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_notes?: string | null
          next_maintenance_due?: string | null
          notes?: string | null
          printer_id?: string
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printer_units_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_units_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_visibility: {
        Row: {
          client_id: string
          created_at: string
          id: string
          printer_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          printer_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          printer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "printer_visibility_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_visibility_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_visibility_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printers: {
        Row: {
          aliases: string | null
          automatic_duplex: boolean | null
          cloud_printing_support: string | null
          color: string | null
          connectivity_bluetooth: boolean | null
          connectivity_ethernet: boolean | null
          connectivity_nfc: boolean | null
          connectivity_usb: boolean | null
          connectivity_wifi: boolean | null
          connectivity_wifi_direct: boolean | null
          created_at: string
          current_renter_id: string | null
          description: string | null
          driver_download_url: string | null
          first_page_out_time: string | null
          id: string
          image_url: string | null
          input_tray_capacity: string | null
          is_available: boolean
          location_count: number | null
          manufacturer: string | null
          model: string | null
          name: string
          output_tray_capacity: string | null
          print_resolution: string | null
          print_speed_bw: string | null
          print_speed_color: string | null
          printer_type: string | null
          purchase_price: number | null
          rental_eligible: boolean
          rental_end_date: string | null
          rental_price_per_month: number | null
          rental_price_per_print: number | null
          rental_price_type: string | null
          rental_start_date: string | null
          rental_status: string | null
          series: string | null
          software_download_url: string | null
          status: string | null
          supported_os: string | null
          supported_paper_sizes: string | null
          supported_paper_types: string | null
          updated_at: string
          user_manual_url: string | null
        }
        Insert: {
          aliases?: string | null
          automatic_duplex?: boolean | null
          cloud_printing_support?: string | null
          color?: string | null
          connectivity_bluetooth?: boolean | null
          connectivity_ethernet?: boolean | null
          connectivity_nfc?: boolean | null
          connectivity_usb?: boolean | null
          connectivity_wifi?: boolean | null
          connectivity_wifi_direct?: boolean | null
          created_at?: string
          current_renter_id?: string | null
          description?: string | null
          driver_download_url?: string | null
          first_page_out_time?: string | null
          id?: string
          image_url?: string | null
          input_tray_capacity?: string | null
          is_available?: boolean
          location_count?: number | null
          manufacturer?: string | null
          model?: string | null
          name: string
          output_tray_capacity?: string | null
          print_resolution?: string | null
          print_speed_bw?: string | null
          print_speed_color?: string | null
          printer_type?: string | null
          purchase_price?: number | null
          rental_eligible?: boolean
          rental_end_date?: string | null
          rental_price_per_month?: number | null
          rental_price_per_print?: number | null
          rental_price_type?: string | null
          rental_start_date?: string | null
          rental_status?: string | null
          series?: string | null
          software_download_url?: string | null
          status?: string | null
          supported_os?: string | null
          supported_paper_sizes?: string | null
          supported_paper_types?: string | null
          updated_at?: string
          user_manual_url?: string | null
        }
        Update: {
          aliases?: string | null
          automatic_duplex?: boolean | null
          cloud_printing_support?: string | null
          color?: string | null
          connectivity_bluetooth?: boolean | null
          connectivity_ethernet?: boolean | null
          connectivity_nfc?: boolean | null
          connectivity_usb?: boolean | null
          connectivity_wifi?: boolean | null
          connectivity_wifi_direct?: boolean | null
          created_at?: string
          current_renter_id?: string | null
          description?: string | null
          driver_download_url?: string | null
          first_page_out_time?: string | null
          id?: string
          image_url?: string | null
          input_tray_capacity?: string | null
          is_available?: boolean
          location_count?: number | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          output_tray_capacity?: string | null
          print_resolution?: string | null
          print_speed_bw?: string | null
          print_speed_color?: string | null
          printer_type?: string | null
          purchase_price?: number | null
          rental_eligible?: boolean
          rental_end_date?: string | null
          rental_price_per_month?: number | null
          rental_price_per_print?: number | null
          rental_price_type?: string | null
          rental_start_date?: string | null
          rental_status?: string | null
          series?: string | null
          software_download_url?: string | null
          status?: string | null
          supported_os?: string | null
          supported_paper_sizes?: string | null
          supported_paper_types?: string | null
          updated_at?: string
          user_manual_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printers_current_renter_id_fkey"
            columns: ["current_renter_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      product_clients: {
        Row: {
          client_id: string
          created_at: string
          id: string
          margin_percentage: number | null
          product_id: string
          quoted_price: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          margin_percentage?: number | null
          product_id: string
          quoted_price: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          margin_percentage?: number | null
          product_id?: string
          quoted_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_clients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_printers: {
        Row: {
          compatibility_notes: string | null
          created_at: string
          id: string
          is_recommended: boolean | null
          printer_id: string
          product_id: string | null
        }
        Insert: {
          compatibility_notes?: string | null
          created_at?: string
          id?: string
          is_recommended?: boolean | null
          printer_id: string
          product_id?: string | null
        }
        Update: {
          compatibility_notes?: string | null
          created_at?: string
          id?: string
          is_recommended?: boolean | null
          printer_id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_printers_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_printers_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_printers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_set_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_set_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_set_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_set_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_set_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_set_items_product_set_id_fkey"
            columns: ["product_set_id"]
            isOneToOne: false
            referencedRelation: "product_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sku: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sku?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sku?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_suppliers: {
        Row: {
          created_at: string
          current_price: number
          id: string
          product_id: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_price: number
          id?: string
          product_id: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_price?: number
          id?: string
          product_id?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          alias: string | null
          aliases: string | null
          category: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sku: string
          updated_at: string
        }
        Insert: {
          alias?: string | null
          aliases?: string | null
          category: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sku: string
          updated_at?: string
        }
        Update: {
          alias?: string | null
          aliases?: string | null
          category?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sku?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_order_item_units: {
        Row: {
          batch_number: string | null
          created_at: string | null
          id: string
          notes: string | null
          purchase_order_item_id: string
          serial_number: string | null
          unit_number: number
          unit_status: string
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          purchase_order_item_id: string
          serial_number?: string | null
          unit_number: number
          unit_status?: string
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          purchase_order_item_id?: string
          serial_number?: string | null
          unit_number?: number
          unit_status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_item_units_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          model: string | null
          price: number | null
          product_id: string | null
          purchase_order_id: string
          quantity: number
          total: number | null
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          model?: string | null
          price?: number | null
          product_id?: string | null
          purchase_order_id: string
          quantity: number
          total?: number | null
          total_price?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          model?: string | null
          price?: number | null
          product_id?: string | null
          purchase_order_id?: string
          quantity?: number
          total?: number | null
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_payments: {
        Row: {
          created_at: string | null
          id: string
          method: string | null
          notes: Json | null
          payment_date: string
          payment_reference: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: Json | null
          payment_date?: string
          payment_reference?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: Json | null
          payment_date?: string
          payment_reference?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          client_po: string | null
          created_at: string | null
          due_date: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          payment_status: string | null
          purchase_order_number: string | null
          sale_invoice_number: string | null
          status: string | null
          supplier_client_id: string | null
          supplier_name: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          client_po?: string | null
          created_at?: string | null
          due_date?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          purchase_order_number?: string | null
          sale_invoice_number?: string | null
          status?: string | null
          supplier_client_id?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          client_po?: string | null
          created_at?: string | null
          due_date?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          purchase_order_number?: string | null
          sale_invoice_number?: string | null
          status?: string | null
          supplier_client_id?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_client_id_fkey"
            columns: ["supplier_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_history: {
        Row: {
          affected_area: string
          assigned_to: string | null
          category: string
          created_at: string
          dashboard_type: string
          description: string | null
          id: string
          identified_date: string
          priority: string
          reported_by: string | null
          resolved_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_area: string
          assigned_to?: string | null
          category: string
          created_at?: string
          dashboard_type: string
          description?: string | null
          id?: string
          identified_date?: string
          priority?: string
          reported_by?: string | null
          resolved_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_area?: string
          assigned_to?: string | null
          category?: string
          created_at?: string
          dashboard_type?: string
          description?: string | null
          id?: string
          identified_date?: string
          priority?: string
          reported_by?: string | null
          resolved_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_data_consistency: {
        Row: {
          created_at: string | null
          customer_name: string | null
          delivery_date: string | null
          delivery_id: string | null
          discrepancy_notes: string | null
          dr_number: string | null
          id: string
          invoice_number: string | null
          last_verified: string | null
          order_date: string | null
          po_number: string | null
          product_model: string | null
          purchase_order_id: string | null
          quantity: number | null
          status: string | null
          total_amount: number | null
          transaction_date: string | null
          transaction_id: string | null
          unit_price: number | null
          updated_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          delivery_date?: string | null
          delivery_id?: string | null
          discrepancy_notes?: string | null
          dr_number?: string | null
          id?: string
          invoice_number?: string | null
          last_verified?: string | null
          order_date?: string | null
          po_number?: string | null
          product_model?: string | null
          purchase_order_id?: string | null
          quantity?: number | null
          status?: string | null
          total_amount?: number | null
          transaction_date?: string | null
          transaction_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          delivery_date?: string | null
          delivery_id?: string | null
          discrepancy_notes?: string | null
          dr_number?: string | null
          id?: string
          invoice_number?: string | null
          last_verified?: string | null
          order_date?: string | null
          po_number?: string | null
          product_model?: string | null
          purchase_order_id?: string | null
          quantity?: number | null
          status?: string | null
          total_amount?: number | null
          transaction_date?: string | null
          transaction_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      sales_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          sales_order_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          quantity?: number
          sales_order_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sales_order_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          client_id: string | null
          created_at: string
          customer_name: string
          id: string
          notes: string | null
          order_date: string
          order_number: string
          order_type: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          customer_name: string
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          order_type?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          order_type?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reports: {
        Row: {
          actions_taken: string | null
          client_address: string | null
          client_name: string
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          contact_submission_id: string | null
          created_at: string
          created_by: string | null
          delivery_no: string
          delivery_receipt_url: string | null
          department: string | null
          device_type: string | null
          diagnosis: string | null
          equipment_location: string | null
          equipment_make: string | null
          equipment_model: string | null
          equipment_serial_no: string | null
          id: string
          nature_of_problem: string
          parts: Json | null
          parts_consumables: number | null
          pdf_url: string | null
          recommendation: string | null
          report_date: string
          reported_by: string | null
          reported_date_time: string | null
          reported_issue: string
          service_fee: number | null
          status: string | null
          technician_name: string | null
          total_charges: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actions_taken?: string | null
          client_address?: string | null
          client_name: string
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          contact_submission_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_no: string
          delivery_receipt_url?: string | null
          department?: string | null
          device_type?: string | null
          diagnosis?: string | null
          equipment_location?: string | null
          equipment_make?: string | null
          equipment_model?: string | null
          equipment_serial_no?: string | null
          id?: string
          nature_of_problem: string
          parts?: Json | null
          parts_consumables?: number | null
          pdf_url?: string | null
          recommendation?: string | null
          report_date: string
          reported_by?: string | null
          reported_date_time?: string | null
          reported_issue: string
          service_fee?: number | null
          status?: string | null
          technician_name?: string | null
          total_charges?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actions_taken?: string | null
          client_address?: string | null
          client_name?: string
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          contact_submission_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_no?: string
          delivery_receipt_url?: string | null
          department?: string | null
          device_type?: string | null
          diagnosis?: string | null
          equipment_location?: string | null
          equipment_make?: string | null
          equipment_model?: string | null
          equipment_serial_no?: string | null
          id?: string
          nature_of_problem?: string
          parts?: Json | null
          parts_consumables?: number | null
          pdf_url?: string | null
          recommendation?: string | null
          report_date?: string
          reported_by?: string | null
          reported_date_time?: string | null
          reported_issue?: string
          service_fee?: number | null
          status?: string | null
          technician_name?: string | null
          total_charges?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_reports_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_contacts: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          supplier_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          supplier_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          supplier_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_email: string | null
          created_at: string
          id: string
          location_count: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          status: string | null
          supplier_code: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          location_count?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          supplier_code?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          location_count?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          supplier_code?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      support_ticket_drafts: {
        Row: {
          client_id: string
          created_at: string
          draft_data: Json
          id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          draft_data: Json
          id?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          draft_data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_drafts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          client_id: string
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          department: string | null
          description: string | null
          id: string
          preferred_schedule: string | null
          printer_id: string | null
          priority: string
          request_type: string
          resolved_at: string | null
          status: string
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          preferred_schedule?: string | null
          printer_id?: string | null
          priority?: string
          request_type: string
          resolved_at?: string | null
          status?: string
          ticket_number: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          preferred_schedule?: string | null
          printer_id?: string | null
          priority?: string
          request_type?: string
          resolved_at?: string | null
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_records: {
        Row: {
          created_at: string
          customer: string | null
          date: string
          delivery_id: string | null
          delivery_receipt_number: string | null
          id: string
          model: string
          notes: string | null
          product_id: string | null
          purchase_order_id: string | null
          purchase_order_number: string | null
          quantity: number
          sales_invoice_number: string | null
          status: string
          supplier_client_id: number | null
          total_price: number
          type: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer?: string | null
          date: string
          delivery_id?: string | null
          delivery_receipt_number?: string | null
          id?: string
          model: string
          notes?: string | null
          product_id?: string | null
          purchase_order_id?: string | null
          purchase_order_number?: string | null
          quantity?: number
          sales_invoice_number?: string | null
          status?: string
          supplier_client_id?: number | null
          total_price?: number
          type: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer?: string | null
          date?: string
          delivery_id?: string | null
          delivery_receipt_number?: string | null
          id?: string
          model?: string
          notes?: string | null
          product_id?: string | null
          purchase_order_id?: string | null
          purchase_order_number?: string | null
          quantity?: number
          sales_invoice_number?: string | null
          status?: string
          supplier_client_id?: number | null
          total_price?: number
          type?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transaction_delivery"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transaction_purchase_order"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_records_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_records_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_delivery_links: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          delivery_unit_id: string
          id: string
          link_status: string
          linked_at: string | null
          notes: string | null
          purchase_order_unit_id: string
          updated_at: string | null
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          delivery_unit_id: string
          id?: string
          link_status?: string
          linked_at?: string | null
          notes?: string | null
          purchase_order_unit_id: string
          updated_at?: string | null
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          delivery_unit_id?: string
          id?: string
          link_status?: string
          linked_at?: string | null
          notes?: string | null
          purchase_order_unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_delivery_links_delivery_unit_id_fkey"
            columns: ["delivery_unit_id"]
            isOneToOne: true
            referencedRelation: "delivery_item_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_delivery_links_purchase_order_unit_id_fkey"
            columns: ["purchase_order_unit_id"]
            isOneToOne: true
            referencedRelation: "purchase_order_item_units"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          assignment_id: string | null
          cost_center: string | null
          created_at: string
          id: string
          logged_by: string | null
          logged_date: string
          pages_printed: number | null
          printer_id: string
          product_id: string | null
          supplies_consumed: Json | null
        }
        Insert: {
          assignment_id?: string | null
          cost_center?: string | null
          created_at?: string
          id?: string
          logged_by?: string | null
          logged_date?: string
          pages_printed?: number | null
          printer_id: string
          product_id?: string | null
          supplies_consumed?: Json | null
        }
        Update: {
          assignment_id?: string | null
          cost_center?: string | null
          created_at?: string
          id?: string
          logged_by?: string | null
          logged_date?: string
          pages_printed?: number | null
          printer_id?: string
          product_id?: string | null
          supplies_consumed?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "printer_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "assigned_printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      assigned_printers: {
        Row: {
          aliases: string | null
          color: string | null
          created_at: string | null
          current_renter_id: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_available: boolean | null
          location_count: number | null
          manufacturer: string | null
          model: string | null
          name: string | null
          printer_type: string | null
          purchase_price: number | null
          rental_eligible: boolean | null
          rental_end_date: string | null
          rental_price_per_month: number | null
          rental_price_per_print: number | null
          rental_price_type: string | null
          rental_start_date: string | null
          rental_status: string | null
          series: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printers_current_renter_id_fkey"
            columns: ["current_renter_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_purchases_with_details: {
        Row: {
          created_at: string | null
          id: string | null
          items_count: number | null
          notes: string | null
          purchase_date: string | null
          reference_number: string | null
          status: string | null
          supplier_id: string | null
          supplier_name: string | null
          total_amount: number | null
          total_quantity: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_file_stats: {
        Row: {
          full_name: string | null
          last_upload: string | null
          role: string | null
          total_files: number | null
          total_size: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_printer_assignment_safe: {
        Args: { assignment_id: string }
        Returns: undefined
      }
      determine_printer_type: {
        Args: { printer_name: string; printer_series: string }
        Returns: string
      }
      disable_printer_assignment_history_trigger: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enable_printer_assignment_history_trigger: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_products_by_shared_aliases: {
        Args: { product_id: string }
        Returns: {
          id: string
          name: string
          sku: string
          category: string
          description: string
          color: string
          alias: string
          created_at: string
          updated_at: string
          shared_aliases: string[]
        }[]
      }
      generate_order_number: {
        Args: { order_type: string }
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_table_names: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      get_assigned_printers_with_assignments: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          manufacturer: string
          model: string
          printer_assignments: Json
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_printer_assignment_status: {
        Args: {
          p_client_id: string
          p_department_location_id: string
          p_is_unassigned: boolean
        }
        Returns: string
      }
      get_total_page_views: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      increment_page_view: {
        Args:
          | { path: string; is_bot?: boolean }
          | { path: string; is_bot?: boolean; client_ip?: string }
        Returns: Json
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_client_activity: {
        Args: {
          p_client_id: string
          p_activity_type: string
          p_description: string
          p_metadata?: Json
          p_performed_by?: string
        }
        Returns: string
      }
      log_client_audit_change: {
        Args: {
          p_client_id: string
          p_field_changed: string
          p_old_value: string
          p_new_value: string
          p_change_reason?: string
          p_changed_by?: string
        }
        Returns: string
      }
      promote_to_superadmin: {
        Args: { user_id: string }
        Returns: undefined
      }
      search_products_with_alias: {
        Args: { search_term: string }
        Returns: {
          id: string
          name: string
          sku: string
          category: string
          description: string
          color: string
          alias: string
          created_at: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

