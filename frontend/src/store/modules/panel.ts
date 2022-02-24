const namespaced = true

interface State {
    visible: boolean;
    content: string;
}

const state = (): State => ({
    visible: false,
    content: null,
})

const getters = {
    isVisible: (state): boolean => state.visible,
    content: (state): string => state.content,
}

const actions = {
    toggle: ({ commit }) => {
        commit('TOGGLE_PANEL')
    },
    close: ({ commit }) => {
        commit('CLOSE_PANEL')
        setTimeout(() => commit('SET_CONTENT', ''), 300)
    },
    setContent: ({ commit }, content: string) => {
        commit('SET_CONTENT', content)
    }
}

const mutations = {
    TOGGLE_PANEL: (state) => {
        state.visible = !state.visible
    },
    CLOSE_PANEL: (state) => {
        state.visible = false
    },
    SET_CONTENT: (state, content: string) => {
        state.content = content !== state.content ? content : null
    }
}

export default { namespaced, state, getters, actions, mutations }