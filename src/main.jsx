import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Buscaminas from './buscaminas.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Buscaminas />
  </StrictMode>,
)
