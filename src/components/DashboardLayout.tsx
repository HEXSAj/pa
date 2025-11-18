// src/components/DashboardLayout.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  Users, 
  ClipboardList, 
  Package, 
  LogOut, 
  Menu, 
  Bell, 
  ShoppingCart, 
  BarChart2,
  Calculator,
  HeartPulse,
  ChevronDown,
  X,
  ChevronRight,
  UserCircle2,
  Truck,
  Clock,
  Settings,
  Search,
  HelpCircle,
  Receipt,
  AlertTriangle,
  UserCog,
  UserCheck,
  PackageCheck,
  CreditCard,
  Microscope,
  FlaskRound,
  Stethoscope,
  CalendarClock,
  ArrowRight,
  FileText,
  RotateCcw,
  Maximize,
  Minimize
} from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import LoadingOverlay from './LoadingOverlay';
import AutoCashierSessionPrompt from './AutoCashierSessionPrompt';
import CashierSessionWarningBanner from './CashierSessionWarningBanner';
import { usePageLoad } from '@/hooks/usePageLoad';
import { useAutoCashierSession } from '@/hooks/useAutoCashierSession';
import { usePathname, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, hasAccess, logout } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pathname = usePathname();
  const isPageLoaded = usePageLoad();
  
  // Auto cashier session hook for staff and admin users
  const {
    showCashierPrompt,
    showWarningBanner,
    promptCashierSession,
    skipCashierSession,
    dismissWarningBanner,
    startCashierSession,
    closeCashierPrompt
  } = useAutoCashierSession();
  
  // Add ref for sidebar navigation container
  const sidebarNavRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  
  // Handle logout with redirect to root
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Signing out...');
      
      await logout(); // Use the context logout function which handles auto clock-out
      window.location.href = '/'; // Redirect to root path
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoading(false);
    }
  };

  // Flatten menu items for search
  const flattenMenuItems = (items: any[]): any[] => {
    const flattened: any[] = [];
    
    items.forEach(item => {
      if (item.href) {
        // Main menu item with direct link
        flattened.push({
          href: item.href,
          label: item.label,
          icon: item.icon,
          color: item.color,
          type: 'main'
        });
      }
      
      if (item.submenu) {
        // Add submenu items
        item.submenu.forEach((subItem: any) => {
          flattened.push({
            href: subItem.href,
            label: subItem.label,
            icon: item.icon,
            color: item.color,
            parentLabel: item.label,
            type: 'submenu'
          });
        });
      }
    });
    
    return flattened;
  };

  // Search functionality
  const handleSearch = (value: string) => {
    setSearchValue(value);
    
    if (value.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSelectedResultIndex(-1);
      return;
    }

    // Show loading state for search
    setIsLoading(true);
    setLoadingMessage('Searching...');

    // Simulate search delay for better UX
    setTimeout(() => {
      const flattenedItems = flattenMenuItems(filteredMenuItems);
      const filtered = flattenedItems.filter(item => 
        item.label.toLowerCase().includes(value.toLowerCase()) ||
        (item.parentLabel && item.parentLabel.toLowerCase().includes(value.toLowerCase()))
      );

      console.log('Search results:', filtered); // Debug log
      setSearchResults(filtered);
      setShowSearchResults(filtered.length > 0);
      setSelectedResultIndex(-1);
      setIsLoading(false);
    }, 100);
  };

  // Navigation handler with loading state
  const handleNavigation = (href: string, label?: string) => {
    // Prevent multiple rapid clicks
    if (isLoading) return;
    
    console.log('=== NAVIGATION STARTED ===');
    console.log('Navigating to:', href);
    
    // Show loading state immediately
    setIsLoading(true);
    setLoadingMessage(label ? `Loading ${label}...` : 'Loading...');
    
    // Use Next.js router for fast client-side navigation
    router.push(href);
    
    // Fallback: hide loading after maximum 3 seconds
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 3000);
  };

  // Handle search result selection - SIMPLE AND DIRECT
  const handleSearchResultClick = (href: string, label?: string) => {
    handleNavigation(href, label);
  };

  // Handle keyboard navigation in search results
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedResultIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedResultIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
          const selectedResult = searchResults[selectedResultIndex];
          console.log('Enter key pressed, navigating to:', selectedResult.href);
          setSearchValue('');
          setSearchResults([]);
          setShowSearchResults(false);
          setSelectedResultIndex(-1);
          handleNavigation(selectedResult.href, selectedResult.label);
        }
        break;
      case 'Escape':
        setShowSearchResults(false);
        setSelectedResultIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  useEffect(() => {
    setIsMounted(true);
    
    // If user tries to access a page they don't have permission for, redirect them
    if (user && pathname && !hasAccess(pathname)) {
      // Redirect to POS for staff or dashboard for admin
      router.push(userRole === 'admin' ? '/dashboard' : '/dashboard/pos');
    }
  }, [pathname, user, userRole, hasAccess, router]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Helper function to check if fullscreen is active
  const isFullscreenActive = (): boolean => {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  };

  // Fullscreen functions
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreenActive()) {
        // Enter fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(isFullscreenActive());
    };

    // Check initial fullscreen state
    setIsFullscreen(isFullscreenActive());

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Handle loading state based on page load status
  useEffect(() => {
    if (isLoading && isPageLoaded) {
      // Hide loading when page is actually loaded
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isPageLoaded]);

  // Handle clicking outside search results to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
        setSelectedResultIndex(-1);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);


  useEffect(() => {
    if (!isMounted) return;
  
    // Find which menu item is active and expand its parent if needed
    const findActiveMenu = () => {
      for (const item of filteredMenuItems) {
        if (item.submenu) {
          const activeSubItem = item.submenu.find((subItem: any) => pathname === subItem.href);
          if (activeSubItem) {
            // Expand the parent menu if not already expanded
            if (!expandedMenus.includes(item.label)) {
              setExpandedMenus(prev => [...prev, item.label]);
              
              // Scroll after menu expansion with longer delay
              setTimeout(() => {
                scrollToActiveItem();
              }, 400);
            } else {
              // Menu already expanded, just scroll
              setTimeout(() => {
                scrollToActiveItem();
              }, 100);
            }
            return;
          }
        } else if (item.href === pathname) {
          // Scroll to active main menu item
          setTimeout(() => {
            scrollToActiveItem();
          }, 100);
          return;
        }
      }
    };
  
    findActiveMenu();
  }, [pathname, isMounted, expandedMenus]);



  const scrollToActiveItem = () => {
    if (!sidebarNavRef.current) return;
  
    // Find the active menu item in the DOM - check for both main menu and submenu active states
    const activeMainItem = sidebarNavRef.current.querySelector('.bg-gradient-to-r.from-blue-50');
    const activeSubItem = sidebarNavRef.current.querySelector('.bg-blue-100');
    
    // Prioritize submenu item if it exists, otherwise use main menu item
    const activeItem = activeSubItem || activeMainItem;
    
    if (activeItem) {
      const container = sidebarNavRef.current;
      
      // Get the position relative to the container using getBoundingClientRect
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      
      // Calculate the relative position within the scrollable container
      const currentScrollTop = container.scrollTop;
      const itemRelativeTop = itemRect.top - containerRect.top + currentScrollTop;
      const itemHeight = itemRect.height;
      const containerHeight = container.clientHeight;
      
      // Center the active item in the visible area
      const scrollTop = itemRelativeTop - (containerHeight / 2) + (itemHeight / 2);
      
      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      });
    }
  };


  if (!isMounted) {
    return null;
  }

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-violet-500 to-purple-500' },
    {
      label: 'Pharmacy-Inventory',
      icon: Pill,
      color: 'from-emerald-500 to-green-500',
      submenu: [
        { href: '/dashboard/inventory', label: 'Medicines' },
        { href: '/dashboard/inventory/low-stock', label: 'Low Stock Report' },
        { href: '/dashboard/inventory/expiry', label: 'Expiry Date Report' },
        { href: '/dashboard/inventory/adjustments', label: 'Stock Adjustments' },
      ]
    },
    {
      label: 'Pharmacy - Purchasing and Suppliers',
      icon: Truck,
      color: 'from-orange-400 to-amber-500',
      submenu: [
        { href: '/dashboard/suppliers', label: 'All Suppliers' },
        { href: '/dashboard/purchases', label: 'Purchase Orders' },
        { href: '/dashboard/returns', label: 'Returns' },
        { href: '/dashboard/suppliers/low-stock-report', label: 'Low Stock Report' },
      ]
    },
    { href: '/dashboard/doctors', label: 'Channelling Doctor Management', icon: UserCog, color: 'from-rose-500 to-pink-500' },
    {href: '/dashboard/appointments',label: 'Channelling Appointments',icon: CalendarClock,color: 'from-indigo-400 to-violet-500'},
    { href: '/dashboard/pos', label: 'Reception - POS', icon: ShoppingCart, color: 'from-rose-500 to-pink-500' },
    { href: '/dashboard/pharmacyPOS', label: 'Pharmacy POS', icon: Pill, color: 'from-emerald-500 to-teal-500' },
    { href: '/dashboard/due-collect', label: 'Due Collection', icon: CreditCard, color: 'from-orange-500 to-red-500' },
    { href: '/dashboard/procedures', label: 'OPD - Procedure Management', icon: Stethoscope, color: 'from-indigo-500 to-fuchsia-500' },
    { href: '/dashboard/expences', label: 'Expenses Summary', icon: Calculator, color: 'from-yellow-400 to-amber-500' },
    { href: '/dashboard/labs', label: 'Lab - Names', icon: Microscope, color: 'from-sky-500 to-blue-600' },
    { href: '/dashboard/lab-tests', label: 'Lab - Tests', icon: FlaskRound, color: 'from-teal-400 to-cyan-500' },
    { href: '/dashboard/attendance', label: 'Attendance', icon: UserCheck, color: 'from-violet-500 to-purple-500' },
    { href: '/dashboard/my-sessions', label: 'My Sessions', icon: Stethoscope, color: 'from-emerald-400 to-green-500' },
    { href: '/dashboard/prescriptions', label: 'Prescriptions', icon: FileText, color: 'from-teal-500 to-cyan-600' },
    { href: '/dashboard/patients', label: 'Patients', icon: Users, color: 'from-blue-500 to-indigo-600' },
    {
      label: 'Referral Letters',
      icon: FileText,
      color: 'from-green-500 to-teal-600',
      submenu: [
        { href: '/dashboard/referral-letters', label: 'Referral Letters' },
        { href: '/dashboard/referral-doctors', label: 'Referral Doctors' },
      ]
    },
    // {
    //   label: 'Patients',
    //   icon: Users,
    //   color: 'from-blue-500 to-indigo-600',
    //   submenu: [
    //     { href: '/dashboard/patients', label: 'Patients Management' },
    //     // { href: '/dashboard/loyalty-points', label: 'Loyalty Points' },
    //   ]
    // },
    {
      label: 'Reports',
      icon: BarChart2,
      color: 'from-sky-500 to-blue-500',
      submenu: [
        { href: '/dashboard/viewSales', label: 'Inventory View Sales' },
        { href: '/dashboard/reports', label: 'Final Report' },
        // { href: '/dashboard/quotations', label: 'Quotations' },
        { href: '/dashboard/appoinmentsRport', label: 'AppoinmentsReport' },
        { href: '/dashboard/lab-tests-reports', label: 'Lab Tests Reports' },
        { href: '/dashboard/proceduresReports', label: 'Procedures Reports' },
        // { href: '/dashboard/consultationFeeReports', label: 'Consultation Fee Reports' },
      ]
    },
    {
      label: 'User Management',
      icon: UserCog,
      color: 'from-gray-500 to-gray-600',
      submenu: [
        { href: '/dashboard/user', label: 'User Management' },
        { href: '/dashboard/salary', label: 'Salary Management' },
      ]
    },
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => {
    const itemPath = item.href || '';
    // Check main item
    if (item.href && !hasAccess(item.href)) {
      return false;
    }
    
    // Check submenu items
    if (item.submenu) {
      const hasAccessibleSubmenuItems = item.submenu.some(subItem => hasAccess(subItem.href));
      return hasAccessibleSubmenuItems;
    }
    
    return true;
  }).map(item => {
    // Also filter submenu items if present
    if (item.submenu) {
      return {
        ...item,
        submenu: item.submenu.filter(subItem => hasAccess(subItem.href))
      };
    }
    return item;
  });

  const isMenuActive = (item: any): boolean => {
    if (item.href) {
      return pathname === item.href;
    }
    if (item.submenu) {
      return item.submenu.some((subItem: any) => pathname === subItem.href);
    }
    return false;
  };

  const renderMenuItem = (item: any, index: number) => {
    if (!item.icon) {
      return null;
    }
    
    const Icon = item.icon;
    const isExpanded = expandedMenus.includes(item.label);
    const isActive = isMenuActive(item);
    const hasActiveChild = item.submenu?.some((subItem: any) => pathname === subItem.href);
    
    // Get the gradient background for the icon
    const gradientBg = item.color || 'from-blue-500 to-indigo-600';

    if (item.submenu) {
      return (
        <div key={`${item.label}-${index}`} className="relative">
          <button
            onClick={() => toggleSubmenu(item.label)}
            className={`flex items-center rounded-xl px-4 py-3 transition-all duration-200 w-full group
              ${hasActiveChild || isExpanded 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-slate-700 hover:bg-slate-100'}
              ${!isSidebarOpen ? 'justify-center' : 'space-x-3'}`}
          >
            <div className={`relative rounded-xl p-2.5 bg-gradient-to-br ${gradientBg} flex-shrink-0 shadow-md transition-all duration-200 ${!hasActiveChild && !isExpanded && 'group-hover:shadow-lg group-hover:scale-105'}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            
            {isSidebarOpen && (
              <>
                <span className={`flex-1 text-sm transition-all duration-200 
                  ${hasActiveChild || isExpanded ? 'font-semibold text-blue-700' : 'font-medium text-slate-700 group-hover:text-slate-900'}`}>
                  {item.label}
                </span>
                <ChevronRight
                  className={`h-4 w-4 transition-all duration-200 ${
                    isExpanded ? 'rotate-90 text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
              </>
            )}
          </button>
          
          {isExpanded && isSidebarOpen && (
            <div className="ml-14 mt-1.5 space-y-0.5 mb-2">
              {item.submenu.map((subItem: any, subIndex: number) => (
                <button
                  key={`${subItem.href}-${subIndex}`}
                  onClick={() => handleNavigation(subItem.href, subItem.label)}
                  className={`flex items-center rounded-lg px-4 py-2.5 text-sm transition-all duration-200 w-full text-left group relative
                    ${pathname === subItem.href
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mr-3 transition-all duration-200 ${
                    pathname === subItem.href ? 'bg-blue-600' : 'bg-slate-300 group-hover:bg-slate-400'
                  }`}></div>
                  {subItem.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={`${item.href}-${index}`}
        onClick={() => handleNavigation(item.href, item.label)}
        className={`flex items-center rounded-xl px-4 py-3 transition-all duration-200 w-full text-left group
          ${isActive 
            ? 'bg-blue-50 text-blue-700 shadow-sm' 
            : 'text-slate-700 hover:bg-slate-100'}
          ${!isSidebarOpen ? 'justify-center' : 'space-x-3'}`}
      >
        <div className={`relative rounded-xl p-2.5 bg-gradient-to-br ${gradientBg} flex-shrink-0 shadow-md transition-all duration-200 ${!isActive && 'group-hover:shadow-lg group-hover:scale-105'}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        
        <span className={`text-sm transition-all duration-200 ${!isSidebarOpen && 'md:hidden'}
          ${isActive ? 'font-semibold text-blue-700' : 'font-medium text-slate-700 group-hover:text-slate-900'}`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
      
      {/* Cashier Session Warning Banner - Top Level */}
      {showWarningBanner && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <CashierSessionWarningBanner
            onStartSession={promptCashierSession}
            onDismiss={dismissWarningBanner}
          />
        </div>
      )}
      
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 overflow-hidden">
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/20 transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
        ${isSidebarOpen ? 'w-80' : 'w-20'}
      `}>
        {/* Sidebar header */}
        <div className={`flex h-20 items-center justify-between px-6 border-b border-slate-200/50 ${!isSidebarOpen && 'px-4'}`}>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center">
              <Image 
                src="/logo.png"
                alt="Pearls Family Care Logo"
                width={isSidebarOpen ? 50 : 40}
                height={isSidebarOpen ? 50 : 40}
                className="transition-all duration-300"
              />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-slate-800">
                  Pearls Family Care
                </h1>
                <p className="text-xs text-slate-600 font-medium">Management System</p>
              </div>
            )}
          </div>
          <button 
            className="md:hidden rounded-xl p-2 hover:bg-slate-100 transition-colors duration-200" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>
        
        {/* Sidebar navigation */}
        <nav 
          ref={sidebarNavRef}
          className="flex-1 space-y-1.5 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
        >
          {filteredMenuItems.filter(item => !!item.icon).map(renderMenuItem)}
        </nav>
        
        {/* User role indicator */}
        {isSidebarOpen && (
          <div className="p-4 mb-4">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl p-4 border border-slate-200/50 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-sm opacity-40"></div>
                  <div className="relative rounded-xl p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                    <UserCircle2 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-600 font-semibold">Logged in as:</span>
                  <p className="font-bold text-slate-900 capitalize text-sm">{userRole}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Developer information */}
        {isSidebarOpen && (
          <div className="px-4 mb-2">
            <div className="text-center bg-slate-50/50 rounded-xl p-3 border border-slate-200/30">
              <p className="text-xs text-slate-600 font-semibold">
                Developed by WebVizard Solutions PVT LTD
              </p>
              <p className="text-xs text-slate-500 font-medium">
                0712654267
              </p>
            </div>
          </div>
        )}
        
        {/* Logout button at bottom */}
        <div className="p-4 border-t border-slate-200/50">
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-2xl px-4 py-3 text-slate-700 transition-all duration-200
              hover:bg-red-50 hover:text-red-600 hover:shadow-md space-x-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative rounded-xl p-2 bg-gradient-to-br from-red-500 to-rose-500 shadow-lg">
                <LogOut className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="font-semibold text-slate-800">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:pl-80' : 'md:pl-20'} ${showWarningBanner ? 'pt-16' : ''}`}>
        {/* Header */}
        <header className={`sticky z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 flex-none shadow-sm`}>
          <div className="flex h-20 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl p-2.5 bg-slate-100 hover:bg-slate-200 md:hidden focus:outline-none transition-colors duration-200"
              >
                <Menu className="h-5 w-5 text-slate-700" />
              </button>
              
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="hidden md:flex rounded-xl p-2.5 bg-slate-100 hover:bg-slate-200 focus:outline-none transition-colors duration-200"
              >
                <Menu className="h-5 w-5 text-slate-700" />
              </button>
              
              <div className="relative max-w-md w-full hidden md:block">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search pages..."
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10 pr-4 py-2.5 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all duration-200"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div 
                    ref={searchResultsRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto"
                  >
                    <div className="p-3">
                      <div className="text-xs text-slate-500 px-3 py-2 border-b border-slate-100 font-medium">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                      </div>
                      {/* Debug test button */}
                      {/* <div 
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔴🔴🔴 TEST BUTTON NAVIGATING 🔴🔴🔴');
                          handleNavigation('/dashboard', 'Dashboard');
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-red-100 text-red-700 cursor-pointer hover:bg-red-200"
                        style={{ cursor: 'pointer', border: '2px solid red' }}
                      >
                        <div className="text-xs font-medium">🧪 TEST: Click to go to Dashboard</div>
                      </div> */}
                      {searchResults.map((result, index) => {
                        const Icon = result.icon;
                        const isSelected = index === selectedResultIndex;
                        
                        return (
                          <div
                            key={`${result.href}-${index}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔴 NAVIGATING:', result.label, result.href);
                              handleNavigation(result.href, result.label);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer
                              ${isSelected 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-slate-700 hover:bg-slate-50'}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className={`rounded-lg p-2 bg-gradient-to-br ${result.color} flex-shrink-0 shadow-md`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {result.label}
                              </div>
                              {result.parentLabel && (
                                <div className="text-xs text-slate-500 truncate font-normal">
                                  {result.parentLabel}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Time Display */}
              <div className="flex items-center h-10 px-4 py-1 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200/50">
                <Clock className="h-4 w-4 text-slate-600 mr-2" />
                <span className="text-sm font-semibold text-slate-700">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour12: true, 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>

              {/* Quick POS Navigation Button */}
              {hasAccess('/dashboard/pos') && (
                <button
                  onClick={() => handleNavigation('/dashboard/pos', 'POS')}
                  className="flex items-center h-10 px-4 py-1 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-2xl transition-all duration-200 border border-emerald-200/50 shadow-sm hover:shadow-md"
                >
                  <ShoppingCart className="h-4 w-4 text-emerald-600 mr-2" />
                  <span className="text-sm font-semibold text-emerald-700">Quick POS</span>
                </button>
              )}

              {/* Fullscreen Toggle Button */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center justify-center h-10 w-10 bg-gradient-to-r from-slate-50 to-blue-50/50 hover:from-slate-100 hover:to-blue-100 rounded-2xl transition-all duration-200 border border-slate-200/50 shadow-sm hover:shadow-md"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4 text-slate-700" />
                ) : (
                  <Maximize className="h-4 w-4 text-slate-700" />
                )}
              </button>
              
              <div className="flex items-center h-10 px-4 py-1 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200/50">
                <div className="mr-2 rounded-full bg-emerald-100 h-6 w-6 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
                <span className="text-sm font-semibold text-slate-700">Online</span>
              </div>
              
              <NotificationsDropdown />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-2xl flex items-center space-x-3 hover:bg-slate-50 transition-all duration-200 p-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-sm opacity-30"></div>
                      <div className="relative h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.email?.[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-slate-800">{user?.displayName || user?.email}</p>
                      <p className="text-xs text-slate-500 capitalize font-medium">{userRole}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 mt-2 rounded-2xl p-3 bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl">
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-xl">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-sm opacity-30"></div>
                      <div className="relative h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.email?.[0].toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{user?.displayName || 'User'}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                      <p className="text-xs font-semibold text-blue-600 capitalize">{userRole} Account</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem className="rounded-xl cursor-pointer hover:bg-slate-50 transition-colors duration-200">
                    <UserCircle2 className="h-4 w-4 mr-3 text-slate-600" />
                    <span className="font-medium">My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl cursor-pointer hover:bg-slate-50 transition-colors duration-200">
                    <Settings className="h-4 w-4 mr-3 text-slate-600" />
                    <span className="font-medium">Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem 
                    className="rounded-xl cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-700 transition-colors duration-200"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span className="font-semibold">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Mobile search bar */}
          <div className="px-4 pb-4 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 pr-4 py-2.5 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all duration-200"
              />
              
              {/* Mobile Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div 
                  ref={searchResultsRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto"
                >
                  <div className="p-3">
                    <div className="text-xs text-slate-500 px-3 py-2 border-b border-slate-100 font-medium">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </div>
                    {/* Debug test button for mobile */}
                    <div 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔴🔴🔴 MOBILE TEST BUTTON NAVIGATING 🔴🔴🔴');
                        handleNavigation('/dashboard', 'Dashboard');
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-red-100 text-red-700 cursor-pointer hover:bg-red-200"
                      style={{ cursor: 'pointer', border: '2px solid red' }}
                    >
                      <div className="text-xs font-medium">🧪 TEST: Click to go to Dashboard</div>
                    </div>
                    {searchResults.map((result, index) => {
                      const Icon = result.icon;
                      const isSelected = index === selectedResultIndex;
                      
                      return (
                        <div
                          key={`${result.href}-${index}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔴 MOBILE NAVIGATING:', result.label, result.href);
                            handleNavigation(result.href, result.label);
                          }}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer
                            ${isSelected 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-slate-700 hover:bg-slate-50'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={`rounded-lg p-2 bg-gradient-to-br ${result.color} flex-shrink-0 shadow-md`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {result.label}
                            </div>
                            {result.parentLabel && (
                              <div className="text-xs text-slate-500 truncate font-normal">
                                {result.parentLabel}
                              </div>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className={`flex-1 relative overflow-y-auto bg-gradient-to-br from-slate-50/30 to-blue-50/20`}>
          <div className="container h-full p-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/20 min-h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      {/* Auto Cashier Session Prompt Modal */}
      <AutoCashierSessionPrompt
        isOpen={showCashierPrompt}
        onClose={closeCashierPrompt}
        onSessionStarted={startCashierSession}
        onSkip={skipCashierSession}
      />
      </div>
    </>
  );
}