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
  
  const navItems = [
    { name: "홈", path: "/" },
    { name: "매물", path: "/properties" },
    { name: "부동산뉴스", path: "/news" },
    { name: "회사소개", path: "/about" },
    { name: "문의", path: "/contact" },
  ];
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-md fixed w-full z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Building className="text-primary text-3xl mr-2" />
            <span className="text-2xl font-bold text-primary">이가이버부동산</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`font-medium hover:text-primary transition-colors ${
                  location === item.path ? "text-primary" : "text-neutral-800"
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
                    <span className="font-medium">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setLocation("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>내 프로필</span>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>관리자 패널</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" onClick={() => setLocation("/auth")}>
                <LogIn className="mr-2 h-4 w-4" />
                로그인
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden p-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    className={`text-lg font-medium hover:text-primary transition-colors ${
                      location === item.path ? "text-primary" : "text-neutral-800"
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
                        <span>{user.username}</span>
                        {user.role === "admin" && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                            관리자
                          </span>
                        )}
                      </div>
                      
                      <Link 
                        href="/profile" 
                        className="flex items-center py-2 text-lg font-medium text-neutral-800 hover:text-primary"
                      >
                        <User className="mr-2 h-5 w-5" />
                        내 프로필
                      </Link>
                      
                      {user.role === "admin" && (
                        <Link 
                          href="/admin" 
                          className="flex items-center py-2 text-lg font-medium text-neutral-800 hover:text-primary"
                        >
                          <Settings className="mr-2 h-5 w-5" />
                          관리자 패널
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center py-2 text-lg font-medium text-neutral-800 hover:text-primary"
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/auth"
                      className="flex items-center py-2 text-lg font-medium text-neutral-800 hover:text-primary"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      로그인 / 회원가입
                    </Link>
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
