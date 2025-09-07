// src/components/ui/MiniMap.jsx
import React, { useState, useEffect } from "react";

export default function MiniMap({ currentRoom, onRoomChange, playerRotation = 0 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: "0px", top: "0px" });

  // Update player indicator when room changes
  useEffect(() => {
    if (currentRoom === "room1") {
      setIndicatorStyle({ left: "103px", top: "155px" });
    } else if (currentRoom === "room2") {
      setIndicatorStyle({ left: "101px", top: "75px" });
    } else if (currentRoom === "room3") {
      setIndicatorStyle({ left: "37px", top: "18px" });
    }
  }, [currentRoom]);

  // Handle clicking inside expanded map
  const handleMapClick = (e) => {
    if (!isExpanded) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Example zones (adjust manually for your map)
    if (x > 50 && x < 100 && y > 80 && y < 130) {
      onRoomChange("room1");
    } else if (x > 120 && x < 170 && y > 80 && y < 130) {
      onRoomChange("room2");
    } else if (x > 190 && x < 240 && y > 80 && y < 130) {
      onRoomChange("room3");
    }
  };

  return (
    <div
      onClick={handleMapClick}
      style={{
        position: "fixed",
        top: isExpanded ? "10%" : "20px",
        left: isExpanded ? "10%" : "20px",
        width: isExpanded ? "80%" : "200px",
        height: isExpanded ? "80%" : "150px",
        background: "rgba(0,0,0,0.6)",
        border: "2px solid white",
        zIndex: 9999,
        cursor: isExpanded ? "crosshair" : "pointer",
        transition: "all 0.3s ease-in-out",
      }}
      onDoubleClick={() => setIsExpanded(!isExpanded)} // double click toggles expand
    >
      <img
        src="/assets/minimap.PNG"
        alt="Mini Map"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* 🔺 Player Indicator as an arrow */}
      <div
        style={{
          position: "absolute",
          width: "0",
          height: "0",
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderBottom: "20px solid blue",
          left: indicatorStyle.left,
          top: indicatorStyle.top,
          transform: `translate(-50%, -50%) rotate(${playerRotation}rad)`, // rotate with camera
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
