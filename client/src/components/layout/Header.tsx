import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Building, LogIn, LogOut, User, Settings, Menu, Phone } from "lucide-react";
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
    { name: "홈", path: "/" },
    { name: "강화도 매물", path: "/properties" },
    { name: "반값 경매·공매", path: "/auctions", isHot: true },
    { name: "유튜브", path: "/youtube" },
    { name: "왜 이가이버인가", path: "/about" },
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
            <div>
              <span className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">강화도부동산-이가이버</span>
              <span className="hidden xl:inline-block ml-2 text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">법원등록 경매·공매 전문</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`font-semibold text-sm lg:text-base hover:text-primary transition-colors flex items-center gap-1.5 ${location === item.path ? "text-primary font-bold" : "text-neutral-800"
                  }`}
              >
                <span>{item.name}</span>
                {item.isHot && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                    HOT
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Quick Call & Auth */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="tel:010-4787-3120"
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs lg:text-sm font-bold px-3.5 py-2 rounded-full shadow-md shadow-orange-500/20 transition-all transform hover:scale-105"
            >
              <Phone className="w-3.5 h-3.5 fill-white" />
              <span>010-4787-3120</span>
            </a>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User size={18} />
                    <span className="font-medium">
                      {user.nickname || user.username}
                      {user.provider && (
                        <span className="ml-1 text-xs text-slate-400">
                          ({user.provider === 'naver' ? '네이버' : user.provider === 'kakao' ? '카카오' : user.provider})
                        </span>
                      )}
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
              <Button variant="default" asChild>
                <Link href="/auth" className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-6 h-6 text-slate-900" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg font-semibold hover:text-primary transition-colors flex items-center justify-between ${location === item.path ? "text-primary" : "text-neutral-800"
                      }`}
                  >
                    <span>{item.name}</span>
                    {item.isHot && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        HOT
                      </span>
                    )}
                  </Link>
                ))}

                {/* Mobile Quick Call Button */}
                <div className="pt-2">
                  <a
                    href="tel:010-4787-3120"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-xl shadow-md"
                  >
                    <Phone className="w-5 h-5 fill-white" />
                    <span>전화상담 010-4787-3120</span>
                  </a>
                </div>

                {/* Auth Items (Mobile) */}
                <div className="pt-4 border-t">
                  {user ? (
                    <>
                      <div className="flex items-center mb-4 text-primary font-medium">
                        <User size={18} className="mr-2" />
                        <span>
                          {user.nickname || user.username}
                          {user.provider && (
                            <span className="ml-1 text-xs text-indigo-400">
                              ({user.provider === 'naver' ? '네이버' : user.provider === 'kakao' ? '카카오' : user.provider})
                            </span>
                          )}
                        </span>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center py-2 text-lg font-medium text-neutral-800 hover:text-primary"
                      >
                        <User className="mr-2 h-5 w-5" />
                        내 프로필
                      </Link>

                      {(isAdminOrMaster || isEligibleRealtor) && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center py-2 text-lg font-medium text-neutral-800 hover:text-primary"
                        >
                          <Settings className="mr-2 h-5 w-5" />
                          {isAdminOrMaster ? "관리자 패널" : "매물 관리"}
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
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/auth"
                      onClick={() => setMobileMenuOpen(false)}
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
