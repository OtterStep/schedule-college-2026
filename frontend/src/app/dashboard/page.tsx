'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { useAuthStore } from '@/stores/auth.store';

export default function Dashboard() {
	const router = useRouter();
	const { usuario, estaCargando } = useAuthStore();

	useEffect(() => {
		if (!estaCargando && usuario) {
			const esAdministrativo = usuario.rol === 'ADMINISTRADOR' || usuario.rol === 'DIRECTOR' || usuario.rol === 'SECRETARIA';
			if (esAdministrativo) {
				router.replace('/dashboard/admin');
			} else {
				router.replace('/dashboard/docente');
			}
		}
	}, [estaCargando, router, usuario]);

	return <SpinnerCarga />;
}
