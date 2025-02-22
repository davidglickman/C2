// frontend/src/components/ui/input.js

import React from "react";

const Input = ({ type = "text", placeholder, onChange, className = "" }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      className={`px-3 py-2 border rounded ${className}`}
    />
  );
};

export default Input;
