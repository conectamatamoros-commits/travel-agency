'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import NuevoViajeForm from './NuevoViajeForm'

export default function NuevoViajeButton() {
  const [show, setShow] = useState(false)
  return (
    <>
      {show && <NuevoViajeForm onClose={() => setShow(false)} />}
      <button onClick={() => setShow(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Nuevo viaje
      </button>
    </>
  )
}
