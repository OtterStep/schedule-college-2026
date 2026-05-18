'use client';
import DashboardPage from '@/components/dashboard/page';
import VistaHorarioDocentePage from '@/components/dashboard/horarios/vista-docente/page';
import { useAuthStore } from '@/stores/auth.store';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';

export default function Dashboard() {
	const { usuario, estaCargando } = useAuthStore();

	if (estaCargando) return <SpinnerCarga />;
	if (usuario?.rol === 'PROFESOR') return <VistaHorarioDocentePage />;

	return <DashboardPage />;
}
