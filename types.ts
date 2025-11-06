export interface Company {
  id?: number;
  name: string;
  address: string;
  phone: string;
  gstin: string;
  user_id?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  gstin: string;
  user_id?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  unit_price: number;
  user_id?: string;
  created_at?: string;
}

export interface InvoiceItem {
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export type InvoiceStatus = 'Draft' | 'Unpaid' | 'Paid' | 'Overdue';

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer: Customer; // For frontend use
  customer_id: string; // For backend relation
  items: InvoiceItem[];
  subtotal: number;
  gst_percent: number;
  gst_amount: number;
  total_amount: number;
  notes: string;
  status: InvoiceStatus;
  user_id?: string;
  created_at?: string;
}

export interface InvoiceFormData {
  customer_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  items: {
    name: string;
    unit_price: number | string;
    quantity: number | string;
  }[];
  gst_percent: number | string;
  notes: string;
}

// Supabase-generated types (manual version)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      company_info: {
        Row: {
          id: number
          name: string
          address: string
          phone: string
          gstin: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          address: string
          phone: string
          gstin: string
          user_id: string
        }
        Update: {
          name?: string
          address?: string
          phone?: string
          gstin?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          gstin: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone: string
          gstin: string
          user_id: string
        }
        Update: {
          name?: string
          address?: string
          phone?: string
          gstin?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          unit_price: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          unit_price: number
          user_id: string
        }
        Update: {
          name?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          invoice_date: string
          due_date: string
          customer_id: string
          items: Json
          subtotal: number
          gst_percent: number
          gst_amount: number
          total_amount: number
          notes: string
          status: InvoiceStatus
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          invoice_date: string
          due_date: string
          customer_id: string
          items: Json
          subtotal: number
          gst_percent: number
          gst_amount: number
          total_amount: number
          notes: string
          status?: InvoiceStatus
          user_id: string
        }
        Update: {
          invoice_number?: string
          invoice_date?: string
          due_date?: string
          customer_id?: string
          items?: Json
          subtotal?: number
          gst_percent?: number
          gst_amount?: number
          total_amount?: number
          notes?: string
          status?: InvoiceStatus
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      invoice_status: "Draft" | "Unpaid" | "Paid" | "Overdue"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}