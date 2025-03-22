import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/use-toast";
import { Loader2, AlertCircle, Skull, Eye, EyeOff } from "lucide-react";
import { createAdminAccount, loginAdmin, ALLOWED_ADMIN_EMAILS } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Checkbox } from "../components/ui/checkbox";
import "../styles/animations.css";

const LoginPage = () => {
  const [email, setEmail] = useState(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    return savedEmail || "";
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("rememberMe") === "true";
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("rememberedEmail");
      localStorage.removeItem("rememberMe");
    }
  }, [rememberMe, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      try {
        await loginAdmin(email, password);
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        }
        toast({
          title: "AKSES DIBERIKAN! 💀",
          description: "Selamat datang di dunia kegelapan Karta Cup V",
          variant: "default",
        });
        navigate("/");
        return;
      } catch (loginError: any) {
        if (loginError.code !== 'auth/user-not-found') {
          throw loginError;
        }
      }

      if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
        throw new Error("Kau tidak layak menjadi penguasa kegelapan!");
      }

      await createAdminAccount(email, password);
      toast({
        title: "PENGUASA BARU TELAH BANGKIT! 🦇",
        description: "Selamat datang di kerajaan kegelapan Karta Cup V",
        variant: "default",
      });
      navigate("/");
    } catch (error: any) {
      let errorMessage = "Jiwa yang lemah, coba lagi!";
      
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = "Email tidak valid, wahai makhluk fana!";
            break;
          case 'auth/user-disabled':
            errorMessage = "Jiwamu telah dimusnahkan dari kerajaan ini!";
            break;
          case 'auth/wrong-password':
            errorMessage = "Password salah, nyawamu akan melayang!";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Terlalu banyak mencoba, tunggulah dalam kegelapan!";
            break;
          case 'auth/email-already-in-use':
            errorMessage = "Email ini telah dikutuk oleh penguasa lain!";
            break;
          case 'auth/weak-password':
            errorMessage = "Password terlalu lemah untuk mengendalikan kegelapan! (min. 6 karakter)";
            break;
        }
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: "GAGAL! ☠️",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: "linear-gradient(to bottom right, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.7)), url('/images/stadium-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-primary/20 pointer-events-none" />
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo dan Judul */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-900 to-primary p-[3px] animate-pulse">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-primary/20 animate-[spin_10s_linear_infinite]"></div>
              <Skull className="w-12 h-12 text-red-500 animate-[float_3s_ease-in-out_infinite]" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-red-500 via-primary to-red-500 bg-clip-text text-transparent animate-pulse">
              KARTA CUP V
            </h1>
            <p className="text-red-500/80 font-medium tracking-widest text-sm">
              MASUKI PORTAL KARTA CUP V
            </p>
          </div>
        </div>

        {/* Card Login */}
        <div className="bg-black/80 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-red-900/50 p-6 space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-red-500">EMAIL PENGUASA</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@kartacup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black/50 border-red-900 text-red-500 placeholder:text-red-500/50 focus:border-primary focus:ring-primary"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-red-500">MANTRA RAHASIA</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black/50 border-red-900 text-red-500 placeholder:text-red-500/50 focus:border-primary focus:ring-primary pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500/70 hover:text-red-500 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-red-500/70 mt-1">
                Minimal 6 karakter untuk membangkitkan kekuatan
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-red-900 data-[state=checked]:bg-red-900 data-[state=checked]:text-white"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium text-red-500/70 hover:text-red-500 cursor-pointer select-none"
              >
                Ikat Jiwaku di Portal Ini
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-900 to-primary hover:from-red-900/90 hover:to-primary/90 text-red-100 font-bold tracking-wider"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  MEMBANGKITKAN KEKUATAN...
                </div>
              ) : (
                "MASUK KE TURNAMEN"
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-red-500/70">
              Butuh bantuan?{" "}
              <a
                href="https://wa.me/625212340232?text=Halo%20Penguasa%20Turnamen%2C%0A%0ASaya%20membutuhkan%20bantuan%20untuk%3A%0A1.%20Lupa%20password%20akun%20admin%0A2.%20Belum%20memiliki%20akses%20admin%0A3.%20Masalah%20teknis%20lainnya%0A%0AMohon%20bantuan%20Yang%20Mulia%20🙏"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/90 hover:underline"
              >
                Panggil Penguasa
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-red-500/50">
          © 2025 Karta Cup V. All souls reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 