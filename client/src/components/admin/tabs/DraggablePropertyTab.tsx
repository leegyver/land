import React from "react";
import {
    Loader2,
    Trash2,
    GripVertical,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Property } from "@shared/schema";
import { formatKoreanPrice } from "@/lib/formatter";

interface DraggablePropertyTabProps {
    title: string;
    description: string;
    isLoading: boolean;
    properties: Property[] | undefined;
    handleDragEnd: (result: any) => void;
    onExclude: (property: Property) => void;
    excludeConfirmMessage: string;
    droppableId: string;
}

export const DraggablePropertyTab: React.FC<DraggablePropertyTabProps> = ({
    title,
    description,
    isLoading,
    properties,
    handleDragEnd,
    onExclude,
    excludeConfirmMessage,
    droppableId
}) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : !properties || properties.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">표시할 매물이 없습니다.</p>
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId={droppableId}>
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-3"
                            >
                                {properties.map((property, index) => (
                                    <Draggable key={property.id} draggableId={property.id.toString()} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`bg-white border rounded-lg p-4 flex items-center space-x-4 transition-shadow ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                                                    }`}
                                            >
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                                >
                                                    <GripVertical className="h-5 w-5" />
                                                </div>

                                                <div className="flex-shrink-0 w-16 aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                                                    {property.imageUrls && property.imageUrls.length > 0 ? (
                                                        <img
                                                            src={property.imageUrls[0]}
                                                            alt={property.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Eye className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-lg truncate mb-1">{property.title}</h3>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                        <span>{property.type}</span>
                                                        <span>{property.district}</span>
                                                        <span className="font-medium text-primary">
                                                            {formatKoreanPrice(property.price)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex-shrink-0 flex items-center space-x-1">
                                                    <a
                                                        href={`/properties/${property.id}`}
                                                        className="p-2 text-gray-500 hover:text-primary"
                                                        title="보기"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                                        onClick={() => {
                                                            if (confirm(excludeConfirmMessage)) {
                                                                onExclude(property);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}
        </div>
    );
};
