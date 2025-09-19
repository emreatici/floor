import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useWorldStore = create(
  subscribeWithSelector((set, get) => ({
    worldState: null,
    selectedCharacter: null,
    activeConversations: [],
    socket: null,
    isConnected: false,
    simulationSpeed: 1,
    isPaused: false,

    setWorldState: (worldState) => set({ worldState }),

    setSelectedCharacter: (character) => set({ selectedCharacter: character }),

    setSocket: (socket) => set({ socket }),

    setConnected: (isConnected) => set({ isConnected }),

    updateCharacter: (characterId, updates) => set((state) => {
      if (!state.worldState || !state.worldState.characters) return state;

      const characters = state.worldState.characters.map(char =>
        char.id === characterId ? { ...char, ...updates } : char
      );

      const updatedWorldState = { ...state.worldState, characters };
      const updatedSelectedCharacter = state.selectedCharacter?.id === characterId
        ? { ...state.selectedCharacter, ...updates }
        : state.selectedCharacter;

      return {
        worldState: updatedWorldState,
        selectedCharacter: updatedSelectedCharacter
      };
    }),

    addConversation: (conversation) => set((state) => ({
      activeConversations: [...state.activeConversations, conversation]
    })),

    updateConversation: (conversationId, updates) => set((state) => ({
      activeConversations: state.activeConversations.map(conv =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      )
    })),

    removeConversation: (conversationId) => set((state) => ({
      activeConversations: state.activeConversations.filter(conv => conv.id !== conversationId)
    })),

    setSimulationSpeed: (speed) => {
      set({ simulationSpeed: speed });
      const { socket } = get();
      if (socket) {
        socket.emit('setSimulationSpeed', speed);
      }
    },

    togglePause: () => {
      set((state) => ({ isPaused: !state.isPaused }));
      const { socket } = get();
      if (socket) {
        socket.emit('pauseSimulation');
      }
    },

    moveCharacter: (characterId, newPosition) => {
      const { socket } = get();
      if (socket) {
        socket.emit('moveCharacter', { characterId, position: newPosition });
      }
    },

    sendMessage: (conversationId, message) => {
      const { socket } = get();
      if (socket) {
        socket.emit('sendMessage', { conversationId, message });
      }
    },

    getCharacterById: (characterId) => {
      const { worldState } = get();
      if (!worldState || !worldState.characters) return null;
      return worldState.characters.find(char => char.id === characterId);
    },

    getNearbyCharacters: (position, radius = 3) => {
      const { worldState } = get();
      if (!worldState || !worldState.characters) return [];

      return worldState.characters.filter(char => {
        const distance = Math.sqrt(
          Math.pow(char.position.x - position.x, 2) +
          Math.pow(char.position.y - position.y, 2)
        );
        return distance <= radius;
      });
    },

    getCharacterNeeds: (characterId) => {
      const character = get().getCharacterById(characterId);
      return character ? character.needs : null;
    },

    initializeSocket: () => {
      const socket = get().socket;
      if (!socket) return;

      socket.on('worldUpdate', (worldState) => {
        set({ worldState });
      });

      socket.on('characterUpdate', ({ characterId, updates }) => {
        get().updateCharacter(characterId, updates);
      });

      socket.on('conversationStarted', (conversation) => {
        get().addConversation(conversation);
      });

      socket.on('conversationUpdate', ({ conversationId, updates }) => {
        get().updateConversation(conversationId, updates);
      });

      socket.on('newMessage', ({ conversationId, message }) => {
        get().updateConversation(conversationId, {
          messages: [
            ...(get().activeConversations.find(c => c.id === conversationId)?.messages || []),
            message
          ],
          lastMessage: message
        });
      });

      socket.on('simulationStateChanged', ({ isPaused }) => {
        set({ isPaused });
        console.log('Simulation state changed:', isPaused ? 'paused' : 'resumed');
      });

      socket.on('simulationSpeedChanged', ({ speed }) => {
        set({ simulationSpeed: speed });
        console.log('Simulation speed changed:', speed + 'x');
      });

      socket.on('connect', () => {
        set({ isConnected: true });
        console.log('Sunucuya bağlandı');
      });

      socket.on('disconnect', () => {
        set({ isConnected: false });
        console.log('Sunucu bağlantısı kesildi');
      });

      socket.on('error', (error) => {
        console.error('Socket hatası:', error);
      });
    },

    cleanup: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
      }
      set({
        worldState: null,
        selectedCharacter: null,
        activeConversations: [],
        socket: null,
        isConnected: false
      });
    }
  }))
);

export default useWorldStore;