import React, { useState } from "react";

const LanguageToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="flex items-center space-x-3">
      <div className="w-20 h-8 flex items-center justify-center bg-white rounded-[15px] shadow-[2px_1px_6px_0px_rgba(0,0,0,0.25)] border border-white text-base font-bold">
        English
      </div>

      <button
        onClick={() => setEnabled(!enabled)}
        className={`w-16 h-8 rounded-[30px] relative transition ${
          enabled ? "bg-blue-500" : "bg-zinc-300"
        }`}
      >
        <div
          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition ${
            enabled ? "right-1" : "left-1"
          }`}
        />
      </button>
    </div>
  );
};

export default LanguageToggle;
