import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import MeusSites from './pages/MeusSites'
import CriarSite from './pages/CriarSite'
import EditarSite from './pages/EditarSite'
import Dominios from './pages/Dominios'
import ComprarDominio from './pages/ComprarDominio'
import Conta from './pages/Conta'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <MeusSites />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/criar"
            element={
              <PrivateRoute>
                <Layout>
                  <CriarSite />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/editar/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <EditarSite />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/dominios"
            element={
              <PrivateRoute>
                <Layout>
                  <Dominios />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/comprar-dominio"
            element={
              <PrivateRoute>
                <Layout>
                  <ComprarDominio />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/conta"
            element={
              <PrivateRoute>
                <Layout>
                  <Conta />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
