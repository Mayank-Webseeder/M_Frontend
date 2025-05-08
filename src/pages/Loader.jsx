import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-14 h-14 rounded-full border-[9px]  border-[#5A6ACF] animate-spin border-t-transparent"></div>
    </div>
  );
};

export default Loader;
