export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const stagger = (i: number, step = 0.05) => ({
  transition: { delay: i * step },
});
