import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentTypeComponent } from "./components/DocumentType";
import { SeriesNameComponent } from "./components/SeriesName";
import { SpecialCodeComponent } from "./components/SpecialCode";
import { AuthorListComponent } from "./components/AuthorList";
import { BookComponent } from "./components/Book";
import { BookDetailComponent } from "./components/BookDetail";

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
        return <BookComponent />;
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