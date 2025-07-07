import React, { useState } from 'react';
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
import { Input } from "../../../components/ui/input";
import { DatePicker } from "../../../components/ui/datepicker";
import { Loader2, Upload, Calendar, FileText } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/config";
import * as XLSX from 'xlsx';
import type { TimetableImportRecord, TimetableImportPayload, PeriodDefinition } from "../../../types/timetable.types";

interface AddTimetableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchoolYear: string;
  selectedClass: string;
  onTimetableAdded: () => void;
  periodDefinitions: PeriodDefinition[];
}

interface TimetableFormData {
  name: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  file: File | null;
}

const formatDateLocal = (date: Date) =>
  date ? `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}` : '';

export const AddTimetableDialog: React.FC<AddTimetableDialogProps> = ({
  isOpen,
  onClose,
  selectedSchoolYear,
  selectedClass,
  onTimetableAdded,
  periodDefinitions
}) => {
  const [formData, setFormData] = useState<TimetableFormData>({
    name: '',
    startDate: undefined,
    endDate: undefined,
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const { toast } = useToast();

  const handleInputChange = (field: keyof TimetableFormData, value: string | File | null | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear file error when file is selected
    if (field === 'file') {
      setFileError('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      // Validate file type
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        setFileError('Chỉ chấp nhận file Excel (.xlsx, .xls)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError('File quá lớn. Kích thước tối đa 5MB');
        return;
      }
      
      setFileError('');
    }
    handleInputChange('file', file);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên thời khoá biểu",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.startDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày bắt đầu",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.endDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày kết thúc",
        variant: "destructive"
      });
      return false;
    }

    if (formData.startDate >= formData.endDate) {
      toast({
        title: "Lỗi",
        description: "Ngày kết thúc phải sau ngày bắt đầu",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.file) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file thời khoá biểu",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const parseExcelFile = async (file: File, periodDefinitions: PeriodDefinition[]): Promise<TimetableImportRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Mapping từ tiếng Việt sang tiếng Anh cho dayOfWeek
          const dayOfWeekMapping: { [key: string]: string } = {
            "Thứ Hai": "Monday",
            "Thứ Ba": "Tuesday", 
            "Thứ Tư": "Wednesday",
            "Thứ Năm": "Thursday",
            "Thứ Sáu": "Friday",
            "Thứ Bảy": "Saturday",
            "Chủ Nhật": "Sunday"
          };
          
          // Parse dữ liệu từ Excel ma trận thành format BE expect
          const records: TimetableImportRecord[] = [];
          
          if (jsonData.length < 2) {
            reject(new Error('File Excel không có dữ liệu'));
            return;
          }
          
          // Lấy header row để biết các lớp (từ cột C trở đi)
          const headerRow = jsonData[0] as unknown[];
          const classes = headerRow.slice(2); // Bỏ qua cột A (Thứ) và B (Tiết)
          
          console.log('🔍 Parse Excel debug:', {
            totalRows: jsonData.length,
            headerRow: headerRow,
            classes: classes
          });
          
          // ✅ THÊM: Tạo period map và log thông tin
          const periodMap: { [key: number]: PeriodDefinition } = {};
          const regularPeriods: number[] = [];
          const specialPeriods: number[] = [];
          
          periodDefinitions.forEach(p => { 
            periodMap[p.periodNumber] = p; 
            if (p.type === 'regular') {
              regularPeriods.push(p.periodNumber);
            } else {
              specialPeriods.push(p.periodNumber);
            }
          });

          console.log('🔍 Period analysis:', {
            totalPeriods: periodDefinitions.length,
            regularPeriods: regularPeriods.sort((a, b) => a - b),
            specialPeriods: specialPeriods.sort((a, b) => a - b),
            periodTypes: periodDefinitions.map(p => `${p.periodNumber}:${p.type}`)
          });
          
          let lastDayOfWeek = '';
          let processedCount = 0;
          let skippedSpecialCount = 0;
          let skippedInvalidCount = 0;
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as unknown[];
            if (row.length < 3) continue; // Bỏ qua row không đủ dữ liệu
            
            const dayOfWeekVietnamese = row[0]?.toString()?.trim() || lastDayOfWeek;
            if (row[0]) lastDayOfWeek = dayOfWeekVietnamese;
            
            const periodNumber = parseInt(row[1]?.toString() || '0') || 0;
            
            // Chỉ xử lý nếu có thứ và tiết
            if (!dayOfWeekVietnamese || !periodNumber) continue;
            
            // Convert tiếng Việt sang tiếng Anh
            const dayOfWeek = dayOfWeekMapping[dayOfWeekVietnamese];
            if (!dayOfWeek) {
              console.warn(`Không tìm thấy mapping cho ngày: ${dayOfWeekVietnamese}`);
              continue;
            }
            
            // ✅ KIỂM TRA: Period definition và type
            const periodDef = periodMap[periodNumber];
            if (!periodDef) {
              console.warn(`⚠️ Period ${periodNumber} chưa được khai báo trong hệ thống`);
              skippedInvalidCount++;
              continue;
            }
            
            if (periodDef.type !== 'regular') {
              console.log(`⏭️ Skipping special period ${periodNumber} (${periodDef.type}): ${periodDef.label || 'No label'}`);
              skippedSpecialCount++;
              continue; // Bỏ qua tiết đặc biệt
            }
            
            // Duyệt qua từng lớp (từ cột C trở đi)
            for (let j = 2; j < row.length && j - 2 < classes.length; j++) {
              const subject = row[j]?.toString()?.trim();
              const classCode = classes[j - 2]?.toString()?.trim();
              
              console.log(`🔍 Processing cell [${i}][${j}]:`, {
                dayOfWeekVietnamese,
                dayOfWeek,
                periodNumber,
                periodType: periodDef.type,
                classCode,
                subject,
                hasSubject: !!subject,
                hasClass: !!classCode,
                subjectLength: subject?.length,
                classLength: classCode?.length
              });
              
              // Validation mềm hơn - chỉ cần có môn học và lớp
              const isValidSubject = subject && 
                                   subject.toString().trim() !== '' && 
                                   subject !== 'undefined' && 
                                   subject !== 'null' &&
                                   !subject.toString().toLowerCase().includes('trống');
                                   
              const isValidClass = classCode && 
                                 classCode.toString().trim() !== '' && 
                                 classCode !== 'undefined' && 
                                 classCode !== 'null';
              
              if (isValidSubject && isValidClass) {
                const record: TimetableImportRecord = {
                  dayOfWeek: dayOfWeek,
                  periodNumber: periodNumber,
                  classCode: classCode.toString().trim(),
                  subject: subject.toString().trim(),
                  teachers: [], 
                  room: 'Homeroom'
                };
                
                console.log(`✅ Added record:`, record);
                records.push(record);
                processedCount++;
              } else {
                console.log(`❌ Skipped record - invalid data:`, {
                  subject: subject,
                  classCode: classCode,
                  isValidSubject,
                  isValidClass,
                  reason: !isValidSubject ? 'Invalid subject' : 'Invalid class'
                });
              }
            }
          }
          
          console.log('🔍 Parse Excel results:', {
            totalRecords: records.length,
            processedCount,
            skippedSpecialCount,
            skippedInvalidCount,
            sampleRecords: records.slice(0, 3),
            uniqueDays: [...new Set(records.map(r => r.dayOfWeek))],
            uniqueSubjects: [...new Set(records.map(r => r.subject))].slice(0, 5),
            periodDistribution: records.reduce((acc, r) => {
              acc[r.periodNumber] = (acc[r.periodNumber] || 0) + 1;
              return acc;
            }, {} as { [key: number]: number })
          });
          
          resolve(records);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Không thể đọc file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Tạo thời khoá biểu mới
      const scheduleData = {
        name: formData.name,
        schoolYear: selectedSchoolYear,
        class: selectedClass,
        startDate: formData.startDate ? formatDateLocal(formData.startDate) : "",
        endDate: formData.endDate ? formatDateLocal(formData.endDate) : "",
      };

      console.log('🔍 Schedule data debug:', {
        selectedSchoolYear,
        selectedClass,
        scheduleData
      });

      const scheduleRes = await api.post(API_ENDPOINTS.TIMETABLE_SCHEDULES, scheduleData);
      const scheduleId = scheduleRes.data.schedule._id;

      // Nếu có file, đọc file và import dữ liệu
      if (formData.file) {
        try {
          // ✅ THÊM: Kiểm tra period definitions trước khi parse
          console.log('🔍 Checking period definitions before parsing...');
          if (periodDefinitions.length === 0) {
            toast({
              title: "Lỗi",
              description: "Chưa khai báo tiết học cho trường này. Vui lòng khai báo tiết học trước khi import.",
              variant: "destructive"
            });
            return;
          }

          console.log('🔍 Available period definitions:', periodDefinitions.map(p => ({
            periodNumber: p.periodNumber,
            type: p.type,
            startTime: p.startTime,
            endTime: p.endTime
          })));

          const records = await parseExcelFile(formData.file, periodDefinitions);
          
          if (records.length === 0) {
            toast({
              title: "Cảnh báo",
              description: "Không tìm thấy dữ liệu hợp lệ trong file Excel",
              variant: "destructive"
            });
            return;
          }

          // Lấy danh sách subjects để map tên môn học thành ID
          const subjectsResponse = await api.get(API_ENDPOINTS.SUBJECTS);
          const subjects = Array.isArray(subjectsResponse.data) ? subjectsResponse.data : subjectsResponse.data.data || [];
          
          console.log('🔍 Available subjects in DB:', subjects.map((s: { name?: string; _id: string }) => s.name).slice(0, 10));
          
          // Mapping các tên môn học phổ biến
          const commonSubjectMappings: { [key: string]: string[] } = {
            'toán': ['toán', 'toan', 'math', 'mathematics', 'toán học', 'toanhoc'],
            'tiếng anh': ['tiếng anh', 'tieng anh', 'english', 'anh văn', 'anhvan', 'tiếng anh esl', 'tieng anh esl'],
            'tiếng việt': ['tiếng việt', 'tieng viet', 'vietnamese', 'việt văn', 'viet van', 'văn', 'van'],
            'khoa học': ['khoa học', 'khoa hoc', 'science', 'kh', 'khoa học tiếng anh'],
            'thể thao': ['thể thao', 'the thao', 'physical education', 'pe', 'td'],
            'âm nhạc': ['âm nhạc', 'am nhac', 'music', 'nhạc', 'nhac'],
            'mỹ thuật': ['mỹ thuật', 'my thuat', 'art', 'mt'],
            'tin học': ['tin học', 'tin hoc', 'computer', 'ict', 'cntt'],
            'sinh học': ['sinh học', 'sinh hoc', 'biology', 'bio'],
            'lịch sử': ['lịch sử', 'lich su', 'history'],
            'địa lý': ['địa lý', 'dia ly', 'geography'],
            'hóa học': ['hóa học', 'hoa hoc', 'chemistry'],
            'vật lý': ['vật lý', 'vat ly', 'physics'],
            'robotics': ['robotics', 'robot', 'lập trình', 'lap trinh'],
            'clb': ['clb', 'club', 'câu lạc bộ', 'cau lac bo']
          };

          // Tạo mapping từ tên môn học sang ID (exact match + fuzzy match)
          const subjectNameToIdMap: { [key: string]: string } = {};
          const subjectByName = new Map<string, { name: string; _id: string }>();
          
          subjects.forEach((subject: { name?: string; _id: string }) => {
            if (subject.name) {
              // Exact match
              subjectNameToIdMap[subject.name] = subject._id;
              const subjectWithName = { name: subject.name, _id: subject._id };
              subjectByName.set(subject.name.toLowerCase().trim(), subjectWithName);
              
              // Thêm variations từ common mappings
              const subjectLower = subject.name.toLowerCase().trim();
              for (const [key, variations] of Object.entries(commonSubjectMappings)) {
                if (variations.some(v => subjectLower.includes(v) || v.includes(subjectLower))) {
                  variations.forEach(variation => {
                    if (!subjectByName.has(variation)) {
                      subjectByName.set(variation, subjectWithName);
                    }
                  });
                  // Thêm key chính
                  if (!subjectByName.has(key)) {
                    subjectByName.set(key, subjectWithName);
                  }
                }
              }
              
              // Thêm một số variations cơ bản
              const variations = [
                subject.name.toLowerCase().trim(),
                subject.name.replace(/\s+/g, '').toLowerCase(),
                subject.name.replace(/học/g, '').trim().toLowerCase(),
                subject.name.replace(/môn/g, '').trim().toLowerCase(),
                subject.name.replace(/tiếng/g, '').trim().toLowerCase(),
                subject.name.replace(/khoa/g, '').trim().toLowerCase()
              ].filter(v => v.length > 1);
              
              variations.forEach(variation => {
                if (variation && !subjectByName.has(variation)) {
                  subjectByName.set(variation, subjectWithName);
                }
              });
            }
          });
          
          // Hàm tìm subject phù hợp
          const findMatchingSubject = (subjectName: string): string | null => {
            if (!subjectName) return null;
            
            console.log(`🔍 Finding match for subject: "${subjectName}"`);
            
            // Exact match
            if (subjectNameToIdMap[subjectName]) {
              console.log(`✅ Exact match found: "${subjectName}"`);
              return subjectNameToIdMap[subjectName];
            }
            
            // Fuzzy match
            const normalized = subjectName.toLowerCase().trim();
            const exactMatch = subjectByName.get(normalized);
            if (exactMatch) {
              console.log(`✅ Fuzzy match found: "${subjectName}" -> "${exactMatch.name}"`);
              return exactMatch._id;
            }
            
            // Tìm kiếm partial match - mở rộng hơn
            for (const [key, subject] of subjectByName) {
              // Check contains (both ways)
              if (key.includes(normalized) || normalized.includes(key)) {
                console.log(`✅ Partial match found: "${subjectName}" -> "${subject.name}" (via "${key}")`);
                return subject._id;
              }
              
              // Check individual words
              const normalizedWords = normalized.split(/\s+/);
              const keyWords = key.split(/\s+/);
              
              const hasCommonWord = normalizedWords.some(word => 
                word.length > 2 && keyWords.some(keyWord => 
                  keyWord.includes(word) || word.includes(keyWord)
                )
              );
              
              if (hasCommonWord) {
                console.log(`✅ Word match found: "${subjectName}" -> "${subject.name}" (words: ${normalizedWords.join(', ')})`);
                return subject._id;
              }
            }
            
            // Last resort - check if exact name exists in subjects (case insensitive)
            const directMatch = subjects.find((s: { name?: string; _id: string }) => 
              s.name && s.name.toLowerCase().trim() === normalized
            );
            
            if (directMatch) {
              console.log(`✅ Direct match found: "${subjectName}" -> "${directMatch.name}"`);
              return directMatch._id;
            }
            
            console.warn(`❌ No match found for: "${subjectName}"`);
            return null;
          };
          
          // Convert subject names thành subject IDs và thêm scheduleId
          const recordsWithSubjectIds = records.map(record => {
            const matchedSubjectId = findMatchingSubject(record.subject);
            return {
              ...record,
              subject: matchedSubjectId || record.subject,
              originalSubject: record.subject, // Giữ lại tên gốc để debug
              scheduleId // ✅ THÊM: Gắn scheduleId cho từng record
            } as TimetableImportRecord & { originalSubject: string };
          });
          
          // Lọc ra các record có subject ID hợp lệ
          const validRecords = recordsWithSubjectIds.filter(record => {
            const isValid = subjects.some((s: { _id: string }) => s._id === record.subject);
            if (!isValid) {
              console.warn(`⚠️  Subject not found: "${record.originalSubject}" -> "${record.subject}"`);
            }
            return isValid;
          });
          
          if (validRecords.length === 0) {
            const subjectsFromExcelHere = [...new Set(records.map(r => r.subject))];
            toast({
              title: "Lỗi",
              description: `Không tìm thấy môn học nào phù hợp trong hệ thống. Các môn học từ Excel: ${subjectsFromExcelHere.join(', ')}`,
              variant: "destructive"
            });
            return;
          }
          
          if (validRecords.length < records.length) {
            const unmatchedCount = records.length - validRecords.length;
            const unmatchedSubjectsHere = recordsWithSubjectIds
              .filter(r => !subjects.some((s: { _id: string }) => s._id === r.subject))
              .map(r => r.originalSubject);
            const uniqueUnmatchedSubjectsHere = [...new Set(unmatchedSubjectsHere)];
            
            console.warn(`Có ${unmatchedCount} môn học không tìm thấy trong hệ thống:`, uniqueUnmatchedSubjectsHere);
            
            toast({
              title: "Cảnh báo",
              description: `${unmatchedCount} môn học không khớp với hệ thống sẽ bị bỏ qua. Kiểm tra console để xem danh sách.`,
              variant: "destructive"
            });
          }

          // Gửi dữ liệu lên BE để import (loại bỏ originalSubject)
          const cleanRecords: TimetableImportRecord[] = validRecords.map(record => ({
            dayOfWeek: record.dayOfWeek,
            periodNumber: record.periodNumber,
            classCode: record.classCode,
            subject: record.subject,
            teachers: record.teachers,
            room: record.room,
            scheduleId: record.scheduleId // ✅ THÊM: Gắn scheduleId cho từng slot
          }));
          
          const importPayload: TimetableImportPayload = {
            schoolYear: selectedSchoolYear,
            records: cleanRecords
          };

          // Thống kê chi tiết về subject matching
          const subjectsFromExcel = [...new Set(records.map(r => r.subject))];
          const unmatchedSubjects = recordsWithSubjectIds
            .filter(r => !subjects.some((s: { _id: string }) => s._id === r.subject))
            .map(r => r.originalSubject);
          const uniqueUnmatchedSubjects = [...new Set(unmatchedSubjects)];
          
          console.log('🔍 Subject matching summary:', {
            totalSubjectsInDB: subjects.length,
            availableSubjects: subjects.map((s: { name?: string }) => s.name).slice(0, 10),
            totalRecordsFromExcel: records.length,
            uniqueSubjectsFromExcel: subjectsFromExcel.length,
            subjectsFromExcel: subjectsFromExcel,
            recordsWithValidSubjects: validRecords.length,
            invalidRecords: recordsWithSubjectIds.length - validRecords.length,
            uniqueUnmatchedSubjects: uniqueUnmatchedSubjects.length,
            unmatchedSubjects: uniqueUnmatchedSubjects,
            sampleValidRecord: validRecords[0],
            subjectMappingCount: Object.keys(subjectNameToIdMap).length,
            mappingKeys: Array.from(subjectByName.keys()).slice(0, 20)
          });
          
          console.log('🔍 Import payload debug:', {
            schoolYear: selectedSchoolYear,
            recordsCount: cleanRecords.length,
            sampleRecord: cleanRecords[0],
            subjectMapping: Object.keys(subjectNameToIdMap).slice(0, 5),
            scheduleId: scheduleId
          });

          const importResult = await api.post(API_ENDPOINTS.TIMETABLES_IMPORT, importPayload);
          
          console.log('🔍 Import result:', importResult.data);
          
          toast({
            title: "Thành công",
            description: `Thời khoá biểu đã được thêm thành công với ${cleanRecords.length}/${records.length} bản ghi`
          });
        } catch (parseError) {
          console.error('Error parsing Excel file:', parseError);
          toast({
            title: "Lỗi",
            description: `Không thể đọc file Excel: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            variant: "destructive"
          });
          return;
        }
      } else {
        toast({
          title: "Thành công",
          description: "Thời khoá biểu đã được tạo thành công"
        });
      }

      // Reset form
      setFormData({
        name: '',
        startDate: undefined,
        endDate: undefined,
        file: null
      });

      onTimetableAdded();
      onClose();
    } catch (error) {
      console.error('Error adding timetable:', error);
      console.error('Error details:', {
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message,
        data: (error as { response?: { data?: unknown } }).response?.data,
        status: (error as { response?: { status?: number } }).response?.status
      });
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Không thể thêm thời khoá biểu. Vui lòng thử lại.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      startDate: undefined,
      endDate: undefined,
      file: null
    });
    setFileError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Thêm thời khoá biểu mới
          </DialogTitle>
          <DialogDescription>
            Tạo thời khoá biểu mới với tên, khoảng thời gian và file Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tên thời khoá biểu */}
          <div className="space-y-2">
            <Label htmlFor="timetable-name">Tên thời khoá biểu *</Label>
            <Input
              id="timetable-name"
              placeholder="VD: Thời khoá biểu học kỳ 1"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          {/* Ngày bắt đầu */}
          <div className="space-y-2">
            <Label>Ngày bắt đầu *</Label>
            <DatePicker
              date={formData.startDate}
              setDate={(date) => handleInputChange('startDate', date)}
            />
          </div>

          {/* Ngày kết thúc */}
          <div className="space-y-2">
            <Label>Ngày kết thúc *</Label>
            <DatePicker
              date={formData.endDate}
              setDate={(date) => handleInputChange('endDate', date)}
            />
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label htmlFor="timetable-file">File thời khoá biểu *</Label>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="timetable-file"
                disabled={loading}
              />
              <Button asChild variant="outline" className="w-full">
                <label htmlFor="timetable-file" className="cursor-pointer flex items-center gap-2">
                  {formData.file ? (
                    <>
                      <FileText className="h-4 w-4" />
                      {formData.file.name}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Chọn file Excel
                    </>
                  )}
                </label>
              </Button>
            </div>
            {fileError && (
              <p className="text-sm text-red-500">{fileError}</p>
            )}
            <p className="text-xs text-gray-500">
              Hỗ trợ file Excel (.xlsx, .xls). Kích thước tối đa 5MB
              <br />
              Format: Cột A=Thứ (VD: Thứ Hai), Cột B=Tiết (VD: 1), Cột C trở đi=Các lớp (VD: 1A1), Giá trị=Tên môn học (VD: Toán)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang thêm...
              </>
            ) : (
              "Thêm thời khoá biểu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 