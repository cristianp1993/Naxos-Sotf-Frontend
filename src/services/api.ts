import { MenuData } from '@/types/menu';

const API_BASE_URL = 'http://localhost:3000';

export const fetchMenu = async (): Promise<MenuData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/menu`);

    if (!response.ok) {
      throw new Error(`Error fetching menu: ${response.statusText}`);
    }

    const data = await response.json();
    return data.menu;
  } catch (error) {
    console.error('Error fetching menu:', error);
    throw error;
  }
};
