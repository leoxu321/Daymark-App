// Database types for Supabase
// Note: In production, generate these with: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type JobSource = 'simplify-jobs' | 'jsearch' | 'remotive' | 'adzuna'
export type ApplicationStatus =
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'ghosted'
  | 'withdrawn'
  | 'not_applied'
export type TaskCategory =
  | 'job-application'
  | 'work'
  | 'personal'
  | 'health'
  | 'learning'
  | 'other'
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'skipped'
export type TimeSlot = 'morning' | 'afternoon' | 'evening'
export type Theme = 'light' | 'dark' | 'system'
export type AssignmentJobStatus = 'assigned' | 'completed' | 'skipped'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          skills_languages: string[]
          skills_frameworks: string[]
          skills_tools: string[]
          skills_role_types: string[]
          skills_other_keywords: string[]
          resume_file_name: string | null
          resume_uploaded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          skills_languages?: string[]
          skills_frameworks?: string[]
          skills_tools?: string[]
          skills_role_types?: string[]
          skills_other_keywords?: string[]
          resume_file_name?: string | null
          resume_uploaded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: Theme
          jobs_per_day: number
          working_hours_start: string
          working_hours_end: string
          auto_shift_enabled: boolean
          shift_buffer: number
          enabled_job_sources: string[]
          job_search_query: string
          job_search_location: string
          job_search_employment_type: string
          job_search_remote: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: Theme
          jobs_per_day?: number
          working_hours_start?: string
          working_hours_end?: string
          auto_shift_enabled?: boolean
          shift_buffer?: number
          enabled_job_sources?: string[]
          job_search_query?: string
          job_search_location?: string
          job_search_employment_type?: string
          job_search_remote?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>
      }
      jobs: {
        Row: {
          id: string
          external_id: string
          source: JobSource
          company: string
          role: string
          location: string
          application_url: string
          date_posted: string | null
          sponsorship: boolean | null
          no_sponsorship: boolean
          us_only: boolean
          is_sub_entry: boolean
          remote: boolean
          salary: string | null
          description: string | null
          employment_type: string | null
          fetched_at: string
          created_at: string
        }
        Insert: {
          id?: string
          external_id: string
          source: JobSource
          company: string
          role: string
          location: string
          application_url: string
          date_posted?: string | null
          sponsorship?: boolean | null
          no_sponsorship?: boolean
          us_only?: boolean
          is_sub_entry?: boolean
          remote?: boolean
          salary?: string | null
          description?: string | null
          employment_type?: string | null
          fetched_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
      }
      user_jobs: {
        Row: {
          id: string
          user_id: string
          job_id: string
          match_score: number | null
          matched_keywords: string[]
          is_seen: boolean
          seen_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          match_score?: number | null
          matched_keywords?: string[]
          is_seen?: boolean
          seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_jobs']['Insert']>
      }
      daily_assignments: {
        Row: {
          id: string
          user_id: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['daily_assignments']['Insert']>
      }
      daily_assignment_jobs: {
        Row: {
          id: string
          assignment_id: string
          job_id: string
          status: AssignmentJobStatus
          skip_reason: string | null
          completed_at: string | null
          skipped_at: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          job_id: string
          status?: AssignmentJobStatus
          skip_reason?: string | null
          completed_at?: string | null
          skipped_at?: string | null
          display_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['daily_assignment_jobs']['Insert']>
      }
      applications: {
        Row: {
          id: string
          user_id: string
          job_id: string
          status: ApplicationStatus
          company: string
          role: string
          location: string
          application_url: string
          match_score: number | null
          notes: string | null
          interview_date: string | null
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          status?: ApplicationStatus
          company: string
          role: string
          location: string
          application_url: string
          match_score?: number | null
          notes?: string | null
          interview_date?: string | null
          applied_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          date: string
          start_time: string | null
          end_time: string | null
          duration: number
          preferred_time_slot: TimeSlot | null
          category: TaskCategory
          status: TaskStatus
          was_auto_shifted: boolean
          original_start_time: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          date: string
          start_time?: string | null
          end_time?: string | null
          duration: number
          preferred_time_slot?: TimeSlot | null
          category: TaskCategory
          status?: TaskStatus
          was_auto_shifted?: boolean
          original_start_time?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      fitness_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target: number
          unit: string
          icon: string | null
          is_default: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target: number
          unit: string
          icon?: string | null
          is_default?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['fitness_goals']['Insert']>
      }
      daily_fitness_progress: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          date: string
          completed: boolean
          value: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          date: string
          completed?: boolean
          value?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['daily_fitness_progress']['Insert']>
      }
      calendar_busy_slots: {
        Row: {
          id: string
          user_id: string
          date: string
          slot_start: string
          slot_end: string
          google_event_id: string | null
          cached_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          slot_start: string
          slot_end: string
          google_event_id?: string | null
          cached_at?: string
        }
        Update: Partial<Database['public']['Tables']['calendar_busy_slots']['Insert']>
      }
      google_calendar_auth: {
        Row: {
          id: string
          user_id: string
          google_email: string | null
          google_picture: string | null
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          google_email?: string | null
          google_picture?: string | null
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['google_calendar_auth']['Insert']>
      }
    }
    Functions: {
      upsert_job: {
        Args: {
          p_external_id: string
          p_source: string
          p_company: string
          p_role: string
          p_location: string
          p_application_url: string
          p_date_posted?: string | null
          p_sponsorship?: boolean | null
          p_no_sponsorship?: boolean
          p_us_only?: boolean
          p_is_sub_entry?: boolean
          p_remote?: boolean
          p_salary?: string | null
          p_description?: string | null
          p_employment_type?: string | null
        }
        Returns: string
      }
    }
  }
}

// Helper types for easier use
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']

export type DbJob = Database['public']['Tables']['jobs']['Row']
export type DbJobInsert = Database['public']['Tables']['jobs']['Insert']
export type DbJobUpdate = Database['public']['Tables']['jobs']['Update']

export type UserJob = Database['public']['Tables']['user_jobs']['Row']
export type UserJobInsert = Database['public']['Tables']['user_jobs']['Insert']
export type UserJobUpdate = Database['public']['Tables']['user_jobs']['Update']

export type DailyAssignment = Database['public']['Tables']['daily_assignments']['Row']
export type DailyAssignmentInsert = Database['public']['Tables']['daily_assignments']['Insert']

export type DailyAssignmentJob = Database['public']['Tables']['daily_assignment_jobs']['Row']
export type DailyAssignmentJobInsert = Database['public']['Tables']['daily_assignment_jobs']['Insert']
export type DailyAssignmentJobUpdate = Database['public']['Tables']['daily_assignment_jobs']['Update']

export type DbApplication = Database['public']['Tables']['applications']['Row']
export type DbApplicationInsert = Database['public']['Tables']['applications']['Insert']
export type DbApplicationUpdate = Database['public']['Tables']['applications']['Update']

export type DbTask = Database['public']['Tables']['tasks']['Row']
export type DbTaskInsert = Database['public']['Tables']['tasks']['Insert']
export type DbTaskUpdate = Database['public']['Tables']['tasks']['Update']

export type FitnessGoal = Database['public']['Tables']['fitness_goals']['Row']
export type FitnessGoalInsert = Database['public']['Tables']['fitness_goals']['Insert']
export type FitnessGoalUpdate = Database['public']['Tables']['fitness_goals']['Update']

export type DailyFitnessProgress = Database['public']['Tables']['daily_fitness_progress']['Row']
export type DailyFitnessProgressInsert = Database['public']['Tables']['daily_fitness_progress']['Insert']
export type DailyFitnessProgressUpdate = Database['public']['Tables']['daily_fitness_progress']['Update']

export type CalendarBusySlot = Database['public']['Tables']['calendar_busy_slots']['Row']
export type GoogleCalendarAuth = Database['public']['Tables']['google_calendar_auth']['Row']
