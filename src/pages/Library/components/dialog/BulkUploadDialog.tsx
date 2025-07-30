import { useState } from "react";
import { API_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

interface BulkUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkUploadDialog({
  isOpen,
  onClose,
  onSuccess
}: BulkUploadDialogProps) {
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  // Helper function để tách tác giả bằng nhiều ký tự phân cách khác nhau
  const parseAuthors = (authorString: string): string[] => {
    if (!authorString.trim()) return [];
    
    // Thử các ký tự phân cách: ; , | và xuống dòng
    let authors: string[] = [];
    
    if (authorString.includes(';')) {
      authors = authorString.split(';');
    } else if (authorString.includes(',')) {
      authors = authorString.split(',');
    } else if (authorString.includes('|')) {
      authors = authorString.split('|');
    } else if (authorString.includes('\n')) {
      authors = authorString.split('\n');
    } else {
      // Nếu không có ký tự phân cách, coi như 1 tác giả
      authors = [authorString];
    }
    
    return authors.map(a => a.trim()).filter(Boolean);
  };

  const parseBulkDataFromText = (data: string) => {
    const lines = data.trim().split('\n');
    const libraries = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue; // Skip empty lines and comments
      
      // Detect separator: try tab first, then comma
      const separator = line.includes('\t') ? '\t' : ',';
      const fields = line.split(separator);
      if (fields.length < 2) continue; // Minimum required fields
      
      const library = {
        title: fields[0]?.trim() || "",
        authors: parseAuthors(fields[1]?.trim() || ""),
        category: fields[2]?.trim() || "",
        language: fields[3]?.trim() || "Tiếng Việt",
        documentType: fields[4]?.trim() || "",
        seriesName: fields[5]?.trim() || "",
        isNewBook: fields[6]?.trim().toLowerCase() === 'true',
        isFeaturedBook: fields[7]?.trim().toLowerCase() === 'true',
        isAudioBook: fields[8]?.trim().toLowerCase() === 'true',
        description: {
          linkEmbed: fields[9]?.trim() || "",
          content: fields[10]?.trim() || ""
        },
        introduction: {
          linkEmbed: fields[11]?.trim() || "",
          content: fields[12]?.trim() || ""
        },
        audioBook: {
          linkEmbed: fields[13]?.trim() || "",
          content: fields[14]?.trim() || ""
        }
      };
      
      libraries.push(library);
    }
    
    return libraries;
  };

  const parseBulkDataFromExcel = (workbook: XLSX.WorkBook) => {
    const libraries = [];
    const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
    const worksheet = workbook.Sheets[sheetName];
    
    // Try parsing with headers first (for Vietnamese template)
    const dataWithHeaders = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false,
      defval: '',
      blankrows: false 
    });
    
    if (dataWithHeaders && dataWithHeaders.length > 0) {
      // Check if it's Vietnamese template format
      const firstRow = dataWithHeaders[0] as Record<string, unknown>;
      if (firstRow["Tên đầu sách"] || firstRow["Tên sách"] || firstRow["Title"]) {
        // Use Vietnamese column names (matching backend expectation)
        for (let i = 0; i < dataWithHeaders.length; i++) {
          const row = dataWithHeaders[i] as Record<string, unknown>;
          
          const cleanTitle = String(row["Tên đầu sách"] || row["Tên sách"] || row["Title"] || "");
          if (!cleanTitle.trim()) continue;
          
          const cleanAuthors = String(row["Tác giả"] || row["Authors"] || "");
          
          const library = {
            title: cleanTitle.trim(),
            authors: parseAuthors(cleanAuthors),
            category: String(row["Thể loại"] || row["Category"] || "").trim(),
            language: String(row["Ngôn ngữ"] || row["Language"] || "Tiếng Việt").trim(),
            documentType: String(row["Phân loại tài liệu"] || row["Document Type"] || "").trim(),
            seriesName: String(row["Tùng thư"] || row["Series"] || "").trim(),
            isNewBook: String(row["Sách mới"] || row["New Book"] || "false").toLowerCase() === 'true',
            isFeaturedBook: String(row["Nổi bật"] || row["Featured"] || "false").toLowerCase() === 'true',
            isAudioBook: String(row["Sách nói"] || row["Audio Book"] || "false").toLowerCase() === 'true',
            description: {
              linkEmbed: String(row["Link mô tả"] || row["Description Link"] || "").trim(),
              content: String(row["Nội dung mô tả"] || row["Description"] || "").trim()
            },
            introduction: {
              linkEmbed: String(row["Link giới thiệu"] || row["Introduction Link"] || "").trim(),
              content: String(row["Nội dung giới thiệu"] || row["Introduction"] || "").trim()
            },
            audioBook: {
              linkEmbed: String(row["Link sách nói"] || row["Audio Link"] || "").trim(),
              content: String(row["Nội dung sách nói"] || row["Audio Content"] || "").trim()
            }
          };
          
          libraries.push(library);
        }
        return libraries;
      }
    }
    
    // Fallback to array format (no headers)
    const dataArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    const startRow = dataArray[0] && typeof dataArray[0][0] === 'string' && 
                    (dataArray[0][0].toLowerCase().includes('tên') || dataArray[0][0].toLowerCase().includes('title')) ? 1 : 0;
    
    for (let i = startRow; i < dataArray.length; i++) {
      const row = dataArray[i];
      if (!row || row.length < 2) continue;
      
      const library = {
        title: row[0]?.toString()?.trim() || "",
        authors: parseAuthors(row[1]?.toString()?.trim() || ""),
        category: row[2]?.toString()?.trim() || "",
        language: row[3]?.toString()?.trim() || "Tiếng Việt",
        documentType: row[4]?.toString()?.trim() || "",
        seriesName: row[5]?.toString()?.trim() || "",
        isNewBook: row[6]?.toString()?.toLowerCase() === 'true',
        isFeaturedBook: row[7]?.toString()?.toLowerCase() === 'true',
        isAudioBook: row[8]?.toString()?.toLowerCase() === 'true',
        description: {
          linkEmbed: row[9]?.toString()?.trim() || "",
          content: row[10]?.toString()?.trim() || ""
        },
        introduction: {
          linkEmbed: row[11]?.toString()?.trim() || "",
          content: row[12]?.toString()?.trim() || ""
        },
        audioBook: {
          linkEmbed: row[13]?.toString()?.trim() || "",
          content: row[14]?.toString()?.trim() || ""
        }
      };
      
      if (library.title) {
        libraries.push(library);
      }
    }
    
    return libraries;
  };

  const ensureAuthorsExist = async (authors: string[]) => {
    // Lấy danh sách tác giả hiện có
    const res = await fetch(`${API_URL}/libraries/authors`);
    const allAuthors: { name: string }[] = await res.json();
    const existingNames = allAuthors.map(a => a.name);

    for (const name of authors) {
      if (!existingNames.includes(name)) {
        // Tạo mới tác giả
        await fetch(`${API_URL}/libraries/authors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      }
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error("Vui lòng chọn file để upload!");
      return;
    }

    try {
      let libraries = [];
      const fileName = bulkFile.name.toLowerCase();
      
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Handle Excel files
        const arrayBuffer = await bulkFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        libraries = parseBulkDataFromExcel(workbook);
      } else {
        // Handle text files (CSV, TSV, TXT)
        const fileContent = await bulkFile.text();
        libraries = parseBulkDataFromText(fileContent);
      }
      
      if (libraries.length === 0) {
        toast.error("Không có dữ liệu hợp lệ trong file!");
        return;
      }
      
      // Gom tất cả tác giả lại thành 1 mảng duy nhất
      const allAuthors = Array.from(new Set(libraries.flatMap(lib => lib.authors)));
      await ensureAuthorsExist(allAuthors);

      const response = await fetch(
        `${API_URL}/libraries/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ libraries }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          toast.error(`Lỗi bulk upload: ${result.details.join(", ")}`);
        } else {
          throw new Error(result.error || "Error bulk uploading libraries");
        }
        return;
      }

      onClose();
      setBulkFile(null);
      onSuccess();
      toast.success(result.message || "Bulk upload thành công!");
    } catch (error) {
      console.error("Error bulk uploading libraries:", error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nhập danh sách đầu sách từ Excel/CSV</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div className="text-sm text-gray-500 space-y-2">
            <p>Vui lòng tải file mẫu và điền thông tin theo đúng định dạng.</p>
          </div>
        </DialogDescription>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bulk-file" className="text-right">
              Chọn file
            </Label>
            <Input
              id="bulk-file"
              type="file"
              accept=".xlsx,.xls,.txt,.tsv,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setBulkFile(file || null);
              }}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              File Mẫu
            </Label>
            <Button variant="outline" asChild>
              <a href="/library-book-template.xlsx" download="library-book-template.xlsx">
                Tải file mẫu
              </a>
            </Button>
          </div>             
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose}>
            Đóng
          </Button>
          <Button 
            onClick={handleBulkUpload} 
            disabled={!bulkFile}
            className="bg-[#F05023] text-white"
          >
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 