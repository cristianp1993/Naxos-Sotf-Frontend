import { MenuData } from '@/types/menu';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';


export const fetchMenu = async (): Promise<MenuData> => {
  try {
    const response = await fetch(`${API_URL}/api/menu/public`);

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
export { API_URL };