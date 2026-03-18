import React from "react";
import Lottie from "lottie-react";
import loaderAnimation from "./Searching_dark.json";

const Loader = () => {
  return (
  <div className="flex flex-col items-center justify-center h-screen bg-transparent">

      <style>
        {`
          @keyframes fadeInOut {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
          }
        `}
      </style>

      <p
        className="text-2xl font-bold text-white text-center "
        style={{
          animation: "fadeInOut 2s ease-in-out infinite",
        }}
      >
        We are scanning that URL
      </p>


      <Lottie
        animationData={loaderAnimation}
        loop={true}
        className="w-200 h-80"
      />


    </div>
  );
};

export default Loader;
