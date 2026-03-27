import api from './api';

export interface TarjetaGuardada {
  id: string;
  nombre_titular: string;
  ultimos4: string;
  marca: string;
  mes_expiracion: number;
  anio_expiracion: number;
  es_predeterminada: boolean;
  creado_en: string;
}

export interface NuevaTarjeta {
  numero_tarjeta: string;
  nombre_titular: string;
  mes_expiracion: number;
  anio_expiracion: number;
  cvv: string;
}

export interface RecargaConTarjeta {
  tarjeta_id: string;
  monto: number;
  cvv: string;
}

export const cardService = {
  listar: async (): Promise<TarjetaGuardada[]> => {
    const { data } = await api.get<TarjetaGuardada[]>('/cards');
    return data;
  },

  registrar: async (tarjeta: NuevaTarjeta): Promise<TarjetaGuardada> => {
    const { data } = await api.post<TarjetaGuardada>('/cards', tarjeta);
    return data;
  },

  establecerPredeterminada: async (tarjetaId: string): Promise<TarjetaGuardada> => {
    const { data } = await api.put<TarjetaGuardada>(`/cards/${tarjetaId}/default`);
    return data;
  },

  eliminar: async (tarjetaId: string): Promise<void> => {
    await api.delete(`/cards/${tarjetaId}`);
  },

  recargarBilletera: async (body: RecargaConTarjeta) => {
    const { data } = await api.post('/cards/recharge', body);
    return data;
  },
};
