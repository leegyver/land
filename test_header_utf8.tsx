import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Building, LogIn, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "??, path: "/" },
    { name: "紐⑤뱺留ㅻЪ蹂닿린", path: "/properties" },
    { name: "媛뺥솕?꾨돱??, path: "/news" },
    { name: "遺?숈궛?뚭컻", path: "/about" },
    { name: "?좏뒠釉?, path: "/youtube" },
    { name: "?섏쓽遺?숈궛 ?ъ＜", path: "/saju" },
    { name: "臾몄쓽?섍린", path: "/contact" },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 w-full z-50 border-b border-slate-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Building className="text-blue-600 text-3xl mr-2" />
            <span className="text-lg md:text-2xl font-bold text-slate-900">媛뺥솕?꾨??숈궛-?닿??대쾭</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`font-medium hover:text-primary transition-colors ${location === item.path ? "text-primary" : "text-neutral-800"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User size={18} />
                    <span className="font-medium">
                      {user.username}
                      {user.provider && (
                        <span className="ml-1 text-xs text-slate-400">
                          ({user.provider === 'naver' ? '?ㅼ씠踰? : user.provider === 'kakao' ? '移댁뭅?? : user.provider})
                        </span>
                      )}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>??怨꾩젙</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>???꾨줈??/span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>愿由ъ옄 ?⑤꼸</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>濡쒓렇?꾩썐</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" asChild>
                <Link href="/auth" className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  濡쒓렇??                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="default" className="md:hidden px-3 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-md animate-pulse">
                紐⑤뱺硫붾돱蹂닿린
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg font-medium hover:text-primary transition-colors ${location === item.path ? "text-primary" : "text-neutral-800"
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Auth Items (Mobile) */}
                <div className="pt-4 border-t">
                  {user ? (
                    <>
                      <div className="flex items-center mb-4 text-primary font-medium">
                        <User size={18} className="mr-2" />
                        <span>
                          {user.username}
                          {user.provider && (
                            <span className="ml-1 text-xs text-indigo-400">
                              ({user.provider === 'naver' ? '?ㅼ씠踰? : user.provider === 'kakao' ? '移댁뭅?? : user.provider})
                            </span>
                          )}
                        </span>
                        {user.role === "admin" && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                            愿由ъ옄
                          </span>
                        )}
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center py-2 text-lg font-medium text-neutral-800 hover:text-primary"
                      >
                        <User className="mr-2 h-5 w-5" />
                        ???꾨줈??                      </Link>

                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center py-2 text-lg font-medium text-neutral-800 hover:text-primary"
                        >
                          <Settings className="mr-2 h-5 w-5" />
                          愿由ъ옄 ?⑤꼸
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center py-2 text-lg font-medium text-neutral-800 hover:text-primary"
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        濡쒓렇?꾩썐
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center py-2 text-lg font-medium text-neutral-800 hover:text-primary"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      濡쒓렇??/ ?뚯썝媛??                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
