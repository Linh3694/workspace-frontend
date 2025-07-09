import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface ImageTypeSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'class' | 'student') => void;
}

const ImageTypeSelectDialog: React.FC<ImageTypeSelectDialogProps> = ({
  isOpen,
  onClose,
  onSelectType
}) => {
  const handleSelectType = (type: 'class' | 'student') => {
    onSelectType(type);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chọn loại cập nhật ảnh</DialogTitle>
          <DialogDescription>
            Chọn bạn muốn cập nhật ảnh cho lớp hay học sinh
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => handleSelectType('class')}
            >
              <span className="text-lg">🏫</span>
              <span>Ảnh lớp</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => handleSelectType('student')}
            >
              <span className="text-lg">👨‍🎓</span>
              <span>Ảnh học sinh</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageTypeSelectDialog; 