import React from "react";

export default function Users({ setSelectedMenu }) {
  React.useEffect(() => {
    setSelectedMenu("Users");
  }, [setSelectedMenu]);

  return (
    <div>
      {/* Content for Users page */}
    </div>
  );
}