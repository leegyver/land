import { Link, useLocation } from "wouter";
import { Home, Map, Phone, User, Search, List } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
    const [location] = useLocation();

    const navItems = [
        { icon: Home, label: "홈", path: "/" },
        { icon: Search, label: "매물찾기", path: "/properties" },
        { icon: Map, label: "지도", path: "/contact" }, // Using Contact for map as per user request to use Naver Place/Kakao Map integration or map view
        // Note: If /map is a separate route, update this. For now, /contact has the office map, but /properties has the map view. 
        // Let's us /properties for Search and maybe create a direct map link if needed.
        // Actually, "지도에서 매물 찾기" is better served by /properties?view=map notion, but let's stick to /contact for "Contact/Location" or introduce a dedicated map route if needed. 
        // Given requirements, let's keep it simple.
        { icon: Phone, label: "문의", path: "tel:010-4787-3120", isExternal: true },
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
