import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Plus, Users, MapPin } from "lucide-react";
import { DAY_OF_WEEK_LABELS } from '../../../types/timetable.types';
import type { TimetableEntry } from '../../../types/timetable.types';

interface TimetableDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: {
    day: string;
    period: number;
    entry: TimetableEntry | null;
  } | null;
}

export const TimetableDetailDialog: React.FC<TimetableDetailDialogProps> = ({
  isOpen,
  onClose,
  selectedSlot
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chi tiết tiết học</DialogTitle>
          <DialogDescription>
            {selectedSlot && `${DAY_OF_WEEK_LABELS[selectedSlot.day as keyof typeof DAY_OF_WEEK_LABELS]} - Tiết ${selectedSlot.period}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {selectedSlot?.entry && (
            <>
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="font-medium">Môn học:</Label>
                <div className="col-span-2">
                  {typeof selectedSlot.entry.subject === 'object'
                    ? selectedSlot.entry.subject.name
                    : selectedSlot.entry.subject}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-start">
                <Label className="font-medium">Giáo viên:</Label>
                <div className="col-span-2 space-y-1">
                  {(() => {
                    const teachers = selectedSlot.entry.teachers;
                    if (Array.isArray(teachers)) {
                      return teachers.map((teacher, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          {typeof teacher === 'object' ? teacher.fullname : teacher}
                        </div>
                      ));
                    } else if (typeof teachers === 'string') {
                      return (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          {teachers}
                        </div>
                      );
                    }
                    return <span className="text-gray-500 italic">Chưa có giáo viên</span>;
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="font-medium">Phòng học:</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {typeof selectedSlot.entry.room === 'object'
                    ? selectedSlot.entry.room.name
                    : selectedSlot.entry.room || 'Homeroom'}
                </div>
              </div>
            </>
          )}

          {!selectedSlot?.entry && (
            <div className="text-center py-8 text-gray-500">
              <Plus className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Tiết học trống</p>
              <p className="text-sm">Nhấp để thêm môn học</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 