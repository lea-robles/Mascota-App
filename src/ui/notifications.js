export const UI = {
    showLoading(show) {
        document.getElementById('loading-overlay').classList.toggle('hidden', !show);
    },
    
    notify(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const color = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        
        toast.className = `${color} text-white px-6 py-3 rounded-xl shadow-lg transition-all animate-bounce-in font-bold`;
        toast.innerText = msg;
        
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};