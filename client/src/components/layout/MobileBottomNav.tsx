import { Link, useLocation } from "wouter";
import { Home, Phone, User, Search, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
    const [location] = useLocation();

    const navItems = [
        { icon: Home, label: "홈", path: "/" },
        { icon: Search, label: "매물찾기", path: "/properties" },
        { icon: Gavel, label: "반값경매", path: "/auctions" },
        { icon: Phone, label: "전화상담", path: "tel:010-4787-3120", isExternal: true },
        { icon: User, label: "MY", path: "/profile" },
    ];

    return (
        <nav aria-label="모바일 하단 내비게이션" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 pb-safe pl-safe pr-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-5 h-16 landscape:h-12 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = location === item.path;
                    const Icon = item.icon;

                    if (item.isExternal) {
                        return (
                            <a
                                key={item.label}
                                href={item.path}
                                className="flex flex-col items-center justify-center space-y-0.5 landscape:space-y-0 text-gray-500 hover:text-orange-600 active:text-orange-700 transition-colors touch-manipulation min-h-[44px]"
                            >
                                <Icon className="w-5 h-5 landscape:w-4 landscape:h-4" />
                                <span className="text-[10px] landscape:text-[9px] font-medium leading-none">{item.label}</span>
                            </a>
                        )
                    }

                    return (
                        <Link key={item.path} href={item.path}>
                            <div
                                className={cn(
                                    "flex flex-col items-center justify-center h-full space-y-0.5 landscape:space-y-0 transition-colors cursor-pointer touch-manipulation min-h-[44px]",
                                    isActive ? "text-orange-600 bg-orange-50/60 font-semibold" : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 landscape:w-4 landscape:h-4", isActive && "fill-current")} />
                                <span className="text-[10px] landscape:text-[9px] font-medium leading-none">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
