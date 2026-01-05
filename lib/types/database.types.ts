export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AssessmentStatus =
  | 'not_started'
  | 'in_progress'
  | 'to_review'
  | 'to_submit'
  | 'returned_with_comments'
  | 'submitted'
  | 'to_publish'
  | 'published'

export type UserRole = 'assessor' | 'co-assessor' | 'reviewer'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          date_joined: string
          time_zone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          date_joined?: string
          time_zone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          date_joined?: string
          time_zone?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_users: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: UserRole
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: UserRole
          created_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          project_id: string
          common_name: string | null
          scientific_name: string | null
          status: AssessmentStatus
          type_of_assessment: string | null
          assignee_id: string | null
          progress: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          common_name?: string | null
          scientific_name?: string | null
          status?: AssessmentStatus
          type_of_assessment?: string | null
          assignee_id?: string | null
          progress?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          common_name?: string | null
          scientific_name?: string | null
          status?: AssessmentStatus
          type_of_assessment?: string | null
          assignee_id?: string | null
          progress?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      assessment_assignments: {
        Row: {
          id: string
          assessment_id: string
          user_id: string
          permission: 'edit' | 'read_only'
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          user_id: string
          permission: 'edit' | 'read_only'
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          user_id?: string
          permission?: 'edit' | 'read_only'
          created_at?: string
        }
      }
      taxa: {
        Row: {
          id: string
          kingdom: string
          phylum: string
          class: string
          spp_count: number
          created_at: string
        }
        Insert: {
          id?: string
          kingdom: string
          phylum: string
          class: string
          spp_count: number
          created_at?: string
        }
        Update: {
          id?: string
          kingdom?: string
          phylum?: string
          class?: string
          spp_count?: number
          created_at?: string
        }
      }
      assessment_taxa: {
        Row: {
          id: string
          assessment_id: string
          taxa_id: string
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          taxa_id: string
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          taxa_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
        }
      }
    }
  }
}
