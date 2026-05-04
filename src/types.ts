export type Theme = 'warm-retro' | 'soft-mint' | 'earth-neutral';
export type FontSize = 'small' | 'medium' | 'large';
export type UserRole = 'manager' | 'staff' | 'none';
export type SystemStatus = 'activation' | 'setup' | 'login' | 'dashboard';

export type OrderStatus = 'pending' | 'completed';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  commissionPercent?: number;
  type?: 'single' | 'combo';
  comboItems?: { productName: string; quantity: number }[]; // Using productName/quantity as requested for macro expansion
}

export interface CartItem extends Product {
  quantity: number;
  cartId: string; // Unique ID for this row in the cart
  itemNote?: string;
  subCustomer?: string;
}

export interface Customer {
  id: string;
  name: string;
  notes?: string;
  registeredAt: number;
}

export interface Order {
  id: string;
  staffName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  isGroup?: boolean;
  headcount?: number;
  note?: string;
}

export interface POSState {
  // System context
  systemStatus: SystemStatus;
  shopId: string;
  filterDate: string; // YYYY-MM-DD
  
  // Shop data
  shopName: string;
  hourlyWage: number;
  managerPassword?: string;
  staffPassword?: string;
  announcement?: string;
  
  // Current session
  staffName: string;
  role: UserRole;
  isLoggedIn: boolean;
  lastLoginTime: number;
  
  // Layout & Theme
  theme: Theme;
  fontSize: FontSize;
  currentView: 'order' | 'kitchen' | 'history' | 'settings' | 'analytics' | 'admin';
  
  // Business data
  products: Product[];
  orders: Order[];
  customers: Customer[];
  categories: string[];
  staffList: string[];
  discordWebhookUrl?: string;
}

export interface PosContextType {
  state: POSState;
  
  // Auth & System Actions
  activateCode: (code: string) => Promise<{ success: boolean, message?: string }>;
  setupShop: (shopName: string, managerPassword: string, staffPassword: string) => Promise<{ success: boolean, message?: string }>;
  loginManager: (password: string) => { success: boolean, message?: string };
  loginStaff: (staffName: string, password: string) => { success: boolean, message?: string };
  logout: () => void;
  updatePasswords: (managerPassword?: string, staffPassword?: string, hourlyWage?: number) => void;
  
  // UI Actions
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setView: (view: POSState['currentView']) => void;
  setFilterDate: (date: string) => void;
  updateAnnouncement: (text: string) => Promise<void>;
  resetSystem: () => void;
  
  // Data Actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  bulkAddProducts: (products: Omit<Product, 'id'>[]) => Promise<void>;
  linkExistingShop: (shopId: string) => Promise<boolean>;
  createOrder: (items: CartItem[], customerId?: string, isGroup?: boolean, headcount?: number, note?: string, customerName?: string) => void;
  completeOrder: (id: string) => void;
  deleteOrder: (id: string) => void;
  updateOrder: (order: Order) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'registeredAt'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  updateStaffList: (staffList: string[]) => void;
  updateDiscordWebhookUrl: (url: string) => Promise<void>;
}
