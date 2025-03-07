interface RandomColorOptions {
  type: 'solid' | 'gradient';
  gradientType?: 'linear' | 'radial' | 'diagonal';
  gradientDirection?: 'to right' | 'to bottom' | 'to bottom right' | 'to bottom left';
}

// Generate a random hex color
const getRandomColor = (): string => {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
};

// Generate a random solid color
const generateRandomSolidColor = (): string => {
  return getRandomColor();
};

// Generate a random gradient
const generateRandomGradient = (
  gradientType: 'linear' | 'radial' | 'diagonal' = 'linear',
  direction: 'to right' | 'to bottom' | 'to bottom right' | 'to bottom left' = 'to right'
): string => {
  const color1 = getRandomColor();
  const color2 = getRandomColor();

  if (gradientType === 'linear') {
    return `linear-gradient(${direction}, ${color1}, ${color2})`;
  } else if (gradientType === 'radial') {
    return `radial-gradient(circle, ${color1}, ${color2})`;
  } else {
    // Diagonal gradient
    return `linear-gradient(45deg, ${color1}, ${color2})`;
  }
};

// Main function to generate random background
const generateRandomBackground = (options: RandomColorOptions): string => {
  if (options.type === 'solid') {
    return generateRandomSolidColor();
  } else {
    return generateRandomGradient(
      options.gradientType || 'linear',
      options.gradientDirection || 'to right'
    );
  }
};

export {
  generateRandomBackground,
  generateRandomSolidColor,
  generateRandomGradient,
  getRandomColor
};

export type { RandomColorOptions };