import { motion } from 'framer-motion';

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-casino-gold text-charcoal hover:bg-yellow-500 disabled:bg-gray-600',
    secondary: 'bg-casino-green border-2 border-casino-gold text-casino-gold hover:bg-casino-green-light disabled:bg-gray-700',
    danger: 'bg-casino-red text-white hover:bg-red-700 disabled:bg-gray-600',
    ghost: 'bg-transparent border-2 border-casino-gold text-casino-gold hover:bg-casino-gold hover:text-charcoal disabled:border-gray-600 disabled:text-gray-600'
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-lg font-semibold
        transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-50
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
};
