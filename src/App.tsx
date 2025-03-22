import { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Calendar, House, List, Table2, Users, Shield, Trophy, Brackets, LogOut, Menu, X } from 'lucide-react';
import { Button } from "./components/ui/button";
import DashboardPage from "./pages/DashboardPage";
import TeamsPage from "./pages/TeamsPage";
import SchedulePage from "./pages/SchedulePage";
import ResultsPage from "./pages/ResultsPage";
import StandingsPage from "./pages/StandingsPage";
import CardsAndBans from "./pages/CardsAndBans";
import AwardsPage from "./pages/AwardsPage";
import KnockoutPage from "./pages/KnockoutPage";
import LoginPage from "./pages/LoginPage";
import { Toaster } from "./components/ui/toaster";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useToast } from "./components/ui/use-toast";
import "./index.css";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const location = useLocation();
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Simulate app loading
    setTimeout(() => {
      setIsAppLoaded(true);
    }, 1500);
  }, []);

  // Add pull-to-refresh functionality
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    const threshold = 150;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        if (diff > 0 && diff < threshold && !isRefreshing) {
          const progress = (diff / threshold) * 100;
          document.documentElement.style.setProperty('--pull-down-progress', `${progress}%`);
        }
      }
    };

    const handleTouchEnd = () => {
      const diff = currentY - startY;
      if (diff > threshold && !isRefreshing && window.scrollY === 0) {
        setIsRefreshing(true);
        // Simulate refresh
        setTimeout(() => {
          setIsRefreshing(false);
          document.documentElement.style.setProperty('--pull-down-progress', '0%');
          window.location.reload();
        }, 1500);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout Berhasil 👋",
        description: "Sampai jumpa kembali!",
      });
    } catch (error) {
      toast({
        title: "Logout Gagal",
        description: "Terjadi kesalahan saat logout",
        variant: "destructive",
      });
    }
  };

  if (!isAppLoaded) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="w-16 sm:w-24 h-16 sm:h-24 mb-4 relative">
          <div className="absolute inset-0 border-4 border-primary/30 rounded-full border-t-primary animate-spin [animation-duration:1.5s]"></div>
          <div className="absolute inset-4 border-4 border-accent/30 rounded-full border-b-accent animate-spin [animation-duration:2s]"></div>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary animate-pulse">Karta Cup V</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">Memuat aplikasi...</p>
      </div>
    );
  }

  // Jika di halaman login, tampilkan hanya halaman login
  if (location.pathname === "/login") {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 w-full h-1 bg-primary/20">
          <div className="h-full bg-primary animate-[loading_1s_ease-in-out_infinite]"></div>
        </div>
      )}

      {/* Header with Navigation */}
      <header className="bg-primary sticky top-0 z-10 shadow-md transition-all duration-300">
        <div className="container mx-auto py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-primary-foreground hidden md:block">Karta Cup V</h1>
            </div>

            {/* Top Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <NavButton
                to="/"
                icon={<House className="h-4 w-4" />}
                label="Beranda"
                isActive={location.pathname === '/'}
              />
              <NavButton
                to="/teams"
                icon={<Users className="h-4 w-4" />}
                label="Tim & Pemain"
                isActive={location.pathname === '/teams'}
              />
              <NavButton
                to="/schedule"
                icon={<Calendar className="h-4 w-4" />}
                label="Jadwal"
                isActive={location.pathname === '/schedule'}
              />
              <NavButton
                to="/results"
                icon={<List className="h-4 w-4" />}
                label="Input Hasil"
                isActive={location.pathname === '/results'}
              />
              <NavButton
                to="/standings"
                icon={<Table2 className="h-4 w-4" />}
                label="Klasemen"
                isActive={location.pathname === '/standings'}
              />
              <NavButton
                to="/knockout"
                icon={<Brackets className="h-4 w-4" />}
                label="Babak Knockout"
                isActive={location.pathname === '/knockout'}
              />
              <NavButton
                to="/cards"
                icon={<Shield className="h-4 w-4" />}
                label="Kartu & Sanksi"
                isActive={location.pathname === '/cards'}
              />
              <NavButton
                to="/awards"
                icon={<Trophy className="h-4 w-4" />}
                label="Penghargaan"
                isActive={location.pathname === '/awards'}
              />
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-primary-foreground/80 px-3 h-8 ml-2"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </Button>
              )}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-primary-foreground/10 bg-primary">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-2">
              {/* Title for mobile */}
              <h1 className="text-lg font-semibold text-primary-foreground">Menu Karta Cup V</h1>
              {/* Hamburger Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center p-2 rounded-md hover:bg-primary-foreground/10 relative z-50"
              >
                <div className="relative w-6 h-6">
                  <div className={`absolute inset-0 transform transition-transform duration-300 ${
                    isMobileMenuOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'
                  }`}>
                    <Menu className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className={`absolute inset-0 transform transition-transform duration-300 ${
                    isMobileMenuOpen ? 'rotate-0 opacity-100' : '-rotate-180 opacity-0'
                  }`}>
                    <X className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
              </button>
            </div>

            {/* Backdrop with improved transition */}
            <div 
              className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300 ${
                isMobileMenuOpen ? 'opacity-100 pointer-events-auto z-40' : 'opacity-0 pointer-events-none -z-10'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Dropdown Menu with hardware acceleration */}
            <div 
              className={`fixed left-0 right-0 transition-all duration-300 ease-out ${
                isMobileMenuOpen 
                  ? 'opacity-100 pointer-events-auto z-50' 
                  : 'opacity-0 pointer-events-none -z-10'
              }`}
              style={{
                willChange: 'transform, opacity, max-height',
                backfaceVisibility: 'hidden',
                top: 'var(--header-height, 4rem)'
              }}
            >
              <div className="container mx-auto px-4">
                <div className="py-2 space-y-1 bg-primary shadow-lg rounded-b-lg">
                  <NavButton
                    to="/"
                    icon={<House size={18} />}
                    label="Beranda"
                    isActive={location.pathname === "/"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavButton
                    to="/teams"
                    icon={<Users size={18} />}
                    label="Tim & Pemain"
                    isActive={location.pathname === "/teams"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavButton
                    to="/schedule"
                    icon={<Calendar size={18} />}
                    label="Jadwal"
                    isActive={location.pathname === "/schedule"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavButton
                    to="/results"
                    icon={<List size={18} />}
                    label="Input Hasil"
                    isActive={location.pathname === "/results"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavButton
                    to="/standings"
                    icon={<Table2 size={18} />}
                    label="Klasemen"
                    isActive={location.pathname === "/standings"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavButton
                    to="/knockout"
                    icon={<Brackets size={18} />}
                    label="Babak Knockout"
                    isActive={location.pathname === "/knockout"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavButton
                    to="/cards"
                    icon={<Shield size={18} />}
                    label="Kartu & Sanksi"
                    isActive={location.pathname === "/cards"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavButton
                    to="/awards"
                    icon={<Trophy size={18} />}
                    label="Penghargaan"
                    isActive={location.pathname === "/awards"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  {user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-primary-foreground/80 px-3 h-9 hover:bg-primary-foreground/10"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Keluar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Page Transitions */}
      <main className="flex-1 container mx-auto py-6 px-4 transition-all duration-300 ease-in-out">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="page-transition">
                <DashboardPage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <div className="page-transition">
                <TeamsPage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <div className="page-transition">
                <SchedulePage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <div className="page-transition">
                <ResultsPage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/standings"
            element={
              <ProtectedRoute>
                <div className="page-transition">
                <StandingsPage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/knockout"
            element={
              <ProtectedRoute>
                <div className="page-transition">
                <KnockoutPage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cards"
            element={
              <ProtectedRoute>
                <div className="page-transition">
                <CardsAndBans />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/awards"
            element={
              <ProtectedRoute>
                <div className="page-transition">
                <AwardsPage />
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      
      {/* Toast notifications with improved mobile styling */}
      <Toaster />

      <style>
        {`
          .page-transition {
            animation: fadeIn 0.3s ease-in-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes loading {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
          }
        `}
      </style>
    </div>
  );
}

type NavButtonProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  isMobile?: boolean;
};

function NavButton({ to, icon, label, isActive, onClick, isMobile }: NavButtonProps) {
  return (
    <Link to={to} className="flex flex-col items-center w-full" onClick={onClick}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className={`
          ${isActive ? "text-secondary-foreground" : "text-primary-foreground/80"} 
          w-full justify-start px-3 h-9
          ${isMobile && isActive ? "bg-primary-foreground/10 font-medium" : ""}
          ${isMobile ? "hover:bg-primary-foreground/10" : ""}
        `}
      >
        <span className="flex items-center">
          {icon}
          <span className="ml-2">{label}</span>
          {isMobile && isActive && (
            <div className="ml-auto">
              <div className="h-2 w-2 rounded-full bg-primary-foreground"></div>
            </div>
          )}
        </span>
      </Button>
    </Link>
  );
}

export default App;
