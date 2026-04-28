import { http } from '../client';
import type { SalesChannel, Service, ServiceCategory } from '../types/schema';

export async function fetchServiceCategories() {
  const { data } = await http.get<ServiceCategory[]>('/service-categories');
  return data;
}

export async function fetchServiceCategoriesAdmin() {
  const { data } = await http.get<ServiceCategory[]>('/service-categories', {
    params: { all: '1' },
  });
  return data;
}

export async function createServiceCategory(body: { name: string; sortOrder?: number }) {
  const { data } = await http.post<ServiceCategory>('/service-categories', body);
  return data;
}

export async function createService(body: {
  categoryId: string;
  name: string;
  defaultPrice: number;
  active?: boolean;
}) {
  const { data } = await http.post<Service>('/services', body);
  return data;
}

export async function patchService(id: string, body: { active?: boolean; name?: string; defaultPrice?: number }) {
  const { data } = await http.patch<Service>(`/services/${id}`, body);
  return data;
}

export async function patchServiceCategory(
  id: string,
  body: { name?: string; sortOrder?: number; active?: boolean },
) {
  const { data } = await http.patch<ServiceCategory>(`/service-categories/${id}`, body);
  return data;
}

export async function fetchSalesChannels() {
  const { data } = await http.get<SalesChannel[]>('/sales-channels');
  return data;
}
