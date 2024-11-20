import React from "react";

export default function Metrics({ setSelectedMenu }) {
  React.useEffect(() => {
    setSelectedMenu("Metrics");
  }, [setSelectedMenu]);

  return (
    <div>
      {/* Content for Metrics page */}
    </div>
  );
}