import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-[#34B27B] hover:bg-[#2d9e6c] text-white shadow-lg shadow-[#34B27B]/20',
  secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/10',
  ghost: 'hover:bg-white/10 text-slate-400 hover:text-white',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  outline: 'border border-white/15 hover:border-white/30 text-slate-300 hover:text-white hover:bg-white/5',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-sm rounded-xl',
  xl: 'px-8 py-4 text-base rounded-2xl',
  icon: 'w-8 h-8 rounded-lg flex items-center justify-center',
  'icon-sm': 'w-7 h-7 rounded-md flex items-center justify-center',
  'icon-lg': 'w-10 h-10 rounded-xl flex items-center justify-center',
}

const Button = forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer select-none',
        'active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34B27B]/50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export { Button }
