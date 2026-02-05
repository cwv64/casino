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
    primary: `
      bg-gradient-to-b from-yellow-400 via-casino-gold to-yellow-600
      text-charcoal font-bold
      shadow-lg shadow-yellow-500/50
      hover:shadow-glow-gold-lg hover:from-yellow-300
      active:shadow-inner-soft active:translate-y-0.5
      disabled:from-gray-600 disabled:via-gray-600 disabled:to-gray-700
      border-b-4 border-yellow-600 hover:border-yellow-500
      disabled:border-gray-700
    `,
    secondary: `
      bg-gradient-to-b from-casino-green-light via-casino-green to-casino-green-dark
      border-2 border-casino-gold
      text-casino-gold font-bold
      shadow-lg shadow-casino-gold/30
      hover:shadow-glow-gold hover:from-casino-green
      active:shadow-inner-soft active:translate-y-0.5
      disabled:from-gray-700 disabled:via-gray-700 disabled:to-gray-800
      border-b-4 border-casino-gold/50
      disabled:border-gray-600
    `,
    danger: `
      bg-gradient-to-b from-red-500 via-casino-red to-red-700
      text-white font-bold
      shadow-lg shadow-red-500/50
      hover:shadow-glow-red hover:from-red-400
      active:shadow-inner-soft active:translate-y-0.5
      disabled:from-gray-600 disabled:via-gray-600 disabled:to-gray-700
      border-b-4 border-red-700 hover:border-red-600
      disabled:border-gray-700
    `,
    ghost: `
      bg-transparent backdrop-blur-sm
      border-2 border-casino-gold
      text-casino-gold font-semibold
      hover:bg-casino-gold/10 hover:shadow-glow-gold
      active:bg-casino-gold/20
      disabled:border-gray-600 disabled:text-gray-600
    `
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98, y: 1 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-xl
        transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-50
        relative overflow-hidden
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {/* Shine effect */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.button>
  );
};
