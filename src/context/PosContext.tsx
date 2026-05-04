import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, Order, POSState, Theme, 
  CartItem, Customer, UserRole, PosContextType, SystemStatus 
} from '../types';
import { 
  db, handleFirestoreError, OperationType 
} from '../lib/firebase';
import { 
  doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs,
  collection, onSnapshot, query, serverTimestamp, 
  where, orderBy, limit, Timestamp, addDoc, writeBatch
} from 'firebase/firestore';

const PosContext = createContext<PosContextType | undefined>(undefined);

const DEFAULT_PRODUCTS: Product[] = [];

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<POSState>(() => {
    const defaultState: POSState = {
      systemStatus: 'activation',
      shopId: '',
      shopName: '',
      hourlyWage: 180,
      staffName: '',
      role: 'none',
      isLoggedIn: false,
      lastLoginTime: 0,
      theme: 'warm-retro',
      fontSize: 'medium',
      currentView: 'order',
      filterDate: new Date().toISOString().split('T')[0],
      products: [],
      orders: [],
      customers: [],
      categories: ['飲品', '特調', '指名服務'],
      staffList: [],
      discordWebhookUrl: '',
      announcement: '',
    };

    const saved = localStorage.getItem('pos_state_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...defaultState,
          ...parsed, 
          isLoggedIn: false,
          role: 'none',
          staffName: '',
          lastLoginTime: parsed.lastLoginTime || 0
        };
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return defaultState;
  });

  // Helper for date range
  const getDateRange = (dateStr: string) => {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);
    return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) };
  };

  // Persist basic local UI state
  useEffect(() => {
    const persistData = { 
      systemStatus: state.systemStatus,
      shopId: state.shopId,
      shopName: state.shopName,
      theme: state.theme,
      fontSize: state.fontSize,
      currentView: state.currentView,
      filterDate: state.filterDate,
      lastLoginTime: state.lastLoginTime
    };
    localStorage.setItem('pos_state_v2', JSON.stringify(persistData));
  }, [state.systemStatus, state.shopId, state.shopName, state.theme, state.currentView, state.filterDate, state.fontSize, state.lastLoginTime]);

  // Sync shop data (passwords, categories, etc.)
  useEffect(() => {
    if (!state.shopId) return;

    const shopRef = doc(db, 'shops', state.shopId);
    const unsubscribe = onSnapshot(shopRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setState(prev => ({
          ...prev,
          shopName: data.name,
          hourlyWage: data.hourlyWage || 180,
          managerPassword: data.managerPassword,
          staffPassword: data.staffPassword,
          theme: data.theme as Theme,
          fontSize: data.fontSize as any || prev.fontSize,
          categories: data.categories || prev.categories,
          staffList: data.staffList || [],
          discordWebhookUrl: data.discordWebhookUrl || '',
          announcement: data.announcement || '',
          systemStatus: prev.systemStatus === 'activation' || prev.systemStatus === 'setup' ? 'login' : prev.systemStatus
        }));
      }
    }, (error) => {
      console.error("Shop Sync Error:", error);
    });

    return () => unsubscribe();
  }, [state.shopId]);

  // Sync collections
  useEffect(() => {
    if (!state.isLoggedIn || !state.shopId) return;

    const productsRef = collection(db, 'shops', state.shopId, 'products');
    const ordersRef = collection(db, 'shops', state.shopId, 'orders');
    const customersRef = collection(db, 'shops', state.shopId, 'customers');

    const unsubProducts = onSnapshot(productsRef, (snap) => {
      const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setState(prev => ({ ...prev, products }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const { start, end } = getDateRange(state.filterDate);
    const ordersQuery = query(
      ordersRef, 
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'desc'), 
      limit(200)
    );

    const unsubOrders = onSnapshot(ordersQuery, (snap) => {
      const orders = snap.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          ...data, 
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now() 
        } as Order;
      });
      setState(prev => ({ ...prev, orders }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

    const unsubCustomers = onSnapshot(customersRef, (snap) => {
      const customers = snap.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          ...data, 
          registeredAt: data.registeredAt instanceof Timestamp ? data.registeredAt.toMillis() : Date.now() 
        } as Customer;
      });
      setState(prev => ({ ...prev, customers }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

    return () => {
      unsubProducts();
      unsubOrders();
      unsubCustomers();
    };
  }, [state.isLoggedIn, state.shopId]);

  // Actions
  const removeUndefined = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => {
      if (newObj[key] === undefined) {
        delete newObj[key];
      }
    });
    return newObj;
  };

  const activateCode = async (code: string) => {
    try {
      const q = query(collection(db, 'activationCodes'), where('code', '==', code));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, message: '無效的開通碼' };
      }

      const codeDoc = snapshot.docs[0];
      const codeData = codeDoc.data();
      
      if (codeData.isUsed) {
        // If used, we find the shop associated with this code ID
        const shopRef = doc(db, 'shops', codeDoc.id);
        const shopSnap = await getDoc(shopRef);
        if (shopSnap.exists()) {
          setState(prev => ({ ...prev, shopId: codeDoc.id, systemStatus: 'login' }));
          return { success: true };
        } else {
          return { success: false, message: '該開通碼已失效或找不到店鋪' };
        }
      }

      setState(prev => ({ ...prev, shopId: codeDoc.id, systemStatus: 'setup' }));
      return { success: true };
    } catch (err) {
      console.error("Activation Error:", err);
      return { success: false, message: '系統錯誤，請稍後再試' };
    }
  };

  const setupShop = async (shopName: string, managerPassword: string, staffPassword: string) => {
    if (!state.shopId) return { success: false, message: '無效的開通資料' };
    try {
      const shopRef = doc(db, 'shops', state.shopId);
      await setDoc(shopRef, {
        name: shopName,
        managerPassword,
        staffPassword,
        theme: state.theme,
        categories: state.categories,
        createdAt: serverTimestamp()
      });

      const codeRef = doc(db, 'activationCodes', state.shopId);
      await updateDoc(codeRef, {
        isUsed: true,
        usedAt: serverTimestamp(),
        storeName: shopName
      });

      const productsRef = collection(db, 'shops', state.shopId, 'products');
      for (const p of DEFAULT_PRODUCTS) {
        const { id, ...data } = p;
        await addDoc(productsRef, data);
      }

      setState(prev => ({ ...prev, systemStatus: 'login' }));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'setup/' + state.shopId);
      return { success: false, message: '店鋪建立失敗' };
    }
  };

  const loginManager = (password: string) => {
    if (password === state.managerPassword) {
      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        role: 'manager',
        staffName: '店長',
        systemStatus: 'dashboard',
        lastLoginTime: Date.now()
      }));
      return { success: true };
    }
    return { success: false, message: '密碼錯誤' };
  };

  const loginStaff = (staffName: string, password: string) => {
    if (password === state.staffPassword) {
      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        role: 'staff',
        staffName,
        systemStatus: 'dashboard',
        lastLoginTime: Date.now()
      }));
      return { success: true };
    }
    return { success: false, message: '密碼錯誤' };
  };

  const logout = () => {
    setState(prev => ({ 
      ...prev, 
      isLoggedIn: false, 
      role: 'none', 
      staffName: '',
      systemStatus: 'login',
      lastLoginTime: 0
    }));
  };

  const resetSystem = () => {
    console.log("Resetting system state...");
    localStorage.removeItem('pos_state_v2');
    setState({
      systemStatus: 'activation',
      shopId: '',
      shopName: '',
      staffName: '',
      role: 'none',
      isLoggedIn: false,
      lastLoginTime: 0,
      theme: 'warm-retro',
      currentView: 'order',
      filterDate: new Date().toISOString().split('T')[0],
      products: [],
      orders: [],
      customers: [],
      categories: ['飲品', '特調', '指名服務'],
      staffList: [],
    });
    // Force reload to ensure a clean state if needed, though state update should suffice
    // window.location.reload(); 
  };

  const updatePasswords = async (managerPassword?: string, staffPassword?: string, hourlyWage?: number) => {
    if (!state.shopId) return;
    try {
      const shopRef = doc(db, 'shops', state.shopId);
      await updateDoc(shopRef, {
        ...(managerPassword ? { managerPassword } : {}),
        ...(staffPassword ? { staffPassword } : {}),
        ...(hourlyWage !== undefined ? { hourlyWage } : {})
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'shops/' + state.shopId);
    }
  };

  const setTheme = async (theme: Theme) => {
    setState(prev => ({ ...prev, theme }));
    if (state.shopId && state.isLoggedIn && state.role === 'manager') {
      try {
        await updateDoc(doc(db, 'shops', state.shopId), { theme });
      } catch (e) {}
    }
  };

  const setFontSize = async (fontSize: any) => {
    setState(prev => ({ ...prev, fontSize }));
    if (state.shopId && state.isLoggedIn && state.role === 'manager') {
      try {
        await updateDoc(doc(db, 'shops', state.shopId), { fontSize });
      } catch (e) {}
    }
  };

  const setView = (view: POSState['currentView']) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const setFilterDate = (date: string) => {
    setState(prev => ({ ...prev, filterDate: date }));
  };

  const addProduct = async (p: Omit<Product, 'id'>) => {
    if (!state.shopId) return;
    try {
      const productsRef = collection(db, 'shops', state.shopId, 'products');
      const data = removeUndefined(p);
      await addDoc(productsRef, data);
      // Update local categories
      const shopRef = doc(db, 'shops', state.shopId);
      await updateDoc(shopRef, {
        categories: Array.from(new Set([...state.categories, p.category]))
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const updateProduct = async (p: Product) => {
    if (!state.shopId) return;
    try {
      const { id, ...data } = p;
      const productRef = doc(db, 'shops', state.shopId, 'products', id);
      const sanitized = removeUndefined(data);
      await setDoc(productRef, sanitized);
      
      const shopRef = doc(db, 'shops', state.shopId);
      await updateDoc(shopRef, {
        categories: Array.from(new Set([...state.categories, p.category]))
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'products/' + p.id);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!state.shopId) return;
    try {
      const productRef = doc(db, 'shops', state.shopId, 'products', id);
      await deleteDoc(productRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'products/' + id);
    }
  };

  const bulkAddProducts = async (products: Omit<Product, 'id'>[]) => {
    if (!state.shopId || products.length === 0) return;
    try {
      const batch = writeBatch(db);
      const productsRef = collection(db, 'shops', state.shopId, 'products');
      const newCategories = new Set(state.categories);

      products.forEach(p => {
        const docRef = doc(productsRef);
        const data = removeUndefined(p);
        batch.set(docRef, data);
        if (p.category) newCategories.add(p.category);
      });

      await batch.commit();

      // Update shop categories if needed
      const shopRef = doc(db, 'shops', state.shopId);
      await updateDoc(shopRef, {
        categories: Array.from(newCategories)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bulk_products');
    }
  };

  const linkExistingShop = async (shopName: string) => {
    const trimmedName = shopName.trim();
    if (!trimmedName) return false;

    try {
      // Search shops by name
      const q = query(collection(db, 'shops'), where('name', '==', trimmedName), limit(1));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        const shopDoc = querySnap.docs[0];
        const data = shopDoc.data();
        const shopId = shopDoc.id;
        
        // Prepare persistent state
        const persistData = { 
          systemStatus: 'login',
          shopId: shopId,
          shopName: data.name || trimmedName,
          theme: data.theme || 'warm-retro',
          currentView: 'order',
          filterDate: new Date().toISOString().split('T')[0]
        };
        
        localStorage.setItem('pos_state_v2', JSON.stringify(persistData));
        window.location.reload(); 
        return true;
      }
      return false;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'shops_search_' + trimmedName);
      return false;
    }
  };

  const createOrder = async (items: CartItem[], customerId?: string, isGroup?: boolean, headcount?: number, note?: string, customerName?: string) => {
    if (!state.shopId) return;
    try {
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const ordersRef = collection(db, 'shops', state.shopId, 'orders');
      await addDoc(ordersRef, {
        staffName: state.staffName,
        customerId: customerId || null,
        customerName: customerName || null,
        items,
        total,
        status: 'pending',
        createdAt: serverTimestamp(),
        isGroup: isGroup || false,
        headcount: headcount || 1,
        note: note || '',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    }
  };

  const completeOrder = async (id: string) => {
    if (!state.shopId) return;
    try {
      const orderRef = doc(db, 'shops', state.shopId, 'orders', id);
      await updateDoc(orderRef, { status: 'completed' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'orders/' + id);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!state.shopId) return;
    try {
      const orderRef = doc(db, 'shops', state.shopId, 'orders', id);
      await deleteDoc(orderRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'orders/' + id);
    }
  };

  const updateOrder = async (order: Order) => {
    if (!state.shopId) return;
    try {
      const { id, ...data } = order;
      const orderRef = doc(db, 'shops', state.shopId, 'orders', id);
      // Ensure we don't accidentally update createdAt with a local number if it's already a server timestamp
      delete (data as any).createdAt; 
      const sanitized = removeUndefined(data);
      await updateDoc(orderRef, sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'orders/' + order.id);
    }
  };

  const addCustomer = async (c: Omit<Customer, 'id' | 'registeredAt'>) => {
    if (!state.shopId) return;
    try {
      const customersRef = collection(db, 'shops', state.shopId, 'customers');
      const data = removeUndefined(c);
      await addDoc(customersRef, {
        ...data,
        registeredAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'customers');
    }
  };

  const updateCustomer = async (c: Customer) => {
    if (!state.shopId) return;
    try {
      const { id, ...data } = c;
      const customerRef = doc(db, 'shops', state.shopId, 'customers', id);
      delete (data as any).registeredAt;
      const sanitized = removeUndefined(data);
      await updateDoc(customerRef, sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'customers/' + c.id);
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!state.shopId) return;
    try {
      const customerRef = doc(db, 'shops', state.shopId, 'customers', id);
      await deleteDoc(customerRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'customers/' + id);
    }
  };

  const updateStaffList = async (staffList: string[]) => {
    if (!state.shopId) return;
    try {
      const shopRef = doc(db, 'shops', state.shopId);
      await updateDoc(shopRef, { staffList });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'shops/' + state.shopId);
    }
  };

  const updateDiscordWebhookUrl = async (discordWebhookUrl: string) => {
    if (!state.shopId) return;
    try {
      const shopRef = doc(db, 'shops', state.shopId);
      await updateDoc(shopRef, { discordWebhookUrl });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'shops/' + state.shopId);
      throw err;
    }
  };

  const updateAnnouncement = async (announcement: string) => {
    if (!state.shopId) return;
    try {
      const shopRef = doc(db, 'shops', state.shopId);
      await updateDoc(shopRef, { announcement });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'shops/' + state.shopId);
      throw err;
    }
  };

  return (
    <PosContext.Provider value={{ 
      state, 
      activateCode,
      setupShop,
      loginManager,
      loginStaff,
      logout,
      updatePasswords,
      setTheme, 
      setFontSize,
      setView, 
      setFilterDate,
      updateAnnouncement,
      resetSystem,
      addProduct, 
      updateProduct, 
      deleteProduct,
      bulkAddProducts,
      linkExistingShop,
      createOrder,
      completeOrder,
      deleteOrder,
      updateOrder,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      updateStaffList,
      updateDiscordWebhookUrl
    }}>
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
};
