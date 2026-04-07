16:44:54.931 
 4 | import { Bus, Users, CreditCard, BedDouble, ChevronLeft, Phone, Mail, MessageSquare, CheckCircle, Clock } from 'lucide-react'
16:44:54.932 
 5 | import EliminarViajeButton from './EliminarViajeButton'import CalendarioPagos from '@/components/CalendarioPagos'
16:44:54.932 
   :                                                        ^^^^^^
16:44:54.932 
 6 | 
16:44:54.932 
 7 | function formatMXN(n: number) {
16:44:54.932 
 8 |   return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
16:44:54.932 
   `----
16:44:54.933 
16:44:54.933 
Caused by:
16:44:54.933 
    Syntax Error
16:44:54.933 
16:44:54.933 
Import trace for requested module:
16:44:54.933 
./src/app/viajes/[id]/page.tsx
16:44:54.933 
16:44:54.945 
16:44:54.946 
> Build failed because of webpack errors
16:44:54.964 
Error: Command "next build" exited with 1
