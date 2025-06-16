import React, { useState, useEffect, useRef } from "react";
import { API_URL, BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import { toast } from "sonner";
import type { 
  DocumentType, 
  SeriesName, 
  SpecialCode, 
  Author, 
  Library, 
  Book 
} from "@/types/library";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

// ------------------- COMPONENT DocumentType ------------------- //
function DocumentTypeComponent() {
  const [data, setData] = useState<DocumentType[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries/document-types`);
      if (!response.ok) throw new Error("Failed to fetch document types");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching document types:", error);
      toast.error("Lỗi khi tải danh sách phân loại tài liệu");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item: DocumentType) => {
    setEditingId(item._id);
    setEditName(item.name);
    setEditCode(item.code);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/libraries/document-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, code: editCode }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi cập nhật document type");
      }
      
      setEditingId(null);
      fetchData();
      toast.success("Cập nhật thành công");
    } catch (error) {
      console.error("Error updating document type:", error);
      toast.error(error instanceof Error ? error.message : "Lỗi không xác định");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!name || !code) return;
    
    try {
      const response = await fetch(`${API_URL}/libraries/document-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi tạo document type");
      }
      
      setName("");
      setCode("");
      fetchData();
      toast.success("Tạo mới thành công");
    } catch (error) {
      console.error("Error creating document type:", error);
      toast.error(error instanceof Error ? error.message : "Lỗi không xác định");
    }
  };

  const handleDelete = async (item: DocumentType) => {
    try {
      const response = await fetch(`${API_URL}/libraries/document-types/${item._id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi xóa document type");
      }
      
      fetchData();
      toast.success("Xóa thành công");
    } catch (error) {
      console.error("Error deleting document type:", error);
      toast.error(error instanceof Error ? error.message : "Lỗi không xác định");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Phân loại tài liệu</CardTitle>
          <div className="flex gap-2 items-center">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên đầu mục..."
              className="w-48"
            />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Nhập mã đầu mục..."
              className="w-48"
            />
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <FiPlus size={16} />
              Thêm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên đầu mục</TableHead>
              <TableHead>Mã</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => {
              const isEditing = editingId === item._id;
              return (
                <TableRow key={item._id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                      />
                    ) : (
                      item.code
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(item._id)}
                          >
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            Hủy
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <FiEdit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item)}
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ------------------- COMPONENT SeriesName ------------------- //
function SeriesNameComponent() {
  const [data, setData] = useState<SeriesName[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries/series-names`);
      if (!response.ok) throw new Error("Failed to fetch series names");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching series names:", error);
      toast.error("Lỗi khi tải danh sách tùng thư");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!name) return;
    
    try {
      const response = await fetch(`${API_URL}/libraries/series-names`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi tạo series name");
      }
      
      setName("");
      fetchData();
      toast.success("Tạo mới thành công");
    } catch (error) {
      console.error("Error creating series name:", error);
      toast.error(error instanceof Error ? error.message : "Lỗi không xác định");
    }
  };

  const handleEdit = (item: SeriesName) => {
    setEditingId(item._id);
    setEditName(item.name);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/libraries/series-names/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi cập nhật series name");
      }
      
      setEditingId(null);
      fetchData();
      toast.success("Cập nhật thành công");
    } catch (error) {
      console.error("Error updating series name:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (item: SeriesName) => {
    try {
      const response = await fetch(`${API_URL}/libraries/series-names/${item._id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi xóa series name");
      }
      
      fetchData();
      toast.success("Xóa thành công");
    } catch (error) {
      console.error("Error deleting series name:", error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tùng thư</CardTitle>
          <div className="flex gap-2 items-center">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên tùng thư..."
              className="w-48"
            />
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <FiPlus size={16} />
              Thêm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên tùng thư</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => {
              const isEditing = editingId === item._id;
              return (
                <TableRow key={item._id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(item._id)}
                          >
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            Hủy
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <FiEdit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item)}
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ------------------- COMPONENT SpecialCode ------------------- //
function SpecialCodeComponent() {
  const [data, setData] = useState<SpecialCode[]>([]);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries/special-codes`);
      if (!response.ok) throw new Error("Failed to fetch special codes");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching special codes:", error);
      toast.error("Lỗi khi tải danh sách đăng ký cá biệt");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newCode.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/libraries/special-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), code: newCode.trim() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi tạo special code");
      }
      
      setNewName("");
      setNewCode("");
      fetchData();
      toast.success("Tạo mới thành công");
    } catch (error) {
      console.error("Error creating special code:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleEdit = (item: SpecialCode) => {
    setEditingId(item._id);
    setEditName(item.name);
    setEditCode(item.code);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/libraries/special-codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, code: editCode }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi cập nhật special code");
      }
      
      setEditingId(null);
      fetchData();
      toast.success("Cập nhật thành công");
    } catch (error) {
      console.error("Error updating special code:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (item: SpecialCode) => {
    try {
      const response = await fetch(`${API_URL}/libraries/special-codes/${item._id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi xóa special code");
      }
      
      fetchData();
      toast.success("Xóa thành công");
    } catch (error) {
      console.error("Error deleting special code:", error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Đăng ký cá biệt</CardTitle>
          <div className="flex gap-2 items-center">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nhập tên..."
              className="w-48"
            />
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Nhập mã cá biệt..."
              className="w-48"
            />
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <FiPlus size={16} />
              Thêm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Mã</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => {
              const isEditing = editingId === item._id;
              return (
                <TableRow key={item._id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                      />
                    ) : (
                      item.code
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(item._id)}
                          >
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            Hủy
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <FiEdit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item)}
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ------------------- COMPONENT AuthorList ------------------- //
function AuthorListComponent() {
  const [data, setData] = useState<Author[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries/authors`);
      if (!response.ok) throw new Error("Failed to fetch authors");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching authors:", error);
      toast.error("Lỗi khi tải danh sách tác giả");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!name) return;
    
    try {
      const response = await fetch(`${API_URL}/libraries/authors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi tạo tác giả");
      }
      
      setName("");
      fetchData();
      toast.success("Tạo mới thành công");
    } catch (error) {
      console.error("Error creating author:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleEdit = (item: Author) => {
    setEditingId(item._id);
    setEditName(item.name);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/libraries/authors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi cập nhật tác giả");
      }
      
      setEditingId(null);
      fetchData();
      toast.success("Cập nhật thành công");
    } catch (error) {
      console.error("Error updating author:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (item: Author) => {
    try {
      const response = await fetch(`${API_URL}/libraries/authors/${item._id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi xóa tác giả");
      }
      
      fetchData();
      toast.success("Xóa thành công");
    } catch (error) {
      console.error("Error deleting author:", error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Danh sách tác giả</CardTitle>
          <div className="flex gap-2 items-center">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên tác giả..."
              className="w-48"
            />
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <FiPlus size={16} />
              Thêm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên tác giả</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => {
              const isEditing = editingId === item._id;
              return (
                <TableRow key={item._id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(item._id)}
                          >
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Hủy
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <FiEdit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item)}
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ------------------- COMPONENT LibraryInformation ------------------- //
function LibraryInformationComponent() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentLibrary, setCurrentLibrary] = useState<Partial<Library>>({
    authors: [],
    title: "",
    coverImage: "",
    category: "",
    language: "",
    description: "",
    documentType: "",
    specialCode: "",
    seriesName: "",
  });

  const [, setAllAuthors] = useState<Author[]>([]);
  const [allDocumentTypes, setAllDocumentTypes] = useState<DocumentType[]>([]);
  const [allSpecialCodes, setAllSpecialCodes] = useState<SpecialCode[]>([]);
  const [allSeriesNames, setAllSeriesNames] = useState<SeriesName[]>([]);

  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const fetchLibraries = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries`);
      if (!response.ok) throw new Error("Failed to fetch libraries");
      const result = await response.json();
      setLibraries(result);
    } catch (error) {
      console.error("Error fetching libraries:", error);
      toast.error("Lỗi khi tải danh sách đầu sách");
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [authorsRes, docTypesRes, specialCodesRes, seriesRes] = await Promise.all([
        fetch(`${API_URL}/libraries/authors`),
        fetch(`${API_URL}/libraries/document-types`),
        fetch(`${API_URL}/libraries/special-codes`),
        fetch(`${API_URL}/libraries/series-names`),
      ]);

      const [authors, docTypes, specialCodes, series] = await Promise.all([
        authorsRes.json(),
        docTypesRes.json(),
        specialCodesRes.json(),
        seriesRes.json(),
      ]);

      setAllAuthors(authors);
      setAllDocumentTypes(docTypes);
      setAllSpecialCodes(specialCodes);
      setAllSeriesNames(series);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  useEffect(() => {
    fetchLibraries();
    fetchDropdownData();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentLibrary({
      authors: [],
      title: "",
      coverImage: "",
      category: "",
      language: "",
      description: "",
      documentType: "",
      specialCode: "",
      seriesName: "",
    });
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (library: Library) => {
    setModalMode("edit");
    setCurrentLibrary(library);
    if (library.coverImage) {
      setCoverImageFile(null);
      setCoverImagePreview(`${BASE_URL}/${library.coverImage}`);
    } else {
      setCoverImageFile(null);
      setCoverImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const handleModalChange = (field: string, value: unknown) => {
    setCurrentLibrary((prev) => ({ ...prev, [field]: value }));
  };

  const handleModalSave = async () => {
    try {
      const formData = new FormData();
      if (coverImageFile) {
        formData.append("file", coverImageFile);
      }

      if (modalMode === "create") {
        formData.append("authors", Array.isArray(currentLibrary.authors) 
          ? currentLibrary.authors.join(",") 
          : currentLibrary.authors || "");
        formData.append("title", currentLibrary.title || "");
        formData.append("category", currentLibrary.category || "");
        formData.append("language", currentLibrary.language || "");
        formData.append("documentType", currentLibrary.documentType || "");
        formData.append("specialCode", currentLibrary.specialCode || "");
        formData.append("seriesName", currentLibrary.seriesName || "");
        formData.append("description", currentLibrary.description || "");

        const response = await fetch(`${API_URL}/libraries`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error creating library");
        }
      } else {
        // Edit mode
        const payload = {
          ...currentLibrary,
          authors: Array.isArray(currentLibrary.authors) 
            ? currentLibrary.authors 
            : (currentLibrary.authors || "").split(",").map((a: string) => a.trim()).filter(Boolean),
        };

        const response = await fetch(`${API_URL}/libraries/${currentLibrary._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error updating library");
        }
      }

      setIsModalOpen(false);
      fetchLibraries();
      toast.success("Lưu thành công!");
    } catch (error) {
      console.error("Error saving library:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/libraries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error deleting library");
      }

      fetchLibraries();
      toast.success("Xóa thành công!");
    } catch (error) {
      console.error("Error deleting library:", error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Đầu sách</CardTitle>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <FiPlus size={16} />
            Thêm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã định danh</TableHead>
              <TableHead>Tên sách</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Thể loại</TableHead>
              <TableHead>Ngôn ngữ</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {libraries.map((lib) => (
              <TableRow key={lib._id}>
                <TableCell>{lib.libraryCode}</TableCell>
                <TableCell className="font-medium">{lib.title}</TableCell>
                <TableCell>{lib.authors?.join(", ")}</TableCell>
                <TableCell>{lib.category}</TableCell>
                <TableCell>{lib.language}</TableCell>
                <TableCell className="max-w-xs truncate">{lib.description}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(lib)}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(lib._id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="min-w-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {modalMode === "create" ? "Tạo mới đầu sách" : "Chỉnh sửa đầu sách"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 mt-4">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tên sách <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={currentLibrary.title || ""}
                    onChange={(e) => handleModalChange("title", e.target.value)}
                    placeholder="Nhập tên sách..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tác giả:</label>
                  <Input
                    value={Array.isArray(currentLibrary.authors) 
                      ? currentLibrary.authors.join(", ") 
                      : currentLibrary.authors || ""}
                    onChange={(e) => handleModalChange("authors", e.target.value.split(",").map(a => a.trim()))}
                    placeholder="Nhập tác giả..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Thể loại:</label>
                  <Input
                    value={currentLibrary.category || ""}
                    onChange={(e) => handleModalChange("category", e.target.value)}
                    placeholder="Nhập thể loại..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ngôn ngữ:</label>
                  <Input
                    value={currentLibrary.language || ""}
                    onChange={(e) => handleModalChange("language", e.target.value)}
                    placeholder="Nhập ngôn ngữ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mô tả:</label>
                  <Textarea
                    value={currentLibrary.description || ""}
                    onChange={(e) => handleModalChange("description", e.target.value)}
                    placeholder="Nhập mô tả..."
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phân loại tài liệu:</label>
                  <select
                    className="w-full p-2 border border-input rounded-md"
                    value={currentLibrary.documentType || ""}
                    onChange={(e) => handleModalChange("documentType", e.target.value)}
                  >
                    <option value="">Chọn phân loại tài liệu...</option>
                    {allDocumentTypes.map((dt) => (
                      <option key={dt._id} value={dt.name}>
                        {dt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quy ước sách:</label>
                  <select
                    className="w-full p-2 border border-input rounded-md"
                    value={currentLibrary.specialCode || ""}
                    onChange={(e) => handleModalChange("specialCode", e.target.value)}
                  >
                    <option value="">Chọn quy ước sách...</option>
                    {allSpecialCodes.map((sc) => (
                      <option key={sc._id} value={sc.name}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tùng thư:</label>
                  <select
                    className="w-full p-2 border border-input rounded-md"
                    value={currentLibrary.seriesName || ""}
                    onChange={(e) => handleModalChange("seriesName", e.target.value)}
                  >
                    <option value="">Chọn tùng thư...</option>
                    {allSeriesNames.map((sn) => (
                      <option key={sn._id} value={sn.name}>
                        {sn.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ảnh bìa:</label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary"
                    onClick={() => coverImageInputRef.current?.click()}
                  >
                    {coverImagePreview ? (
                      <img
                        src={coverImagePreview}
                        alt="Preview"
                        className="h-32 mx-auto object-contain"
                      />
                    ) : (
                      <div className="text-gray-500">
                        <p>Kéo thả hoặc chọn ảnh bìa từ máy tính</p>
                        <p className="text-xs mt-1">Định dạng hỗ trợ: .jpg, .jpeg, .png</p>
                      </div>
                    )}
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setCoverImageFile(file);
                        setCoverImagePreview(URL.createObjectURL(file));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleModalSave}>
                Lưu
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ------------------- COMPONENT BookDetail ------------------- //
function BookDetailComponent() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentBook, setCurrentBook] = useState<Partial<Book>>({
    isbn: "",
    documentIdentifier: "",
    bookTitle: "",
    classificationSign: "",
    publisherPlaceName: "",
    publisherName: "",
    publishYear: null,
    pages: null,
    attachments: [],
    documentType: "",
    coverPrice: null,
    language: "",
    catalogingAgency: "",
    storageLocation: "",
    seriesName: "",
    specialCode: "",
  });

  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Library[]>([]);

  const fetchAllBooks = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries/books`);
      if (!response.ok) throw new Error("Failed to fetch books");
      const result = await response.json();
      setAllBooks(result);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Lỗi khi tải danh sách sách");
    }
  };

  const fetchLibraries = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries`);
      if (!response.ok) throw new Error("Failed to fetch libraries");
      const result = await response.json();
      setLibraries(result);
    } catch (error) {
      console.error("Error fetching libraries:", error);
    }
  };

  useEffect(() => {
    fetchAllBooks();
    fetchLibraries();
  }, []);

  const handleLibrarySearch = (term: string) => {
    setLibrarySearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      setSelectedLibrary(null);
      return;
    }
    const lower = term.toLowerCase();
    const matched = libraries
      .filter((lib) => lib.title.toLowerCase().includes(lower))
      .slice(0, 5);
    setSearchResults(matched);
  };

  const handleSelectLibrary = (lib: Library) => {
    setSelectedLibrary(lib);
    setLibrarySearchTerm(lib.title);
    setSearchResults([]);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentBook({
      isbn: "",
      documentIdentifier: "",
      bookTitle: "",
      classificationSign: "",
      publisherPlaceName: "",
      publisherName: "",
      publishYear: null,
      pages: null,
      attachments: [],
      documentType: "",
      coverPrice: null,
      language: "",
      catalogingAgency: "",
      storageLocation: "",
      seriesName: "",
      specialCode: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setModalMode("edit");
    setCurrentBook(book);
    setIsModalOpen(true);
  };

  const handleChange = (field: string, value: unknown) => {
    setCurrentBook((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveModal = async () => {
    if (!selectedLibrary && modalMode === "create") {
      toast.error("Vui lòng chọn Library trước!");
      return;
    }

    try {
      const payload = {
        ...currentBook,
        publishYear: currentBook.publishYear ? Number(currentBook.publishYear) : null,
        pages: currentBook.pages ? Number(currentBook.pages) : null,
        coverPrice: currentBook.coverPrice ? Number(currentBook.coverPrice) : null,
      };

      if (modalMode === "create") {
        const response = await fetch(
          `${API_URL}/libraries/${selectedLibrary!._id}/books`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error adding new book");
        }
      } else {
        // Edit mode - would need book index or ID
        toast.error("Edit functionality needs implementation");
        return;
      }

      setIsModalOpen(false);
      fetchAllBooks();
      toast.success("Lưu sách thành công!");
    } catch (error) {
      console.error("Error saving book:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (book: Book) => {
    if (!book.generatedCode) {
      toast.error("Không tìm thấy mã sách để xóa");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/libraries/books/${book.generatedCode}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi xóa sách");
      }

      fetchAllBooks();
      toast.success("Xóa sách thành công!");
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sách</CardTitle>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <FiPlus size={16} />
            Thêm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã sách</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Tên sách</TableHead>
              <TableHead>Năm XB</TableHead>
              <TableHead>Tình trạng</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allBooks.map((book) => (
              <TableRow key={book.generatedCode}>
                <TableCell className="font-medium">{book.generatedCode}</TableCell>
                <TableCell>{book.isbn}</TableCell>
                <TableCell>{book.bookTitle}</TableCell>
                <TableCell>{book.publishYear}</TableCell>
                <TableCell>
                  <Badge variant={book.status === "available" ? "default" : "secondary"}>
                    {book.status || "Có sẵn"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => openEditModal(book)}
                    >
                      <FiEdit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(book)}
                    >
                      <FiTrash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {modalMode === "create" ? "Thêm sách mới" : "Chỉnh sửa sách"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {modalMode === "create" && (
                <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Chọn Đầu Sách <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Nhập đầu sách..."
                      value={librarySearchTerm}
                      onChange={(e) => handleLibrarySearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <div className="border border-gray-200 mt-1 rounded bg-white shadow-md max-h-32 overflow-y-auto">
                        {searchResults.map((lib) => (
                          <div
                            key={lib._id}
                            className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSelectLibrary(lib)}
                          >
                            {lib.title}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedLibrary && (
                      <div className="mt-2 text-sm text-gray-600">
                        Đã chọn: <b>{selectedLibrary.title}</b>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Quy ước sách <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Nhập quy ước sách..."
                      value={currentBook.specialCode || ""}
                      onChange={(e) => handleChange("specialCode", e.target.value)}
                    />
                  </div>
                </div>
              )}
              <Label className="text-base font-medium mb-2">Thông tin sách</Label>
              <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ISBN <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập mã ISBN"
                    value={currentBook.isbn || ""}
                    onChange={(e) => handleChange("isbn", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Định danh tài liệu <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập định danh tài liệu"
                    value={currentBook.documentIdentifier || ""}
                    onChange={(e) => handleChange("documentIdentifier", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tên sách <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập tên sách"
                    value={currentBook.bookTitle || ""}
                    onChange={(e) => handleChange("bookTitle", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ký hiệu phân loại <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập ký hiệu phân loại"
                    value={currentBook.classificationSign || ""}
                    onChange={(e) => handleChange("classificationSign", e.target.value)}
                  />
                </div>
              </div>
              <Label className="text-base font-medium mb-2">Thông tin xuất bản</Label>
              <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Năm Xuất Bản <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Nhập năm xuất bản"
                    value={currentBook.publishYear || ""}
                    onChange={(e) => handleChange("publishYear", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nhà Xuất Bản <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập tên nhà xuất bản"
                    value={currentBook.publisherName || ""}
                    onChange={(e) => handleChange("publisherName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nơi Xuất Bản <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập nơi xuất bản"
                    value={currentBook.publisherPlaceName || ""}
                    onChange={(e) => handleChange("publisherPlaceName", e.target.value)}
                  />
                </div>
              </div>
              <Label className="text-base font-medium mb-2">Mô tả</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Số trang <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Nhập số trang"
                    value={currentBook.pages || ""}
                    onChange={(e) => handleChange("pages", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Giá bìa <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Nhập giá bìa"
                    value={currentBook.coverPrice || ""}
                    onChange={(e) => handleChange("coverPrice", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ngôn ngữ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập ngôn ngữ"
                    value={currentBook.language || ""}
                    onChange={(e) => handleChange("language", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cơ quan biên mục <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập cơ quan biên mục"
                    value={currentBook.catalogingAgency || ""}
                    onChange={(e) => handleChange("catalogingAgency", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kho lưu trữ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập kho lưu trữ"
                    value={currentBook.storageLocation || ""}
                    onChange={(e) => handleChange("storageLocation", e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveModal}>
                {modalMode === "create" ? "Thêm mới" : "Cập nhật"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ------------------- COMPONENT CHÍNH LibraryData ------------------- //
function LibraryData() {
  const [activeTab, setActiveTab] = useState("bookDetail");

  const menuSections = [
    {
      title: "Danh mục cơ bản",
      items: [
        { id: "documentType", label: "Phân loại tài liệu" },
        { id: "seriesName", label: "Tùng thư" },
        { id: "specialCode", label: "Mã quy ước" },
        { id: "authorList", label: "Danh sách tác giả" },
      ]
    },
    {
      title: "Dữ liệu sách",
      items: [
        { id: "bookInformation", label: "Đầu sách" },
        { id: "bookDetail", label: "Sách" },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "documentType":
        return <DocumentTypeComponent />;
      case "seriesName":
        return <SeriesNameComponent />;
      case "specialCode":
        return <SpecialCodeComponent />;
      case "authorList":
        return <AuthorListComponent />;
      case "bookInformation":
        return <LibraryInformationComponent />;
      case "bookDetail":
        return <BookDetailComponent />;
      default:
        return <div>Chọn một mục từ menu bên trái</div>;
    }
  };

  return (
    <div className="flex gap-6 p-6">
      {/* Sidebar */}
      <aside className="w-64">
        <Card>
          <CardContent className="p-0">
            <nav className="space-y-2">
              {menuSections.map((section, sectionIndex) => (
                <div key={section.title} className={sectionIndex > 0 ? "mt-4" : ""}>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40">
                    {section.title}
                  </div>
                  <div className="space-y-1 mt-1">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                          activeTab === item.id
                            ? "bg-accent text-accent-foreground font-medium"
                            : ""
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  );
}

export default LibraryData; 