import React from "react";
import {
    Loader2,
    Trash2,
    RefreshCw,
    Bell,
    CheckCircle,
    ShieldCheck,
    MessageSquare,
    PhoneCall
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Notification } from "@shared/schema";

interface NotificationTabProps {
    notifications: Notification[];
    unreadCount: number;
    markAllAsReadMutation: any;
    refetchNotifications: () => void;
    isLoadingNotifications: boolean;
    markAsReadMutation: any;
    deleteNotificationMutation: any;
    safeFormatDate: (dateStr: string | Date | null | undefined, includeTime?: boolean) => string;
}

export const NotificationTab: React.FC<NotificationTabProps> = ({
    notifications,
    unreadCount,
    markAllAsReadMutation,
    refetchNotifications,
    isLoadingNotifications,
    markAsReadMutation,
    deleteNotificationMutation,
    safeFormatDate
}) => {
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'signup': return <ShieldCheck className="w-5 h-5 text-blue-500" />;
            case 'post': return <MessageSquare className="w-5 h-5 text-green-500" />;
            case 'property_inquiry': return <PhoneCall className="w-5 h-5 text-red-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getRowClass = (index: number) => {
        return index % 2 === 0 ? "bg-white" : "bg-slate-50";
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border-4 border-slate-900 overflow-hidden">
            <div className="bg-slate-900 p-8 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter">NOTIFICATION CENTER</h2>
                    <p className="text-slate-400 font-bold text-sm tracking-widest mt-1">TOTAL ALERTS: {notifications.length}</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => markAllAsReadMutation.mutate()}
                        className="bg-white text-slate-900 font-black italic rounded-xl hover:bg-primary hover:text-white transition-all border-none"
                        disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
                    >
                        {markAllAsReadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        MARK ALL AS READ
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => refetchNotifications()}
                        className="bg-transparent border-2 border-white/20 text-white font-black italic rounded-xl hover:bg-white/10 transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingNotifications ? "animate-spin" : ""}`} />
                        REFRESH
                    </Button>
                </div>
            </div>

            <div className="p-0 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-100 border-b-2 border-slate-200">
                            <TableHead className="w-[100px] font-black italic text-slate-600 px-8 py-4">TYPE</TableHead>
                            <TableHead className="font-black italic text-slate-600 px-6 py-4">TITLE</TableHead>
                            <TableHead className="font-black italic text-slate-600 px-6 py-4">CONTENT</TableHead>
                            <TableHead className="font-black italic text-slate-600 px-6 py-4">TIME</TableHead>
                            <TableHead className="text-right font-black italic text-slate-600 px-8 py-4">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingNotifications ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                                    <p className="mt-4 font-black italic text-slate-400">Loading Intelligence...</p>
                                </TableCell>
                            </TableRow>
                        ) : notifications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <Bell className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                                    <p className="font-black italic text-slate-400 uppercase text-xl">System Clear. No Alerts.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            notifications.map((notif, index) => (
                                <TableRow
                                    key={notif.id}
                                    className={`group border-none transition-all ${getRowClass(index)} ${!notif.isRead ? "border-l-4 border-l-primary" : ""}`}
                                >
                                    <TableCell className="px-8 py-5">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.isRead ? "bg-slate-100" : "bg-primary/10"
                                            }`}>
                                            {getNotificationIcon(notif.type)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <span className={`font-black italic tracking-tight ${!notif.isRead ? "text-slate-900" : "text-slate-500"}`}>
                                            {notif.title}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <span className={`font-bold text-sm ${!notif.isRead ? "text-slate-700" : "text-slate-400"}`}>
                                            {notif.message}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <span className="font-black italic text-xs text-slate-400 uppercase tracking-tighter">
                                            {safeFormatDate(notif.createdAt, true)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-8 py-5 text-right space-x-2">
                                        {!notif.isRead && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-primary hover:bg-primary/10 font-black italic text-xs"
                                                onClick={() => markAsReadMutation.mutate(notif.id)}
                                            >
                                                READ
                                            </Button>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-slate-300 hover:text-red-600 transition-colors"
                                            onClick={() => deleteNotificationMutation.mutate(notif.id)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
