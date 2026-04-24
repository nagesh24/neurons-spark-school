export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teachers: {
        Row: {
          class_id: string
          created_at: string
          id: string
          subject_id: string | null
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          subject_id?: string | null
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          subject_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          grade_level: string | null
          id: string
          name: string
          section: string | null
        }
        Insert: {
          created_at?: string
          grade_level?: string | null
          id?: string
          name: string
          section?: string | null
        }
        Update: {
          created_at?: string
          grade_level?: string | null
          id?: string
          name?: string
          section?: string | null
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount: number
          created_at: string
          fee_id: string
          id: string
          method: string | null
          paid_on: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          fee_id: string
          id?: string
          method?: string | null
          paid_on?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          fee_id?: string
          id?: string
          method?: string | null
          paid_on?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          net_amount: number
          notes: string | null
          paid_amount: number
          status: Database["public"]["Enums"]["fee_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          net_amount?: number
          notes?: string | null
          paid_amount?: number
          status?: Database["public"]["Enums"]["fee_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          net_amount?: number
          notes?: string | null
          paid_amount?: number
          status?: Database["public"]["Enums"]["fee_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          attachment_url: string | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          posted_by: string | null
          subject_id: string | null
          title: string
        }
        Insert: {
          attachment_url?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          posted_by?: string | null
          subject_id?: string | null
          title: string
        }
        Update: {
          attachment_url?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          posted_by?: string | null
          subject_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          audience: Database["public"]["Enums"]["notice_audience"]
          body: string
          created_at: string
          id: string
          image_url: string | null
          posted_by: string | null
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["notice_audience"]
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          posted_by?: string | null
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["notice_audience"]
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          posted_by?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          created_by: string | null
          grade: Database["public"]["Enums"]["performance_grade"] | null
          id: string
          percentage: number | null
          remarks: string | null
          student_id: string
          subject_id: string
          term: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          grade?: Database["public"]["Enums"]["performance_grade"] | null
          id?: string
          percentage?: number | null
          remarks?: string | null
          student_id: string
          subject_id: string
          term?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          grade?: Database["public"]["Enums"]["performance_grade"] | null
          id?: string
          percentage?: number | null
          remarks?: string | null
          student_id?: string
          subject_id?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_subjects: {
        Row: {
          id: string
          student_id: string
          subject_id: string
        }
        Insert: {
          id?: string
          student_id: string
          subject_id: string
        }
        Update: {
          id?: string
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_subjects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          admission_no: string
          avatar_url: string | null
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          parent_name: string | null
          parent_phone: string | null
          roll_no: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admission_no: string
          avatar_url?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id?: string
          parent_name?: string | null
          parent_phone?: string | null
          roll_no?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admission_no?: string
          avatar_url?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          parent_name?: string | null
          parent_phone?: string | null
          roll_no?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          employee_id: string
          full_name: string
          id: string
          joining_date: string | null
          phone: string | null
          qualification: string | null
          subject_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          employee_id: string
          full_name: string
          id?: string
          joining_date?: string | null
          phone?: string | null
          qualification?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          employee_id?: string
          full_name?: string
          id?: string
          joining_date?: string | null
          phone?: string | null
          qualification?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
      attendance_status: "present" | "absent" | "late"
      fee_status: "paid" | "partial" | "pending" | "overdue"
      notice_audience: "teachers" | "students" | "both"
      performance_grade: "W" | "R" | "U" | "AD"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
      attendance_status: ["present", "absent", "late"],
      fee_status: ["paid", "partial", "pending", "overdue"],
      notice_audience: ["teachers", "students", "both"],
      performance_grade: ["W", "R", "U", "AD"],
    },
  },
} as const
