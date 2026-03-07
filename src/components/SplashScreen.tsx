"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils } from "lucide-react";

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 0.8, ease: "easeInOut" }
                    }}
                    className="splash-container"
                >
                    <div className="splash-glow" />

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            transition: {
                                duration: 1,
                                ease: [0.16, 1, 0.3, 1]
                            }
                        }}
                        className="splash-logo-wrapper"
                    >
                        <div className="splash-logo-box">
                            <Utensils className="w-12 h-12 text-[#1a0f0a]" strokeWidth={2.5} />
                        </div>

                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0, 0.5]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="splash-ring"
                        />
                    </motion.div>

                    <div className="text-center">
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{
                                y: 0,
                                opacity: 1,
                                transition: { delay: 0.3, duration: 0.8 }
                            }}
                            className="splash-title"
                        >
                            Legendário
                        </motion.h1>

                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: 120,
                                transition: { delay: 0.8, duration: 1, ease: "circOut" }
                            }}
                            className="splash-divider"
                        />

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 0.6,
                                transition: { delay: 1.2, duration: 0.8 }
                            }}
                            className="splash-subtitle"
                        >
                            Sabor & Tradição
                        </motion.p>
                    </div>

                    <div className="splash-loader-bg">
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{
                                scaleX: 1,
                                transition: { duration: 2.2, ease: "linear" }
                            }}
                            className="splash-loader-progress"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
