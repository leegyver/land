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
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
            <div className="grid grid-cols-5 h-16">
                {navItems.map((item) => {
                    const isActive = location === item.path;
                    const Icon = item.icon;

                    if (item.isExternal) {
                        return (
                            <a
                                key={item.label}
                                href={item.path}
                                className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-orange-600 active:text-orange-700 transition-colors"
                                onClick={(e) => {
                                    if (item.label === '문의') {
                                        // Optional tracking can go here
                                    }
                                }}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </a>
                        )
                    }

                    return (
                        <Link key={item.path} href={item.path}>
                            <div
                                className={cn(
                                    "flex flex-col items-center justify-center h-full space-y-1 transition-colors cursor-pointer",
                                    isActive ? "text-orange-600 bg-orange-50/50" : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
