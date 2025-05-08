import React, { useEffect } from "react";
import Carousel from "./Carousel";

const LoginCarousel = () => {
  const testimage =
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=2020&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const testimage2 =
    "https://images.unsplash.com/photo-1729006076706-888c334c11ed?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const testimage3 =
    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const slides = [
    {
      image: testimage,
      name: "Data Management",
      text: "Aggregate, trach and furnish real-time reports on your ESG performance.",
    },
    {
      image: testimage2,
      name: "Investment",
      text: "Supercharge Your Investment decisions while uploading compliance standards",
    },
    {
      image: testimage3,
      name: "Net Zero",
      text: "Stay informed on yo GreenHouser Gas footprint and avoidance statics.",
    },
  ].map((data) => {
    return (
      <div className="h-screen w-full relative">
        <img
          src={data.image}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute px-8 py-24 top-0 left-0 h-full w-full flex flex-col justify-end items-start text-white bg-black/50 gap-4">
          <h2 className="text-2xl font-bold">{data.name}</h2>
          <h2 className="max-w-xs">{data.text}</h2>
        </div>
      </div>
    );
  });

  useEffect(() => {}, []);

  return (
    <div className="w-full overflow-hidden flex flex-col justify-evenly items-center col-span-2">
      <div className="h-screen w-full loginpage relative">
        <Carousel data={slides} setnum={1} setmode="fadeout" />
      </div>
    </div>
  );
};

export default LoginCarousel;
