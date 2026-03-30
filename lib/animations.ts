import { Variants } from 'framer-motion';

// Ink-like ease curve (brush stroke motion)
const inkEase = [0.22, 1, 0.36, 1] as const;

// Page-level entrance with staggered children
export const pageVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: inkEase, staggerChildren: 0.08 },
    },
};

// Card entrance - elegant fade-up without scale
export const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: inkEase },
    },
    exit: {
        opacity: 0,
        y: -12,
        transition: { duration: 0.25, ease: 'easeIn' },
    },
};

// Horizontal line reveal (ink spreading on paper)
export const lineRevealVariants: Variants = {
    hidden: { scaleX: 0, originX: 0 },
    visible: {
        scaleX: 1,
        transition: { duration: 0.8, ease: inkEase },
    },
};

// Stagger container
export const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};

// Stagger child
export const staggerChild: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: inkEase },
    },
};

// Form elements
export const formVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4, delay: 0.1 },
    },
};

// Fade in
export const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4 },
    },
};

// Subtle button interaction - refined, minimal
export const buttonHoverVariants: Variants = {
    hover: { y: -1, transition: { duration: 0.2 } },
    tap: { y: 0, scale: 0.99 },
};

// Gallery card entrance (staggered)
export const galleryCardVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: inkEase },
    },
};

// Success animation
export const successVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 180, damping: 16 },
    },
};
