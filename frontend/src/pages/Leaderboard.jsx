import React, { useState, useEffect, useMemo } from "react";
import "./Dashboard.css";
import ClothingAPI from "../utils/api";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ForestIcon from '@mui/icons-material/Forest';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RecyclingIcon from '@mui/icons-material/Recycling';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortColumn, setSortColumn] = useState("user_id");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const data = await ClothingAPI.getLeaderboard();
        console.log("Leaderboard API response:", data);
        const users = Array.isArray(data) ? data : data.leaderboard || data.users || data.data || [];
        console.log("Users array:", users);
        // Add rank based on position in array
        const usersWithRank = users.map((user, index) => ({
          ...user,
          rank: index + 1
        }));
        console.log("Users with rank:", usersWithRank);
        setLeaderboardData(usersWithRank);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
        setError("Failed to load leaderboard. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedData = useMemo(() => {
    if (!Array.isArray(leaderboardData)) {
      console.log("leaderboardData is not an array:", leaderboardData);
      return [];
    }
    const sorted = [...leaderboardData].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (sortColumn === "display_name" || sortColumn === "location" || sortColumn === "username") {
        aVal = aVal || "";
        bVal = bVal || "";
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      // Handle missing values
      aVal = aVal ?? 0;
      bVal = bVal ?? 0;
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
    console.log("Sorted data:", sorted);
    return sorted;
  }, [leaderboardData, sortColumn, sortDirection]);

  const getArrow = (column) => {
    if (sortColumn !== column) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  const getHeaderClass = (column) =>
    sortColumn === column ? "active-sort" : "";

  const getTopThree = () => {
    if (!Array.isArray(leaderboardData) || leaderboardData.length === 0) return [];
    return leaderboardData.slice(0, 3);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { class: "gold", icon: "🥇", label: "Gold" };
    if (rank === 2) return { class: "silver", icon: "🥈", label: "Silver" };
    if (rank === 3) return { class: "bronze", icon: "🥉", label: "Bronze" };
    return null;
  };

  const formatNumber = (num, decimals = 1) => {
    if (num === null || num === undefined) return "—";
    return typeof num === "number" ? num.toFixed(decimals) : num;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvailableStats = (user) => {
    const stats = [];
    if (user.cumulative_co2_saved_kg !== undefined) {
      stats.push({ label: "CO₂", value: formatNumber(user.cumulative_co2_saved_kg) + " kg", icon: "co2" });
    }
    if (user.cumulative_water_saved_liters !== undefined) {
      stats.push({ label: "Water", value: formatNumber(user.cumulative_water_saved_liters, 0) + " L", icon: "water" });
    }
    if (user.cumulative_energy_saved_kwh !== undefined) {
      stats.push({ label: "Energy", value: formatNumber(user.cumulative_energy_saved_kwh) + " kWh", icon: "energy" });
    }
    if (user.impact_points !== undefined) {
      stats.push({ label: "Points", value: formatNumber(user.impact_points, 0), icon: "points" });
    }
    if (user.total_swaps !== undefined) {
      stats.push({ label: "Swaps", value: user.total_swaps, icon: "swaps" });
    }
    return stats;
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const topThree = getTopThree();

  return (
    <div className="leaderboard-page">
      {/* Header */}
      <div className="leaderboard-header">
        <div className="leaderboard-header-content">
          <EmojiEventsIcon className="leaderboard-header-icon" />
          <div>
            <h1>Sustainability Leaderboard</h1>
            <p>Top contributors making a difference for our planet</p>
          </div>
        </div>
      </div>

      {/* Podium Section */}
      {topThree.length > 0 && (
        <div className="podium-section">
          {topThree.map((user, index) => {
            const rankBadge = getRankBadge(user?.rank);
            const order = index === 0 ? 1 : index === 1 ? 0 : 2;
            const actualUser = topThree[order];
            if (!actualUser) return null;
            const stats = getAvailableStats(actualUser);
            
            return (
              <div 
                key={actualUser.user_id} 
                className={`podium-card ${rankBadge?.class || ''} ${order === 1 ? 'podium-center' : ''}`}
              >
                <div className="podium-rank-badge">{rankBadge?.icon || actualUser.rank}</div>
                <div className="podium-avatar">
                  {getInitials(actualUser.display_name)}
                </div>
                <h3 className="podium-name">{actualUser.display_name}</h3>
                {actualUser.location && <p className="podium-location">{actualUser.location}</p>}
                <div className="podium-stats">
                  {stats.slice(0, 3).map((stat, i) => (
                    <div key={i} className="podium-stat">
                      <span className={`podium-stat-icon ${stat.icon}`}>
                        {stat.icon === 'co2' && <LocalFireDepartmentIcon />}
                        {stat.icon === 'water' && <WaterDropIcon />}
                        {stat.icon === 'energy' && <ForestIcon />}
                        {stat.icon === 'points' && <EmojiEventsIcon />}
                        {stat.icon === 'swaps' && <RecyclingIcon />}
                      </span>
                      <span>{stat.value}</span>
                    </div>
                  ))}
                </div>
                {actualUser.badges && actualUser.badges.length > 0 && (
                  <div className="podium-badges">
                    {actualUser.badges.map((badge, i) => (
                      <span key={i} className="podium-badge">{badge}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="leaderboard-table-section">
        <div className="leaderboard-table-header">
          <h2>All Participants</h2>
        </div>
        <div className="table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th 
                  className={getHeaderClass("rank")} 
                  onClick={() => handleSort("rank")}
                >
                  Rank{getArrow("rank")}
                </th>
                <th 
                  className={getHeaderClass("display_name")} 
                  onClick={() => handleSort("display_name")}
                >
                  User{getArrow("display_name")}
                </th>
                <th 
                  className={getHeaderClass("location")} 
                  onClick={() => handleSort("location")}
                >
                  Location{getArrow("location")}
                </th>
                <th 
                  className={getHeaderClass("total_swaps")} 
                  onClick={() => handleSort("total_swaps")}
                >
                  Swaps{getArrow("total_swaps")}
                </th>
                <th 
                  className={getHeaderClass("cumulative_co2_saved_kg")} 
                  onClick={() => handleSort("cumulative_co2_saved_kg")}
                >
                  CO₂ Saved{getArrow("cumulative_co2_saved_kg")}
                </th>
                <th 
                  className={getHeaderClass("cumulative_water_saved_liters")} 
                  onClick={() => handleSort("cumulative_water_saved_liters")}
                >
                  Water Saved{getArrow("cumulative_water_saved_liters")}
                </th>
                <th>Points</th>
                <th>Badges</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((user) => (
                <tr key={user.user_id}>
                  <td>
                    <span className={`rank-badge rank-${user.rank}`}>
                      {user.rank}
                    </span>
                  </td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-small">
                        {getInitials(user.display_name)}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{user.display_name}</span>
                        <span className="user-username">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.location || "—"}</td>
                  <td>{user.total_swaps ?? "—"}</td>
                  <td>{formatNumber(user.cumulative_co2_saved_kg)} kg</td>
                  <td>{formatNumber(user.cumulative_water_saved_liters, 0)} L</td>
                  <td>{formatNumber(user.impact_points, 0)}</td>
                  <td>
                    <div className="badges-cell">
                      {user.badges && user.badges.length > 0 ? (
                        user.badges.map((badge, i) => (
                          <span key={i} className="table-badge">{badge}</span>
                        ))
                      ) : (
                        <span className="no-badges">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
