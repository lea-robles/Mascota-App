import { ChatService } from '../services/chatService.js';

export const RenderChat = {
    activeSubscription: null,
    isLoading: false,
    conversationId: null,
    currentUserId: null,
    onSendMessageCallback: null,

    /**
     * Renderiza el timeline de chat completo
     * @param {HTMLElement} container - Contenedor donde renderizar
     * @param {string} conversationId - ID de la conversación
     * @param {string} currentUserId - ID del usuario logueado
     * @param {Array<Object>} messages - Array de mensajes a mostrar
     * @param {Function} onSendMessage - Callback al enviar mensaje
     */
    async draw(container, conversationId, currentUserId, messages = [], onSendMessage = null) {
        this.conversationId = conversationId;
        this.currentUserId = currentUserId;
        this.onSendMessageCallback = onSendMessage;

        // Estructura HTML del chat
        container.innerHTML = `
            <div class="flex flex-col h-screen bg-gray-50" style="max-width: 800px; margin: 0 auto;">
                <!-- Timeline de mensajes -->
                <div id="messages-timeline" class="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                    <!-- Los mensajes se renderizarán aquí -->
                </div>

                <!-- Input + Botón enviar (fijo abajo) -->
                <div class="bg-white border-t border-gray-200 p-4 sticky bottom-0">
                    <div class="flex gap-2 max-w-4xl mx-auto">
                        <input 
                            id="input-mensaje" 
                            type="text" 
                            placeholder="Escribe tu mensaje..." 
                            class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                            autocomplete="off"
                        />
                        <button 
                            id="btn-enviar" 
                            class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition flex items-center gap-2"
                        >
                            <i class="fas fa-paper-plane"></i>
                            <span class="hidden sm:inline">Enviar</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Renderizar mensajes iniciales
        if (messages && messages.length > 0) {
            this._renderMessages(messages);
        }

        // Configurar event listeners
        this._setupEventListeners();

        // Suscribirse a nuevos mensajes en tiempo real
        this.subscribeToNewMessages();

        // Scroll al último mensaje
        setTimeout(() => this._scrollToBottom(), 100);
    },

    /**
     * Renderiza un array de mensajes en el timeline
     * @param {Array<Object>} messages - Array de mensajes
     */
    _renderMessages(messages) {
        const timeline = document.getElementById('messages-timeline');
        if (!timeline) return;

        timeline.innerHTML = messages.map(msg => this._createMessageElement(msg)).join('');
    },

    /**
     * Crea el HTML para un mensaje individual
     * @param {Object} message - Objeto con propiedades del mensaje
     * @returns {string} HTML del mensaje
     */
    _createMessageElement(message) {
        const isCurrentUser = message.sender_id === this.currentUserId;
        const timestamp = new Date(message.created_at).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const readIndicator = message.read ? '✓✓' : '✓';
        const showReadIndicator = isCurrentUser ? readIndicator : '';

        const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
        const bgColor = isCurrentUser ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-900';
        const messageClass = isCurrentUser ? 'rounded-br-none' : 'rounded-bl-none';

        return `
            <div class="flex ${alignment} animate-fadeIn">
                <div class="max-w-xs md:max-w-md">
                    <div class="flex items-baseline gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}">
                        <span class="text-xs text-gray-500">${timestamp}</span>
                    </div>
                    <div class="flex items-end gap-1 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} mt-1">
                        <div class="${bgColor} px-4 py-2 rounded-lg ${messageClass} break-words shadow-sm">
                            <p class="text-sm md:text-base">${this._escapeHtml(message.message)}</p>
                        </div>
                        ${isCurrentUser ? `<span class="text-xs text-gray-500 ${message.read ? 'text-green-500' : ''}">${showReadIndicator}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Configura event listeners para input y botón
     */
    _setupEventListeners() {
        const inputMensaje = document.getElementById('input-mensaje');
        const btnEnviar = document.getElementById('btn-enviar');

        if (!inputMensaje || !btnEnviar) return;

        // Enviar al presionar Enter (excepto en mobile)
        inputMensaje.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._handleSendMessage();
            }
        });

        // Saltar línea con Shift+Enter
        inputMensaje.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.shiftKey) {
                // Permitir salto de línea
            }
        });

        // Clic en botón enviar
        btnEnviar.addEventListener('click', () => this._handleSendMessage());

        // Habilitar/deshabilitar botón según contenido
        inputMensaje.addEventListener('input', () => {
            btnEnviar.disabled = inputMensaje.value.trim().length === 0;
        });

        // Deshabilitar botón al inicio si input está vacío
        btnEnviar.disabled = inputMensaje.value.trim().length === 0;
    },

    /**
     * Maneja el envío de un mensaje
     */
    async _handleSendMessage() {
        const inputMensaje = document.getElementById('input-mensaje');
        const btnEnviar = document.getElementById('btn-enviar');

        if (!inputMensaje || !btnEnviar) return;

        const contenido = inputMensaje.value.trim();

        // Validación: no permitir mensajes vacíos
        if (!contenido) {
            inputMensaje.focus();
            return;
        }

        // Loading state
        this.isLoading = true;
        btnEnviar.disabled = true;
        const originalText = btnEnviar.innerHTML;
        btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            // Enviar mensaje a través de ChatService
            await ChatService.sendMessage(
                this.currentUserId,
                this.conversationId,
                contenido,
                null // publicationId (no aplica en chat privado)
            );

            // Limpiar input
            inputMensaje.value = '';
            inputMensaje.focus();

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            alert('Error al enviar el mensaje. Intenta de nuevo.');
        } finally {
            // Finalizar loading state
            this.isLoading = false;
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = originalText;
        }

        // Ejecutar callback personalizado si existe
        if (this.onSendMessageCallback) {
            try {
                this.onSendMessageCallback();
            } catch (error) {
                console.error('Error en callback onSendMessage:', error);
            }
        }
    },

    /**
     * Agrega un nuevo mensaje al timeline (para realtime)
     * @param {Object} message - Objeto del mensaje
     */
    addMessage(message) {
        const timeline = document.getElementById('messages-timeline');
        if (!timeline) return;

        const messageElement = this._createMessageElement(message);
        timeline.innerHTML += messageElement;
        
        // Scroll automático al nuevo mensaje
        this._scrollToBottom();
    },

    /**
     * Se suscribe a nuevos mensajes en tiempo real
     */
    subscribeToNewMessages() {
        if (!this.conversationId) return;

        try {
            // Cancelar suscripción anterior si existe
            if (this.activeSubscription) {
                this.activeSubscription.unsubscribe();
            }

            // Nueva suscripción
            this.activeSubscription = ChatService.subscribeToMessages(
                this.conversationId,
                (newMessage) => {
                    // Solo agregar si es un mensaje nuevo (no es el que acabamos de enviar)
                    if (newMessage.sender_id !== this.currentUserId) {
                        this.addMessage(newMessage);
                        
                        // Marcar como leído si es de otra persona
                        if (newMessage.id && !newMessage.read) {
                            ChatService.markAsRead([newMessage.id]).catch(err => 
                                console.error('Error marking as read:', err)
                            );
                        }
                    }
                }
            );
        } catch (error) {
            console.error('Error subscribing to messages:', error);
        }
    },

    /**
     * Desuscribirse de los mensajes en tiempo real
     */
    unsubscribeFromMessages() {
        if (this.activeSubscription) {
            this.activeSubscription.unsubscribe();
            this.activeSubscription = null;
        }
    },

    /**
     * Scroll automático al último mensaje
     */
    _scrollToBottom() {
        const timeline = document.getElementById('messages-timeline');
        if (timeline) {
            setTimeout(() => {
                timeline.scrollTop = timeline.scrollHeight;
            }, 0);
        }
    },

    /**
     * Escapa caracteres especiales en HTML
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    _escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
};
