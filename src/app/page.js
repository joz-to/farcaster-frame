"use client";

import { useState } from "react";
import { fetchWarpcastData } from "../lib/api";

export default function Home() {
  // State definitions
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // mode: "" | "followbackUnder" | "followbackAbove" | "share"
  const [mode, setMode] = useState("");
  const [cancelRequested, setCancelRequested] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  // برای ذخیره لینک انتشار
  const [shareLink, setShareLink] = useState("");
  const itemsPerPage = 10;

  // شناسه کاربر فعلی (client) از طریق متغیر محیطی
  const clientFID = process.env.NEXT_PUBLIC_CLIENT_FID;
  // شناسه مورد نیاز: 389830 (0xbamse.eth)
  const requiredFID = 389830;

  // Helper function: Fetch all data with pagination support
  const fetchAllData = async (endpoint, apiKey) => {
    let results = [];
    let cursor = "";
    try {
      do {
        let url = endpoint;
        if (cursor) {
          url += `&cursor=${cursor}`;
        }
        if (!url.includes("limit=")) {
          url += "&limit=100";
        }
        const response = await fetchWarpcastData(url, apiKey);
        results = results.concat(response.result.users);
        cursor = response.next?.cursor || "";
      } while (cursor);
      return results;
    } catch (error) {
      console.error("Error in fetchAllData:", error.message || JSON.stringify(error));
      throw error;
    }
  };

  // بررسی می‌کند که آیا کاربر (clientFID) حساب مورد نیاز (0xbamse.eth) را فالو کرده یا نه.
  const checkIfUserFollowsRequired = async (apiKey) => {
    // اگر کاربر خودش 0xbamse.eth باشد، استثنا می‌شود
    if (clientFID === String(requiredFID)) {
      return true;
    }
    const following = await fetchAllData(`v2/following?fid=${clientFID}`, apiKey);
    return following.some(user => user.fid === requiredFID);
  };

  //-------------------------------
  // Follow Back Checker – Under 10k Followers
  //-------------------------------
  const handleFollowBackUnder10k = async () => {
    setAnalysisDone(false);
    setLoading(true);
    setFilteredUsers([]);
    setCurrentPage(1);
    try {
      const apiKey = process.env.NEXT_PUBLIC_WARPCAST_API_KEY;
      const followsRequired = await checkIfUserFollowsRequired(apiKey);
      if (!followsRequired) {
        alert("Please follow 0xbamse.eth first to use this frame.");
        setLoading(false);
        setAnalysisDone(true);
        return;
      }
      const followerUsers = await fetchAllData(`v2/followers?fid=${clientFID}`, apiKey);
      if (followerUsers.length === 0) {
        alert("You have no followers. Please follow some accounts first.");
        setLoading(false);
        setAnalysisDone(true);
        return;
      }
      const followingUsers = await fetchAllData(`v2/following?fid=${clientFID}`, apiKey);
      const followerFids = followerUsers.map(user => user.fid);
      let notFollowedBack = followingUsers.filter(user => !followerFids.includes(user.fid));
      notFollowedBack = notFollowedBack.filter(user => user.followerCount < 10000);
      setFilteredUsers(notFollowedBack);
    } catch (error) {
      console.error("Error in Follow Back Under 10k Analysis:", error.message || JSON.stringify(error));
      alert(`An error occurred: ${error.message || "Unknown error"}`);
    }
    setAnalysisDone(true);
    setLoading(false);
  };

  //-------------------------------
  // Follow Back Checker – 10k+ Followers
  //-------------------------------
  const handleFollowBackAbove10k = async () => {
    setAnalysisDone(false);
    setLoading(true);
    setFilteredUsers([]);
    setCurrentPage(1);
    try {
      const apiKey = process.env.NEXT_PUBLIC_WARPCAST_API_KEY;
      const followsRequired = await checkIfUserFollowsRequired(apiKey);
      if (!followsRequired) {
        alert("Please follow 0xbamse.eth first to use this frame.");
        setLoading(false);
        setAnalysisDone(true);
        return;
      }
      const followerUsers = await fetchAllData(`v2/followers?fid=${clientFID}`, apiKey);
      if (followerUsers.length === 0) {
        alert("You have no followers. Please follow some accounts first.");
        setLoading(false);
        setAnalysisDone(true);
        return;
      }
      const followingUsers = await fetchAllData(`v2/following?fid=${clientFID}`, apiKey);
      const followerFids = followerUsers.map(user => user.fid);
      let notFollowedBack = followingUsers.filter(user => !followerFids.includes(user.fid));
      notFollowedBack = notFollowedBack.filter(user => user.followerCount >= 10000);
      setFilteredUsers(notFollowedBack);
    } catch (error) {
      console.error("Error in Follow Back Above 10k Analysis:", error.message || JSON.stringify(error));
      alert(`An error occurred: ${error.message || "Unknown error"}`);
    }
    setAnalysisDone(true);
    setLoading(false);
  };

  //-------------------------------
  // Share This Frame Option
  //-------------------------------
  const handleShareFrame = () => {
    // به عنوان مثال یک لینک آماده نمایش داده می‌شود.
    const link = "https://warpcast.com/~/compose?text=I%20just%20joined%20this%20waitlist%3A%0A%0ANEXT%20ON%20BASE&embeds[]=https%3A%2F%2Fyourdomain.com%2Fyourframe";
    // به صورت تب جدید باز می‌شود
    window.open(link, "_blank", "noopener,noreferrer");
    setShareLink(link);
    setMode("share");
    setAnalysisDone(true);
  };

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedItems = filteredUsers.slice(startIndex, endIndex);

  // Cancel Analysis function
  const handleCancelAnalysis = () => {
    setCancelRequested(true);
    setMode("");
    setFilteredUsers([]);
    setCurrentPage(1);
    setLoading(false);
    setAnalysisDone(false);
    setShareLink("");
  };

  // Back button: reset to main menu
  const handleBack = () => {
    if (!loading) {
      setMode("");
      setFilteredUsers([]);
      setCurrentPage(1);
      setAnalysisDone(false);
      setShareLink("");
    }
  };

  return (
    <div style={{
      padding: "2rem",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      background: "linear-gradient(135deg, #f0f4f8, #d9e2ec)"
    }}>
      <h1 style={{ fontSize: "2.5rem", color: "#0070f3", marginBottom: "0.5rem" }}>
        🚀 Warpcast Follow Checker
      </h1>
      <p style={{ fontSize: "1.2rem", color: "#666", marginBottom: "2rem" }}>
        Analyze your follow-back relationships.
      </p>

      {/* Back / Cancel buttons */}
      {mode !== "" && (
        <div style={{ marginBottom: "1rem", textAlign: "left" }}>
          {loading ? (
            <button
              onClick={handleCancelAnalysis}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                backgroundColor: "#f44336",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginLeft: "1rem",
                color: "#fff"
              }}
            >
              Cancel Analysis
            </button>
          ) : (
            <button
              onClick={handleBack}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                backgroundColor: "#ddd",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginLeft: "1rem"
              }}
            >
              Back
            </button>
          )}
        </div>
      )}

      {/* Main Menu Options */}
      {mode === "" && (
        <div style={{ marginBottom: "1.5rem" }}>
          {/* ردیف اول: دکمه‌های Follow Back */}
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setMode("followbackUnder");
                handleFollowBackUnder10k();
              }}
              style={{
                flex: "1 1 300px",
                padding: "1rem 1.5rem",
                fontSize: "1rem",
                color: "#fff",
                backgroundColor: "#0070f3",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
              }}
            >
              Follow Back Checker (Under 10k Followers)
            </button>
            <button
              onClick={() => {
                setMode("followbackAbove");
                handleFollowBackAbove10k();
              }}
              style={{
                flex: "1 1 300px",
                padding: "1rem 1.5rem",
                fontSize: "1rem",
                color: "#fff",
                backgroundColor: "#0070f3",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
              }}
            >
              Follow Back Checker (10k+ Followers)
            </button>
          </div>
          {/* ردیف دوم: دکمه بزرگ Share */}
          <div style={{ marginTop: "1.5rem" }}>
            <button
              onClick={handleShareFrame}
              style={{
                width: "80%",
                maxWidth: "500px",
                padding: "1.25rem 1.5rem",
                fontSize: "1.1rem",
                color: "#fff",
                backgroundColor: "#28a745",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.15)"
              }}
            >
              Share This Frame
            </button>
          </div>
          <p style={{ marginTop: "1rem", fontSize: "1.1rem", color: "#555" }}>
            Please select an option.
          </p>
        </div>
      )}

      {/* Loading message */}
      {loading && (
        <p style={{ color: "#0070f3", fontSize: "1.2rem", marginTop: "1rem" }}>
          🔄 Please wait, processing your data...
        </p>
      )}

      {/* Display analysis results for follow back modes */}
      {(!loading && filteredUsers.length > 0 && (mode === "followbackUnder" || mode === "followbackAbove")) && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.8rem", color: "#ff4d4f", marginBottom: "1rem" }}>
            {mode === "followbackUnder"
              ? "Follow Back Checker (Under 10k Followers)"
              : "Follow Back Checker (10k+ Followers)"}
          </h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {displayedItems.map((user, index) => (
              <li key={index} style={{
                  fontSize: "1.2rem",
                  padding: "0.8rem 1rem",
                  marginBottom: "0.8rem",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0px 2px 4px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={user.pfp?.url || "https://via.placeholder.com/50"}
                    alt={`${user.username || user.fid}'s profile`}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      marginRight: "15px",
                      objectFit: "cover"
                    }}
                  />
                  {user.username ? (
                    <a
                      href={`https://warpcast.com/${user.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: "bold", fontSize: "1rem", color: "#0070f3", textDecoration: "none" }}
                    >
                      {user.username}
                    </a>
                  ) : (
                    <span style={{ fontWeight: "bold", fontSize: "1rem" }}>
                      FID: {user.fid}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => alert(`Unfollow ${user.username || user.fid}`)}
                  style={{
                    backgroundColor: "#ff4d4f",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    padding: "0.6rem 1rem",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  Unfollow
                </button>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: "1.5rem" }}>
            <button
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={currentPage === 1}
              style={{
                marginRight: "0.5rem",
                padding: "0.6rem 1rem",
                fontSize: "1rem",
                backgroundColor: "#ddd",
                border: "none",
                borderRadius: "5px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage)}
              style={{
                padding: "0.6rem 1rem",
                fontSize: "1rem",
                backgroundColor: "#ddd",
                border: "none",
                borderRadius: "5px",
                cursor:
                  currentPage === Math.ceil(filteredUsers.length / itemsPerPage) ? "not-allowed" : "pointer",
                opacity: currentPage === Math.ceil(filteredUsers.length / itemsPerPage) ? 0.5 : 1
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Display share message if mode is "share" */}
      {mode === "share" && !loading && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.8rem", color: "#28a745", marginBottom: "1rem" }}>
            Share This Frame
          </h2>
          <p style={{ fontSize: "1.2rem", color: "#555" }}>
            Your share link has been opened in a new window. You can also copy this link:
          </p>
          <p style={{ fontSize: "1rem", backgroundColor: "#f0f0f0", padding: "0.5rem", borderRadius: "4px", wordBreak: "break-all", marginTop: "0.5rem" }}>
            {shareLink}
          </p>
        </div>
      )}

      {/* عرض پیام پیش‌فرض اگر تحلیل انجام نشده باشد */}
      {(!loading && filteredUsers.length === 0 && analysisDone && mode !== "share") && (
        <p style={{ color: "#28a745", fontSize: "1.2rem", marginTop: "2rem" }}>
          🎉 No matching users found.
        </p>
      )}

      <footer style={{ marginTop: "3rem", color: "#777" }}>
        Built with ❤️
        <a
          href="https://warpcast.com/0xbamse.eth"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "#0070f3", marginLeft: "0.5rem" }}
        >
          0xbamse
        </a>
      </footer>
    </div>
  );
}