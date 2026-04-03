export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#fef2f2', 100:'#fee2e2', 500:'#ef4444', 600:'#dc2626', 700:'#b91c1c', 900:'#7f1d1d' },
        dark: { 900:'#0a0a0a', 800:'#111111', 700:'#1a1a1a', 600:'#242424', 500:'#2e2e2e', 400:'#3a3a3a', 300:'#4a4a4a' }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  }
}
