import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Building, LogIn, LogOut, User, Settings, Menu, Phone, Home, Search, Gavel, Sparkles, Youtube } from "lucide-react";
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

  // 권한 판별 변수 통합 선언
  const isAdminOrMaster = user?.role === "admin" || user?.role === "master";
  const isEligibleRealtor = user?.role === "realtor" && ["monthly", "yearly", "approved", "lifetime"].includes(user?.subscriptionTier as string);

  const navItems = [
    { name: "홈", path: "/", icon: Home },
    { name: "강화도 매물", path: "/properties", icon: Search },
    { name: "반값 경매·공매", path: "/auctions", isHot: true, icon: Gavel },
    { name: "부동산 토탈케어", path: "/total-care", isNew: true, icon: Sparkles },
    { name: "유튜브", path: "/youtube", icon: Youtube },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 w-full z-50 border-b border-slate-200 pt-safe overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-4 py-1.5 md:py-2 landscape:py-1 max-w-7xl">
        <div className="flex justify-between items-center gap-1 sm:gap-2 min-w-0">
          {/* Logo Section - Compact & beautifully balanced in landscape */}
          <Link href="/" className="flex items-center touch-manipulation shrink-0">
            <Building className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 landscape:w-4.5 landscape:h-4.5 mr-1.5 sm:mr-2 shrink-0" />
            <div className="flex items-center">
              <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl landscape:text-xs sm:landscape:text-sm lg:landscape:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                강화도부동산-이가이버
              </span>
              <span className="hidden xl:inline-block ml-2 text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 whitespace-nowrap">
                법원등록 경매·공매
              </span>
            </div>
          </Link>

          {/* Desktop & Landscape Navigation */}
          <nav className="hidden md:flex items-center space-x-1.5 md:space-x-2.5 lg:space-x-5 xl:space-x-7 landscape:space-x-1.5 lg:landscape:space-x-3.5 shrink-0">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`font-bold text-xs lg:text-sm xl:text-base landscape:text-[11px] lg:landscape:text-sm whitespace-nowrap hover:text-orange-600 transition-colors flex items-center gap-1 lg:gap-1.5 py-1 ${
                  location === item.path ? "text-orange-600 font-black border-b-2 border-orange-500" : "text-neutral-700 hover:text-neutral-900"
                }`}
              >
                <span>{item.name}</span>
                {item.isHot && (
                  <span className="bg-red-500 text-white text-[8px] lg:text-[10px] font-black px-1 lg:px-1.5 py-0.2 rounded-full animate-pulse shadow-sm">
                    HOT
                  </span>
                )}
                {item.isNew && (
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] lg:text-[10px] font-black px-1 lg:px-1.5 py-0.2 rounded-full shadow-sm animate-bounce">
                    NEW
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop & Landscape Quick Call & Auth (Zero overflow) */}
          <div className="hidden md:flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 shrink-0">
            {/* Phone button: Slim icon on mobile landscape/tablet, full pill on wide desktop */}
            <a
              href="tel:010-4787-3120"
              className="flex xl:hidden landscape:flex xl:landscape:hidden w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white items-center justify-center shadow-sm shrink-0 touch-manipulation"
              title="전화상담 010-4787-3120"
            >
              <Phone className="w-3.5 h-3.5 fill-white" />
            </a>
            <a
              href="tel:010-4787-3120"
              className="hidden xl:flex landscape:hidden xl:landscape:flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md shadow-orange-500/20 transition-all shrink-0"
            >
              <Phone className="w-3.5 h-3.5 fill-white" />
              <span>010-4787-3120</span>
            </a>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-1.5 sm:px-2 md:h-8 md:px-2.5 flex items-center gap-1 text-xs shrink-0 font-bold">
                    <User size={14} className="shrink-0" />
                    <span className="max-w-[50px] sm:max-w-[80px] truncate">
                      {user.nickname || user.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>내 프로필</span>
                    </Link>
                  </DropdownMenuItem>
                  {(isAdminOrMaster || isEligibleRealtor) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>{isAdminOrMaster ? "관리자 패널" : "매물 관리"}</span>
                        </Link>
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
              <Button
                variant="default"
                size="sm"
                className="h-7 px-2 sm:h-8 sm:px-3 text-xs font-bold shrink-0 whitespace-nowrap shadow-sm touch-manipulation"
                asChild
              >
                <Link href="/auth" className="flex items-center gap-1">
                  <LogIn className="h-3.5 w-3.5 shrink-0" />
                  <span>로그인</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 p-2 touch-manipulation">
                <Menu className="w-6 h-6 text-slate-900" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto max-h-[100dvh] pt-8 pb-safe pl-safe pr-safe w-[85vw] sm:max-w-md">
              <div className="flex flex-col space-y-4">
                <div className="border-b pb-3 mb-1">
                  <span className="text-sm font-black text-slate-900">이가이버부동산 메뉴</span>
                </div>

                {/* 2-column on landscape for zero vertical overflow */}
                <div className="grid grid-cols-1 landscape:grid-cols-2 gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between transition-all touch-manipulation ${
                          isActive ? "text-orange-600 bg-orange-50 font-black border border-orange-200/80 shadow-sm" : "text-slate-800 hover:text-orange-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                          <span className="whitespace-nowrap">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.isHot && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                              HOT
                            </span>
                          )}
                          {item.isNew && (
                            <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                              NEW
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Mobile Quick Call Button */}
                <div className="pt-1">
                  <a
                    href="tel:010-4787-3120"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black py-2.5 sm:py-3 rounded-xl shadow-md text-sm touch-manipulation"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    <span>전화상담 010-4787-3120</span>
                  </a>
                </div>

                {/* Auth Items (Mobile) */}
                <div className="pt-3 border-t text-sm">
                  {user ? (
                    <div className="grid grid-cols-1 landscape:grid-cols-2 gap-2">
                      <div className="flex items-center py-1 text-primary font-bold">
                        <User size={16} className="mr-1.5 shrink-0" />
                        <span className="truncate">
                          {user.nickname || user.username}
                        </span>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center py-2 px-2.5 rounded-lg font-bold text-neutral-800 hover:bg-slate-50 touch-manipulation"
                      >
                        <User className="mr-2 h-4 w-4" />
                        내 프로필
                      </Link>

                      {(isAdminOrMaster || isEligibleRealtor) && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center py-2 px-2.5 rounded-lg font-bold text-neutral-800 hover:bg-slate-50 touch-manipulation"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          {isAdminOrMaster ? "관리자 패널" : "매물 관리"}
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center py-2 px-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-50 hover:text-red-600 touch-manipulation text-left"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors touch-manipulation"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
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
