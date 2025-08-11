import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { TICKETS_API_URL } from "../../../../config/api";

interface TechnicalStats {
  success: boolean;
  averageRating: number;
  totalFeedbacks: number;
  badgesCount?: Record<string, number>;
}

interface TechnicalRatingProps {
  technicalId: string;
}

const TechnicalRating: React.FC<TechnicalRatingProps> = ({ technicalId }) => {
  const [stats, setStats] = useState<TechnicalStats | null>(null);

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        const res = await axios.get<TechnicalStats>(
          `${TICKETS_API_URL}/technical-stats/${technicalId}`
        );
        if (res.data.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error("Error fetching technical stats:", error);
      }
    };
    
    if (technicalId) {
      fetchStats();
    }
  }, [technicalId]);

  if (!stats) {
    return <div className="text-xs text-gray-500">Loading...</div>;
  }

  const { averageRating, totalFeedbacks } = stats;

  // Hàm render sao dựa vào averageRating (tính theo 5 sao)
  const renderStars = (): React.ReactElement[] => {
    const stars: React.ReactElement[] = [];
    // Duyệt từ 1 đến 5 để tạo 5 vị trí sao
    for (let i = 1; i <= 5; i++) {
      if (averageRating >= i) {
        // Hiển thị sao đầy
        stars.push(<FaStar key={i} className="text-orange-500" />);
      } else if (averageRating >= i - 0.5) {
        // Hiển thị nửa sao
        stars.push(<FaStarHalfAlt key={i} className="text-orange-500" />);
      } else {
        // Hiển thị sao rỗng
        stars.push(<FaRegStar key={i} className="text-orange-400" />);
      }
    }
    return stars;
  };



  return (
    <div className="flex items-center gap-1">
      <span className="flex items-center text-xs font-bold">
        {averageRating.toFixed(1)}
      </span>
      <span className="flex items-center text-xs">{renderStars()}</span>
      <span className="text-xs text-gray-500">({totalFeedbacks})</span>
    </div>
  );
};

export default TechnicalRating; 