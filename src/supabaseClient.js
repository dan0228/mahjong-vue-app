import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cwqrpbeqjtemaallolxn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cXJwYmVxanRlbWFhbGxvbHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjgxMDgsImV4cCI6MjA3NDUwNDEwOH0.QvH0kZYbXSSezKf8aiuMQr8BYyaKJ1pdTfxU8_uraqA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
