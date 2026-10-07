/**
 * ClassHub Database Types Definition
 * Compatible with Supabase (PostgreSQL 16) and Phase 2A Architecture Schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ClassRole = 'STUDENT' | 'CONTROLLER' | 'ADMIN';
export type SubjectCategory = 'SCIENTIFICA' | 'UMANISTICA' | 'LINGUISTICA' | 'ARTISTICA_MOTORIA' | 'ALTRO';
export type EventType = 'VERIFICA' | 'INTERROGAZIONE' | 'EVENTO' | 'PERSONALE';
export type InterrogationStatus = 'OPEN' | 'FULL' | 'CLOSED';
export type NoticePriority = 'NORMAL' | 'HIGH';
export type MaterialFileType = 'PDF' | 'PNG' | 'DOC' | 'LINK' | 'SLIDES';
export type SurveyStatus = 'OPEN' | 'CLOSED';
export type RepresentationCategory = 'PROPOSTA' | 'DOMANDA_PROF' | 'ASSEMBLEA' | 'OBIETTIVO' | 'ATTIVITA';
export type RepresentationStatus = 'IN_ATTESA' | 'IN_CORSO' | 'DISCUSSO' | 'APPROVATO' | 'RESPINTO';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // references auth.users(id)
          first_name: string;
          last_name: string;
          email: string;
          avatar_id: string;
          active_class_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          avatar_id?: string;
          active_class_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          avatar_id?: string;
          active_class_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          name: string;
          code: string;
          school_name: string;
          academic_year: string;
          created_by: string;
          allow_self_join: boolean;
          lock_volunteers_on_deadline: boolean;
          controller_can_create_notices: boolean;
          admin_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          school_name?: string;
          academic_year?: string;
          created_by: string;
          allow_self_join?: boolean;
          lock_volunteers_on_deadline?: boolean;
          controller_can_create_notices?: boolean;
          admin_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          school_name?: string;
          academic_year?: string;
          created_by?: string;
          allow_self_join?: boolean;
          lock_volunteers_on_deadline?: boolean;
          controller_can_create_notices?: boolean;
          admin_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      class_members: {
        Row: {
          id: string;
          class_id: string;
          user_id: string;
          role: ClassRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          user_id: string;
          role?: ClassRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          user_id?: string;
          role?: ClassRole;
          joined_at?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          class_id: string;
          name: string;
          category: SubjectCategory;
          color: string;
          default_teacher: string | null;
          default_room: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          name: string;
          category?: SubjectCategory;
          color?: string;
          default_teacher?: string | null;
          default_room?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          name?: string;
          category?: SubjectCategory;
          color?: string;
          default_teacher?: string | null;
          default_room?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      timetable_slots: {
        Row: {
          id: string;
          class_id: string;
          day_of_week: number;
          hour: number;
          time_range: string;
          subject_id: string | null;
          subject_name: string;
          teacher: string | null;
          room: string | null;
        };
        Insert: {
          id?: string;
          class_id: string;
          day_of_week: number;
          hour: number;
          time_range: string;
          subject_id?: string | null;
          subject_name: string;
          teacher?: string | null;
          room?: string | null;
        };
        Update: {
          id?: string;
          class_id?: string;
          day_of_week?: number;
          hour?: number;
          time_range?: string;
          subject_id?: string | null;
          subject_name?: string;
          teacher?: string | null;
          room?: string | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          class_id: string | null;
          author_id: string;
          title: string;
          subject_id: string | null;
          subject_name: string | null;
          type: EventType;
          event_date: string;
          start_time: string;
          end_time: string | null;
          description: string | null;
          teacher: string | null;
          is_personal: boolean;
          interrogation_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id?: string | null;
          author_id: string;
          title: string;
          subject_id?: string | null;
          subject_name?: string | null;
          type: EventType;
          event_date: string;
          start_time: string;
          end_time?: string | null;
          description?: string | null;
          teacher?: string | null;
          is_personal?: boolean;
          interrogation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string | null;
          author_id?: string;
          title?: string;
          subject_id?: string | null;
          subject_name?: string | null;
          type?: EventType;
          event_date?: string;
          start_time?: string;
          end_time?: string | null;
          description?: string | null;
          teacher?: string | null;
          is_personal?: boolean;
          interrogation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interrogations: {
        Row: {
          id: string;
          class_id: string;
          created_by: string;
          title: string;
          subject_id: string | null;
          subject_name: string;
          interrogation_date: string;
          start_time: string;
          end_time: string | null;
          max_volunteers: number;
          deadline: string | null;
          status: InterrogationStatus;
          teacher: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          created_by: string;
          title: string;
          subject_id?: string | null;
          subject_name: string;
          interrogation_date: string;
          start_time: string;
          end_time?: string | null;
          max_volunteers: number;
          deadline?: string | null;
          status?: InterrogationStatus;
          teacher?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          created_by?: string;
          title?: string;
          subject_id?: string | null;
          subject_name?: string;
          interrogation_date?: string;
          start_time?: string;
          end_time?: string | null;
          max_volunteers?: number;
          deadline?: string | null;
          status?: InterrogationStatus;
          teacher?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interrogation_volunteers: {
        Row: {
          id: string;
          interrogation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          interrogation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          interrogation_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      notices: {
        Row: {
          id: string;
          class_id: string;
          author_id: string;
          title: string;
          content: string;
          notice_date: string;
          priority: NoticePriority;
          linked_event_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          author_id: string;
          title: string;
          content: string;
          notice_date?: string;
          priority?: NoticePriority;
          linked_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          author_id?: string;
          title?: string;
          content?: string;
          notice_date?: string;
          priority?: NoticePriority;
          linked_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          class_id: string;
          uploaded_by: string;
          subject_id: string | null;
          subject_name: string;
          title: string;
          description: string | null;
          url: string | null;
          storage_path: string | null;
          file_name: string | null;
          file_size: number | null;
          file_type: MaterialFileType;
          material_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          uploaded_by: string;
          subject_id?: string | null;
          subject_name: string;
          title: string;
          description?: string | null;
          url?: string | null;
          storage_path?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: MaterialFileType;
          material_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          uploaded_by?: string;
          subject_id?: string | null;
          subject_name?: string;
          title?: string;
          description?: string | null;
          url?: string | null;
          storage_path?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: MaterialFileType;
          material_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      surveys: {
        Row: {
          id: string;
          class_id: string;
          author_id: string;
          title: string;
          question: string;
          status: SurveyStatus;
          deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          author_id: string;
          title: string;
          question: string;
          status?: SurveyStatus;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          author_id?: string;
          title?: string;
          question?: string;
          status?: SurveyStatus;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      survey_options: {
        Row: {
          id: string;
          survey_id: string;
          text: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          survey_id: string;
          text: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          survey_id?: string;
          text?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      survey_votes: {
        Row: {
          id: string;
          survey_id: string;
          option_id: string;
          user_id: string;
          voted_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          option_id: string;
          user_id: string;
          voted_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          option_id?: string;
          user_id?: string;
          voted_at?: string;
        };
        Relationships: [];
      };
      representation_items: {
        Row: {
          id: string;
          class_id: string;
          author_id: string;
          category: RepresentationCategory;
          title: string;
          description: string;
          status: RepresentationStatus;
          item_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          author_id: string;
          category: RepresentationCategory;
          title: string;
          description: string;
          status?: RepresentationStatus;
          item_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          author_id?: string;
          category?: RepresentationCategory;
          title?: string;
          description?: string;
          status?: RepresentationStatus;
          item_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          subscription: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          subscription: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          subscription?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      toggle_volunteer_reservation: {
        Args: {
          p_interrogation_id: string;
        };
        Returns: Json;
      };
      is_class_member: {
        Args: {
          p_class_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      get_class_role: {
        Args: {
          p_class_id: string;
          p_user_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      class_role: ClassRole;
      subject_category: SubjectCategory;
      event_type: EventType;
      interrogation_status: InterrogationStatus;
      notice_priority: NoticePriority;
      material_file_type: MaterialFileType;
      survey_status: SurveyStatus;
      representation_category: RepresentationCategory;
      representation_status: RepresentationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
