@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }
  html {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-[#1a3a6b] text-white rounded-lg font-medium text-sm
           hover:bg-[#102445] active:bg-[#0b1a32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-secondary {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium text-sm
           hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50;
  }
  
  .btn-danger {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm
           hover:bg-red-700 transition-colors;
  }
  
  .btn-gold {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-[#c9a227] text-white rounded-lg font-medium text-sm
           hover:bg-[#b7891a] transition-colors;
  }
  
  .card {
    @apply bg-white rounded-xl border border-gray-200 shadow-sm;
  }
  
  .input {
    @apply w-full px-3 py-2 text-sm border border-gray-200 rounded-lg 
           focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent
           placeholder:text-gray-400;
  }
  
  .label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
  
  .badge-verde {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700;
  }
  
  .badge-amarillo {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700;
  }
  
  .badge-rojo {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700;
  }
  
  .badge-azul {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700;
  }
  
  .badge-gris {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600;
  }

  .badge-dorado {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700;
  }

  .table-header {
    @apply text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4;
  }
  
  .table-cell {
    @apply py-3 px-4 text-sm text-gray-700;
  }
}
