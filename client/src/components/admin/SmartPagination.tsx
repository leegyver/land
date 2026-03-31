import React from "react";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export interface SmartPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    scrollTargetId?: string;
}

export const SmartPagination: React.FC<SmartPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    scrollTargetId
}) => {
    if (totalPages <= 1) return null;

    const handlePageChange = (page: number) => {
        onPageChange(page);
        const activeTargetId = scrollTargetId || 'admin-list-top';
        let target = document.getElementById(activeTargetId);
        
        if (!target && !scrollTargetId) {
            target = document.getElementById('admin-tab-content');
        }
        
        if (target) {
            const y = target.getBoundingClientRect().top + window.scrollY - 80; // 80px offset for sticky header
            window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
            // Fallback for non-admin pages using SmartPagination
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 4) pages.push("ellipsis-1");

            const start = Math.max(2, currentPage - 2);
            const end = Math.min(totalPages - 1, currentPage + 2);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 3) pages.push("ellipsis-2");
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        return pages;
    };

    return (
        <Pagination className="mx-auto justify-center">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>
                {getPageNumbers().map((page, i) => (
                    <PaginationItem key={i}>
                        {typeof page === "number" ? (
                            <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer font-bold h-8 w-8 transition-all hover:bg-primary hover:text-white"
                            >
                                {page}
                            </PaginationLink>
                        ) : (
                            <PaginationEllipsis />
                        )}
                    </PaginationItem>
                ))}
                <PaginationItem>
                    <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};
