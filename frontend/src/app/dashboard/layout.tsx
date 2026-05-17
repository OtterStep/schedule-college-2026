'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layouts/Sidebar';
import { BarraSuperior } from '@/components/layouts/BarraSuperior';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { estaAutenticado, estaCargando, token, cargarSesion } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token && !estaAutenticado && !estaCargando) {
      cargarSesion();
    }
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, estaAutenticado, estaCargando]);

  if (!estaAutenticado && token) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <SpinnerCarga />
      </div>
    );
  }

  if (!estaAutenticado && !token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <BarraSuperior />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}