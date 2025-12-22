import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import React from "react";

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({ children }) => {
  const location = useLocation();

  // Define animation variants for the flip effect
  const pageVariants = {
    initial: {
      rotateY: -90,
      opacity: 0,
    },
    in: {
      rotateY: 0,
      opacity: 1,
    },
    out: {
      rotateY: 90,
      opacity: 0,
    },
  };

  const pageTransition = {
    type: "spring",
    stiffness: 100,
    damping: 15,
    duration: 1.2,
  };
  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full h-screen"
    >
      {children}
    </motion.div>
  );
};

export default PageTransitionWrapper;